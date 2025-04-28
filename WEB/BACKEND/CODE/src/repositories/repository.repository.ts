import {Prisma, PrismaClient, repository} from '@prisma/client';
import {inject, injectable} from 'inversify';
import { TYPES } from '../di/types';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

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
        tableNamesToInclude?: string[]): Promise<ApiResponse<repository | null>> {
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
            return {
                status: ResponseStatus.SUCCESS,
                message: repository ? `Repository found with ID: ${id}` : `No repository found with ID: ${id}`,
                data: repository
            };
        } catch (error: unknown) {
            console.error(error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to find repository',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

   
    async findByOwnerId(ownerId: number): Promise<ApiResponse<repository[]>> {
        try {
            const repositories = await this.prisma.repository.findMany({
                where: { owner_user_id: ownerId },
            });
            return {
                status: ResponseStatus.SUCCESS,
                message: `Found ${repositories.length} repositories for owner ID: ${ownerId}`,
                data: repositories
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.findByOwnerId:', error as Error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to find repositories by owner ID',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Create a new repository with correct owner relationship
     */
    async createRepository(data: Prisma.repositoryCreateInput): Promise<ApiResponse<repository>> {
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
                    return {
                        status: ResponseStatus.FAILED,
                        message: `Cannot create repository: User with ID ${dataToSave.owner.connect.id} does not exist`,
                        error: 'User not found'
                    };
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
            
            return {
                status: ResponseStatus.SUCCESS,
                message: 'Repository created successfully',
                data: newRepository
            };
        } catch (error: unknown) {
            console.error('=== REPOSITORY REPOSITORY: createRepository ERROR ===');
            console.error('Error in RepositoryRepository.createRepository:', error);
            
            let errorMessage = 'Failed to create repository';
            
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                console.error('Prisma error message:', error.message);
                
                if (error.code === 'P2003') {
                    errorMessage = 'Foreign key constraint failed - likely invalid owner_user_id';
                } else if (error.code === 'P2002') {
                    errorMessage = 'Unique constraint failed - repository name might already exist';
                }
            }
            
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
            
            return {
                status: ResponseStatus.FAILED,
                message: errorMessage,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async updateRepository(id: number, data: Prisma.repositoryUpdateInput): Promise<ApiResponse<repository>> {
        try {
            const updatedRepository = await this.prisma.repository.update({
                where: { id: id },
                data,
            });
            return {
                status: ResponseStatus.SUCCESS,
                message: `Repository with ID ${id} updated successfully`,
                data: updatedRepository
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.updateRepository:', error as Error);
            return {
                status: ResponseStatus.FAILED,
                message: `Failed to update repository with ID ${id}`,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async deleteRepository(id: number): Promise<ApiResponse<repository>> {
        try {
            const deletedRepository = await this.prisma.repository.delete({
                where: { id: id },
            });
            return {
                status: ResponseStatus.SUCCESS,
                message: `Repository with ID ${id} deleted successfully`,
                data: deletedRepository
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.deleteRepository:', error as Error);
            return {
                status: ResponseStatus.FAILED,
                message: `Failed to delete repository with ID ${id}`,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    // Alias for findById to match naming convention in GitCrud
    async getRepositoryById(id: number): Promise<ApiResponse<repository | null>> {
        return this.findById(id);
    }

    /**
     * Finds a repository by ID and returns details needed for constructing its path.
     * Assumes a relation 'owner' exists on the 'repository' model linking to 'users',
     * and the 'users' model has a 'username' field.
     */
    async findRepositoryPathDetails(id: number): Promise<ApiResponse<{ ownerUsername: string, repoName: string } | null>> {
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
                return {
                    status: ResponseStatus.SUCCESS,
                    message: `Repository with ID ${id} not found`,
                    data: null
                };
            }
            if (!repository.owner || !repository.owner.username) {
                console.error(`Repository with ID ${id} found, but owner or owner username is missing.`);
                return {
                    status: ResponseStatus.FAILED,
                    message: `Data integrity issue: Owner details missing for repository ID ${id}`,
                    error: 'Missing owner data'
                };
            }

            console.log(`Found details for repo ID ${id}: Owner=${repository.owner.username}, Name=${repository.name}`);
            return {
                status: ResponseStatus.SUCCESS,
                message: `Found path details for repository ID ${id}`,
                data: { ownerUsername: repository.owner.username, repoName: repository.name }
            };
        } catch (error: unknown) {
            console.error(`Error finding repository path details for ID ${id}:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: `Database error finding repository details for ID ${id}`,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
