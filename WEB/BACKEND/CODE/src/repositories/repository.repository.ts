import {Prisma, PrismaClient, repository} from '@prisma/client';
import {inject, injectable} from 'inversify';
import { TYPES } from '../di/types';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);

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

    /**
     * Finds a repository by ID and returns details needed for constructing its path.
     * Assumes a relation 'owner' exists on the 'repository' model linking to 'users',
     * and the 'users' model has a 'username' field.
     */
    async findRepositoryPathDetails(id: number): Promise<{ ownerUsername: string, repoName: string } | null> {
        console.log(`RepositoryRepository: Finding path details for repo ID: ${id}`);
        try {
            const repository = await this.prisma.repository.findUnique({
                where: { id: id },
                include: {
                    owner: { // Include the related user record
                        select: {
                            username: true // Select only the username
                        }
                    }
                }
            });

            if (!repository) {
                console.warn(`Repository with ID ${id} not found.`);
                return null; // Or throw new Error(...) if preferred
            }
            if (!repository.owner || !repository.owner.username) {
                console.error(`Repository with ID ${id} found, but owner or owner username is missing.`);
                // Throw standard Error instead of InternalServerError
                throw new Error(`Data integrity issue: Owner details missing for repository ID ${id}.`);
            }

            console.log(`Found details for repo ID ${id}: Owner=${repository.owner.username}, Name=${repository.name}`);
            return { ownerUsername: repository.owner.username, repoName: repository.name };
        } catch (error: unknown) {
            console.error(`Error finding repository path details for ID ${id}:`, error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 // Record not found specifically by Prisma
                 console.warn(`Prisma P2025: Repository with ID ${id} not found.`);
                 return null; // Or throw new Error(...) if preferred
            }
            // Re-throw other errors or wrap them in a standard Error
            // Throw standard Error instead of InternalServerError
            throw new Error(`Database error finding repository details for ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
