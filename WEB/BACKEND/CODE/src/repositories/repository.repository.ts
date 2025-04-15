import {Prisma, PrismaClient, repository} from '@prisma/client';
import {inject, injectable} from 'inversify';
import { TYPES } from '../di/types';

// this is the schema for the repository table
/*model repository {
  id                Int                  @id @default(autoincrement()) @db.Integer
  name              String               @db.VarChar(255)
  owner_user_id     Int                  @db.Integer
  description       String?              @db.Text
  is_private        Boolean?             @default(false) @db.Boolean
  parent_id         Int?                 @db.Integer      // Field to track the parent repository if this is a fork
  forked_at         DateTime?            @db.Timestamp(6) // When this repository was forked (if it is a fork)
  created_at        DateTime             @default(now()) @db.Timestamp(6)
  updated_at        DateTime             @default(now()) @updatedAt @db.Timestamp(6)

  // Foreign key relationships
  owner             users                @relation(fields: [owner_user_id], references: [id], onDelete: Cascade)
  parent            repository?          @relation("ForkRelation", fields: [parent_id], references: [id], onDelete: SetNull)
  forks             repository[]         @relation("ForkRelation")

  // Relations to other models
  access            repository_access[]
  issue             issue[]
  pull_request      pull_request[]
}
*/

@injectable()
export class RepositoryRepository {
    private repoRelationMap: { [tableName: string]: keyof Prisma.repositoryInclude } = {
        'repository_accesses': 'access',
        'issues': 'issue',
        'pull_requests': 'pull_request',
    };

    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {
        console.log("repository repo called");
    }

    /**
     * Find a repository by ID with optional relations
     */
    async findById(
        id: number,
        tableNamesToInclude?: string[]): Promise<repository | null> {
        try {
            let includeRelations: Prisma.repositoryInclude | undefined = undefined;
            if (tableNamesToInclude && tableNamesToInclude.length > 0) {
                includeRelations = {};
                for (const tableName of tableNamesToInclude) {
                    const relationName = this.repoRelationMap[tableName];
                    if (relationName) {
                        includeRelations[relationName] = true;
                    } else {
                        console.warn(`Warning: Table name "${tableName}" is not a valid relation for repository model and will be ignored.`);
                    }
                }
            }
            const repository = await this.prisma.repository.findUnique({
                where: { id: id },
                include: includeRelations,
            });
            return repository;
        } catch (error: unknown) {
            console.error(error);
            throw error;
        }
    }

    /**
     * Find repositories by owner ID
     */
    async findByOwnerId(ownerId: number): Promise<repository[]> {
        try {
            const repositories = await this.prisma.repository.findMany({
                where: { owner_user_id: ownerId },
            });
            return repositories;
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.findByOwnerId:', error as Error);
            throw error;
        }
    }

    /**
     * Create a new repository with correct owner relationship
     */
    async createRepository(data: Prisma.repositoryCreateInput): Promise<repository> {
        console.log('=== REPOSITORY REPOSITORY: createRepository START ===');
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        try {
            // Handle path field which isn't part of the Prisma schema but useful for our application
            let dataToSave: any = { ...data };
            
            // Store path as a custom property if provided
            const path = dataToSave.path;
            if (path) {
                delete dataToSave.path;
                dataToSave.description = dataToSave.description || 
                    `Repository available at ${path}`;
                console.log('Custom path property processed:', path);
            }
            
            console.log('Data to save after processing:', JSON.stringify(dataToSave, null, 2));
            console.log('Checking owner connection data:', JSON.stringify(dataToSave.owner));
            
            // Ensure owner_user_id is being set correctly
            if (dataToSave.owner && dataToSave.owner.connect && dataToSave.owner.connect.id) {
                console.log('Owner ID to connect:', dataToSave.owner.connect.id);
                
                // Verify the user exists before attempting to create the repository
                const userExists = await this.prisma.users.findUnique({
                    where: { id: dataToSave.owner.connect.id }
                });
                
                if (!userExists) {
                    console.error(`User with ID ${dataToSave.owner.connect.id} does not exist`);
                    throw new Error(`Cannot create repository: User with ID ${dataToSave.owner.connect.id} does not exist`);
                }
                
                console.log('User exists check passed');
            } else {
                console.warn('No owner connection specified or missing ID');
            }
            
            console.log('Calling prisma.repository.create');
            const newRepository = await this.prisma.repository.create({
                data: dataToSave,
            });
            
            console.log('Repository created successfully:', JSON.stringify(newRepository));
            console.log('=== REPOSITORY REPOSITORY: createRepository END - Success ===');
            return newRepository;
        } catch (error: unknown) {
            console.error('=== REPOSITORY REPOSITORY: createRepository ERROR ===');
            console.error('Error in RepositoryRepository.createRepository:', error);
            
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                console.error('Prisma error message:', error.message);
                
                if (error.code === 'P2003') {
                    console.error('Foreign key constraint failed - likely invalid owner_user_id');
                } else if (error.code === 'P2002') {
                    console.error('Unique constraint failed - repository name might already exist');
                }
            }
            
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
            throw error;
        }
    }

    async updateRepository(id: number, data: Prisma.repositoryUpdateInput): Promise<repository> {
        try {
            const updatedRepository = await this.prisma.repository.update({
                where: { id: id },
                data,
            });
            return updatedRepository;
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.updateRepository:', error as Error);
            throw error;
        }
    }

    async deleteRepository(id: number): Promise<repository> {
        try {
            const deletedRepository = await this.prisma.repository.delete({
                where: { id: id },
            });
            return deletedRepository;
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.deleteRepository:', error as Error);
            throw error;
        }
    }

    // Alias for findById to match naming convention in GitCrud
    async getRepositoryById(id: number): Promise<repository | null> {
        return this.findById(id);
    }
}
