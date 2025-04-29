import { Prisma, repository } from '@prisma/client';
import { RepositoryRepository } from '../repositories/repository.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// TODO: Move this to configuration/environment variables, ensure consistency with GitService
const GIT_REPO_BASE_PATH = '/srv/git';

/**
 * ## CreateRepositoryDto Schema
 * Validates the incoming data for creating a repository.
 * Uses a single 'name' field for both display and filesystem path.
 */
export const CreateRepositoryDto = z.object({
    // repoName removed
    name: z.string().min(1, 'name is required'), // Single name field
    description: z.string().optional(),
    is_private: z.boolean().optional(),
});
export type CreateRepositoryDto = z.infer<typeof CreateRepositoryDto>;

/**
 * ## UpdateRepositoryDto Schema
 * Validates the incoming data for updating a repository.
 * Name is intentionally excluded to prevent updates.
 */
export const UpdateRepositoryDto = z.object({
    // name field removed to prevent updates
    description: z
        .string()
        .optional(),
    
    is_private: z
        .boolean()
        .optional(),
});
export type UpdateRepositoryDto = z.infer<typeof UpdateRepositoryDto>;

@injectable()
export class RepositoryService {
    constructor(
        @inject(TYPES.RepositoryRepository) private repositoryRepository: RepositoryRepository
    ) {
        console.log("RepositoryService constructor called");
    }

    /**
     * Retrieves a single repository by its ID.
     * @param id Repository ID
     * @returns ApiResponse with the repository data or error
     */
    async getRepositoryById(id: number): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: getRepositoryById START (ID: ${id}) ===`);
        try {
            const response = await this.repositoryRepository.findById(id);

            if (response.status === ResponseStatus.FAILED) {
                console.error(`Failed to retrieve repository with ID ${id}:`, response.error);
                return response; // Propagate the failure response
            }

            if (!response.data) {
                console.log(`Repository with ID ${id} not found.`);
                return {
                    status: ResponseStatus.SUCCESS, // Still a success in terms of operation execution
                    message: 'Repository not found',
                    data: null,
                };
            }

            console.log(`Repository with ID ${id} retrieved successfully.`);
            console.log(`=== REPOSITORY SERVICE: getRepositoryById END - Success ===`);
            return response; // Return the success response with data

        } catch (error: unknown) {
            console.error(`=== REPOSITORY SERVICE: getRepositoryById ERROR (ID: ${id}) ===`);
            console.error(`Error retrieving repository:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve repository due to an unexpected error",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Update an existing repository
     * @param id Repository ID
     * @param updateData Repository data to update
     * @returns ApiResponse with updated repository or error
     */
    async updateRepository(id: number, updateData: UpdateRepositoryDto): Promise<ApiResponse<repository>> {
        try {
            console.log("=== REPOSITORY SERVICE: updateRepository START ===");
            console.log("Repository ID:", id);
            console.log("Update data:", JSON.stringify(updateData));

            // Validate data using Zod schema
            const validationResult = UpdateRepositoryDto.safeParse(updateData);
            if (!validationResult.success) {
                const formattedErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                console.log("Data validation failed:", formattedErrors);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }
            const validatedData = validationResult.data;
            console.log("Data validation successful");

            // Check if repository exists
            const existingRepoResponse = await this.repositoryRepository.findById(id);
            if (existingRepoResponse.status === ResponseStatus.FAILED || !existingRepoResponse.data) {
                console.log("Repository not found with ID:", id);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository not found',
                    error: 'Repository not found',
                };
            }

            // Update repository
            const updatedRepositoryResponse = await this.repositoryRepository.updateRepository(id, validatedData);

            if (updatedRepositoryResponse.status === ResponseStatus.FAILED) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to update repository',
                    error: updatedRepositoryResponse.error,
                };
            }

            const updatedRepository = updatedRepositoryResponse.data;

            console.log("Repository updated successfully:", JSON.stringify(updatedRepository));
            console.log("=== REPOSITORY SERVICE: updateRepository END - Success ===");

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Repository updated successfully',
                data: updatedRepository,
            };
        } catch (error) { // Catch unexpected errors (e.g., DB connection issues)
            console.error("=== REPOSITORY SERVICE: updateRepository ERROR ===");
            console.error("Error updating repository:", error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update repository due to an unexpected error',
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Creates a bare Git repository under the user's directory and records it in the database.
     * @param userId - User ID
     * @param username - Username of the owner (for filesystem path)
     * @param createData - Repository data (name, description, is_private)
     * @returns ApiResponse with success/failure status
     */
    async createBareRepo(userId: number, username: string, createData: CreateRepositoryDto): Promise<ApiResponse<repository | null>> {
        console.log('=== REPOSITORY SERVICE: createBareRepo START ===');
        console.log('userId:', userId);
        console.log('username:', username);
        console.log('createData:', JSON.stringify(createData));

        try {
            // Validate input data using the updated schema
            const validationResult = CreateRepositoryDto.safeParse(createData);
            if (!validationResult.success) {
                const formattedErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                console.log("Data validation failed:", formattedErrors);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }
            const validatedData = validationResult.data;
            console.log("Data validation successful");

            // Username is required for path construction
            if (!username) {
                 console.log('Username not provided');
                 return {
                     status: ResponseStatus.FAILED,
                     message: "Username is required",
                     error: "Username is required"
                 };
            }

            const scriptPath = path.join(process.cwd(), 'src', 'git', 'initGitRepo.sh');
            console.log('Using script at path:', scriptPath);

            // Check if script exists and is executable
            try {
                fs.accessSync(scriptPath, fs.constants.X_OK);
                console.log('Script exists and is executable');
            } catch (error: unknown) {
                console.error('Script access error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Cannot access git initialization script",
                    error: `Cannot access script at ${scriptPath}: ${errorMessage}`
                };
            }

            // Execute the script to create the repository on disk
            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });

            // Use validatedData.name for the script argument
            const command = `bash "${scriptPath}" "${validatedData.name}" "${username}"`;
            console.log('Executing command:', command);

            await execPromise(command);
            console.log('Git repository created successfully on filesystem');

            // Create repository entry in database with owner
            const repoData = {
                name: validatedData.name, // Use validated name for DB
                description: validatedData.description ||
                    `Repository for ${username}/${validatedData.name}.git`, // Use validated name in description
                is_private: validatedData.is_private || false,
                owner: {
                    connect: {
                        id: userId
                    }
                }
            };

            console.log('Database repository data:', JSON.stringify(repoData));
            const response = await this.repositoryRepository.createRepository(repoData);

            if (response.status === ResponseStatus.FAILED) {
                console.error("DB creation failed after filesystem repo creation:", response.error);
                return response;
            }

            if (!response.data) {
                console.error('Repository creation failed, no data returned from DB');
                return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to create repository",
                    error: "Repository creation failed, no data returned from DB"
                };
            }

            console.log('Repository created in database with ID:', response.data.id);
            console.log('=== REPOSITORY SERVICE: createBareRepo END - Success ===');

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository created successfully",
                data: response.data
            };

        } catch (error: unknown) { // Catch unexpected errors
            console.error('=== REPOSITORY SERVICE: createBareRepo ERROR ===');
            console.error('Error creating repository:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to create repository due to an unexpected error",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Deletes a bare Git repository from the filesystem and the database.
     * @param id - Repository ID
     * @returns ApiResponse with success/failure status
     */
    async deleteBareRepo(id: number): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: deleteBareRepo START (ID: ${id}) ===`);
        
        try {
            // Get repository path details from database
            const repoDetailsResponse = await this.repositoryRepository.findRepositoryPathDetails(id);
            
            if (repoDetailsResponse.status === ResponseStatus.FAILED) {
                return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to retrieve repository details",
                    error: repoDetailsResponse.error
                };
            }
            
            if (!repoDetailsResponse.data) {
                console.error(`Repository path details not found for ID: ${id}`);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Repository not found",
                    error: `Repository with ID ${id} not found or owner details missing`
                };
            }

            const { ownerUsername, repoName } = repoDetailsResponse.data;
            // Construct the correct path including the username
            const repoFullPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
            console.log(`Constructed path for deletion: ${repoFullPath}`);

            // Construct deletion command using the full path
            const command = `rm -rf "${repoFullPath}"`;
            console.log(`Executing deletion command: ${command}`);

            // Execute the command to delete the repo from the filesystem
            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });

            await execPromise(command);
            console.log(`Filesystem repository deleted successfully: ${repoFullPath}`);

            // Delete repository entry from database
            console.log(`Deleting repository entry from database for ID: ${id}`);
            const deleteResponse = await this.repositoryRepository.deleteRepository(id);
            
            if (deleteResponse.status === ResponseStatus.FAILED) {
                return deleteResponse;
            }
            
            console.log(`Database entry deleted successfully for ID: ${id}`);
            console.log(`=== REPOSITORY SERVICE: deleteBareRepo END - Success (ID: ${id}) ===`);
            
            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository deleted successfully",
                data: deleteResponse.data
            };
            
        } catch (error: unknown) {
            console.error(`=== REPOSITORY SERVICE: deleteBareRepo ERROR (ID: ${id}) ===`);
            console.error(`Error deleting repository:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to delete repository",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Forks a repository: clones it to the new user's namespace and creates a DB record.
     * @param repoId - ID of the repository to fork
     * @param userId - ID of the user who will own the fork
     * @param username - Username of the new owner (for filesystem path)
     * @returns ApiResponse with new repo data or error
     */
    async forkRepository(repoId: number, userId: number, username: string): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: forkRepository START (RepoID: ${repoId}, UserID: ${userId}, Username: ${username}) ===`);
        let destPath: string | null = null; // Keep track of destination path for potential cleanup

        try {
            // 1. Get source repo details (owner username, repo name)
            const sourceDetailsResponse = await this.repositoryRepository.findRepositoryPathDetails(repoId);
            if (sourceDetailsResponse.status === ResponseStatus.FAILED || !sourceDetailsResponse.data) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Source repository not found or details missing.',
                    error: sourceDetailsResponse.error || 'Could not retrieve source repository details.'
                };
            }
            const { ownerUsername, repoName } = sourceDetailsResponse.data;
            console.log(`Source repo details found: Owner=${ownerUsername}, Name=${repoName}`);

            // 2. Get full source repo (for is_private, description)
            const sourceRepoResponse = await this.repositoryRepository.findById(repoId);
            if (sourceRepoResponse.status === ResponseStatus.FAILED || !sourceRepoResponse.data) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Source repository not found.',
                    error: sourceRepoResponse.error || 'Could not retrieve full source repository data.'
                };
            }
            const sourceRepo = sourceRepoResponse.data;
            console.log(`Full source repo data retrieved.`);

            // 3. Check for name conflict for the target user
            const userReposResponse = await this.repositoryRepository.findByOwnerId(userId);
            if (userReposResponse.status === ResponseStatus.FAILED) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to check for repository name conflicts.',
                    error: userReposResponse.error
                };
            }
            if (userReposResponse.data && userReposResponse.data.some(r => r.name === repoName)) {
                console.log(`Name conflict detected: User ${username} already has a repo named ${repoName}`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository with this name already exists for this user.',
                    error: 'Name conflict.'
                };
            }
            console.log(`No name conflict found for user ${username}.`);

            // 4. Prepare paths and shell script to clone repo
            const srcPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
            const destDir = path.join(GIT_REPO_BASE_PATH, username);
            destPath = path.join(destDir, `${repoName}.git`); // Assign destPath for potential cleanup
            const shellScript = `mkdir -p "${destDir}" && git clone --bare "${srcPath}" "${destPath}"`;
            console.log(`Source path: ${srcPath}`);
            console.log(`Destination path: ${destPath}`);
            console.log(`Executing shell script: ${shellScript}`);

            // 5. Execute shell script
            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });
            try {
                const { stdout, stderr } = await execPromise(shellScript);
                console.log(`Filesystem clone stdout: ${stdout}`);
                if (stderr) console.warn(`Filesystem clone stderr: ${stderr}`);
                console.log(`Filesystem clone successful.`);
            } catch (err: any) {
                console.error('Error executing filesystem clone:', err);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to clone repository on filesystem.',
                    error: err?.message || String(err)
                };
            }

            // 6. Create DB record for fork
            console.log(`Creating database record for the fork.`);
            const forkData: Prisma.repositoryCreateInput = {
                name: repoName,
                description: `Forked from ${ownerUsername}/${repoName}. ${sourceRepo.description || ''}`.trim(),
                is_private: sourceRepo.is_private,
                parent: { connect: { id: repoId } },
                forked_at: new Date(),
                owner: { connect: { id: userId } }
            };

            const createDbResponse = await this.repositoryRepository.createRepository(forkData);

            if (createDbResponse.status === ResponseStatus.FAILED) {
                console.error('Failed to create database record for fork:', createDbResponse.error);
                // Attempt to clean up the forked repo from disk
                if (destPath) {
                    try {
                        console.log(`Attempting to clean up filesystem directory: ${destPath}`);
                        const cleanupCmd = `rm -rf "${destPath}"`;
                        await execPromise(cleanupCmd);
                        console.log(`Filesystem cleanup successful.`);
                    } catch (cleanupErr: any) {
                        console.error(`CRITICAL: Failed to cleanup filesystem directory ${destPath} after DB error:`, cleanupErr);
                        // Log this critical error, as we now have an orphaned directory
                    }
                }
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to create forked repository in database. Filesystem changes attempted to be reverted.',
                    error: createDbResponse.error
                };
            }

            console.log(`Database record created successfully. Fork ID: ${createDbResponse.data?.id}`);
            console.log(`=== REPOSITORY SERVICE: forkRepository END - Success ===`);
            return {
                status: ResponseStatus.SUCCESS,
                message: 'Repository forked successfully.',
                data: createDbResponse.data
            };

        } catch (err: any) {
            console.error(`=== REPOSITORY SERVICE: forkRepository ERROR ===`);
            console.error('Unexpected error during fork operation:', err);
            return {
                status: ResponseStatus.FAILED,
                message: 'Unexpected error during fork operation.',
                error: err?.message || String(err)
            };
        }
    }
}