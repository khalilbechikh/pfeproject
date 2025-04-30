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
    // Updated keys to match expected query parameter values
    private repoRelationMap: { [tableName: string]: keyof Prisma.repositoryInclude } = {
        'access': 'access', // Changed from 'repository_accesses'
        'issues': 'issue',
        'pull_requests': 'pull_request',
        // Add mappings for other relations if needed, e.g., forks, owner
        'forks': 'forks',
        'owner': 'owner',
        'parent': 'parent',
        'source_pull_requests': 'source_pull_requests',
        'target_pull_requests': 'target_pull_requests'
    };

    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {
        console.log("repository repo called");
    }

    /**
     * Find all repositories, optionally filtering by name containing searchText
     */
    async findAll(searchText?: string): Promise<ApiResponse<repository[]>> {
        try {
            const whereClause: Prisma.repositoryWhereInput = {};
            if (searchText) {
                whereClause.name = {
                    contains: searchText,
                    mode: 'insensitive', // Case-insensitive search
                };
            }

            const repositories = await this.prisma.repository.findMany({
                where: whereClause,
                include: { // Optionally include owner username for context
                    owner: {
                        select: { username: true }
                    }
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repositories retrieved successfully",
                data: repositories
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.findAll:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve repositories',
                error: error instanceof Error ? error.message : String(error)
            };
        }
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
                console.log(`RepositoryRepository: Building include object for tables: ${tableNamesToInclude.join(', ')}`); // Added log
                for (const tableName of tableNamesToInclude) {
                    const relationName = this.repoRelationMap[tableName];
                    if (relationName) {
                        console.log(`RepositoryRepository: Mapping query param "${tableName}" to Prisma relation "${relationName}"`); // Added log
                        includeRelations[relationName] = true;
                    } else {
                        // Log clearly which table name was ignored
                        console.warn(`RepositoryRepository: Warning: Query parameter relation name "${tableName}" is not a valid key in repoRelationMap and will be ignored.`);
                    }
                }
                // Log the final include object being sent to Prisma
                console.log(`RepositoryRepository: Final Prisma include object:`, JSON.stringify(includeRelations));
            }
            console.info(`Finding repository with ID ${id} and including relations: ${JSON.stringify(includeRelations)}`);
            const repository = await this.prisma.repository.findUnique({
                where: { id: id },
                include: includeRelations,
            });
            console.warn(`Repository found: ${JSON.stringify(repository)}`);
            return {
                status: ResponseStatus.SUCCESS,
                message: repository ? "Repository found" : "Repository not found",
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
                message: "Repositories retrieved successfully",
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
                        message: "Cannot create repository: User does not exist",
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
                message: "Repository updated successfully",
                data: updatedRepository
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.updateRepository:', error as Error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to update repository",
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
                message: "Repository deleted successfully",
                data: deletedRepository
            };
        } catch (error: unknown) {
            console.error('Error in RepositoryRepository.deleteRepository:', error as Error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to delete repository",
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
                    message: "Repository not found",
                    data: null
                };
            }
            if (!repository.owner || !repository.owner.username) {
                console.error(`Repository with ID ${id} found, but owner or owner username is missing.`);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Data integrity issue: Owner details missing",
                    error: 'Missing owner data'
                };
            }

            console.log(`Found details for repo ID ${id}: Owner=${repository.owner.username}, Name=${repository.name}`);
            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository path details found",
                data: { ownerUsername: repository.owner.username, repoName: repository.name }
            };
        } catch (error: unknown) {
            console.error(`Error finding repository path details for ID ${id}:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: "Error finding repository details",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
