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
    description: z.string().optional(),
    is_private: z.boolean().optional(),
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
     * Retrieves all repositories, optionally filtering by name.
     * @param searchText Optional text to filter repository names
     * @returns ApiResponse with the list of repositories or error
     */
    async getAllRepositories(searchText?: string): Promise<ApiResponse<repository[]>> {
        console.log(`=== REPOSITORY SERVICE: getAllRepositories START (Search: ${searchText || 'None'}) ===`);
        try {
            const response = await this.repositoryRepository.findAll(searchText);

            if (response.status === ResponseStatus.FAILED) {
                console.error(`Failed to retrieve repositories:`, response.error);
            } else {
                console.log(`Retrieved ${response.data?.length || 0} repositories.`);
            }

            console.log(`=== REPOSITORY SERVICE: getAllRepositories END ===`);
            return response;

        } catch (error: unknown) {
            console.error(`=== REPOSITORY SERVICE: getAllRepositories ERROR ===`);
            console.error(`Error retrieving repositories:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve repositories due to an unexpected error",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Retrieves a single repository by its ID, optionally including related data.
     * The related tables are specified via the 'relations' query parameter in the controller.
     * @param id Repository ID
     * @param includeTables Optional array of related table names to include (parsed from 'relations' query param)
     * @returns ApiResponse with the repository data or error
     */
    async getRepositoryById(id: number, includeTables?: string[]): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: getRepositoryById START (ID: ${id}) ===`);
        console.log(`Received includeTables parameter:`, includeTables);
        console.log(`Attempting to log joined relations: ${includeTables?.join(',')}`);

        try {
            const response = await this.repositoryRepository.findById(id, includeTables);

            if (response.status === ResponseStatus.FAILED) {
                console.error(`Failed to retrieve repository with ID ${id}:`, response.error);
                return response;
            }

            if (!response.data) {
                console.log(`Repository with ID ${id} not found.`);
                return response;
            }

            console.log(`Repository with ID ${id} retrieved successfully.`);
            console.log(`=== REPOSITORY SERVICE: getRepositoryById END - Success ===`);
            return response;

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

            const existingRepoResponse = await this.repositoryRepository.findById(id);
            if (existingRepoResponse.status === ResponseStatus.FAILED) {
                console.log("Failed to check existence for repo ID:", id, existingRepoResponse.error);
                return {
                    status: ResponseStatus.FAILED,
                    message: `Failed to check existence for repository ID ${id}`,
                    error: existingRepoResponse.error,
                };
            }
            if (!existingRepoResponse.data) {
                console.log("Repository not found with ID:", id);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository not found',
                    error: 'Repository not found',
                };
            }

            const updatedRepositoryResponse = await this.repositoryRepository.updateRepository(id, validatedData);

            if (updatedRepositoryResponse.status === ResponseStatus.FAILED) {
                console.error("Failed to update repository in DB:", updatedRepositoryResponse.error);
            } else {
                console.log("Repository updated successfully:", JSON.stringify(updatedRepositoryResponse.data));
                console.log("=== REPOSITORY SERVICE: updateRepository END - Success ===");
            }
            return updatedRepositoryResponse;

        } catch (error) {
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

            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });

            const command = `bash "${scriptPath}" "${validatedData.name}" "${username}"`;
            console.log('Executing command:', command);

            try {
                await execPromise(command);
                console.log('Git repository created successfully on filesystem');
            } catch (scriptError) {
                console.error('Error executing git init script:', scriptError);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to initialize repository on filesystem",
                    error: scriptError instanceof Error ? scriptError.message : String(scriptError)
                };
            }

            const repoData = {
                name: validatedData.name,
                description: validatedData.description ||
                    `Repository for ${username}/${validatedData.name}.git`,
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
            } else if (!response.data) {
                console.error('Repository creation reported success but no data returned from DB');
                return {
                    status: ResponseStatus.FAILED,
                    message: "Repository creation failed",
                    error: "Inconsistent state: Repository creation succeeded but no data returned."
                };
            } else {
                console.log('Repository created in database with ID:', response.data.id);
                console.log('=== REPOSITORY SERVICE: createBareRepo END - Success ===');
            }
            return response;

        } catch (error: unknown) {
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
            const repoDetailsResponse = await this.repositoryRepository.findRepositoryPathDetails(id);
            
            // Handle failure from findRepositoryPathDetails
            if (repoDetailsResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to retrieve repository details for ID ${id}:`, repoDetailsResponse.error);
                // Create a new ApiResponse with the correct type <repository | null>
                return {
                    status: ResponseStatus.FAILED,
                    message: repoDetailsResponse.message, // Preserve original message
                    error: repoDetailsResponse.error,     // Preserve original error
                    data: null                           // Set data to null as expected by the return type
                };
            }
            
            if (!repoDetailsResponse.data) {
                console.warn(`Repository path details not found for ID: ${id}`);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Repository not found",
                    error: `Repository with ID ${id} not found`,
                    data: null // Ensure data is null
                };
            }

            const { ownerUsername, repoName } = repoDetailsResponse.data;
            const repoFullPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
            console.log(`Constructed path for deletion: ${repoFullPath}`);

            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });

            try {
                const command = `rm -rf "${repoFullPath}"`;
                console.log(`Executing deletion command: ${command}`);
                await execPromise(command);
                console.log(`Filesystem repository deleted successfully: ${repoFullPath}`);
            } catch (fsError) {
                console.error(`Error deleting filesystem repository ${repoFullPath}:`, fsError);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to delete repository from filesystem",
                    error: fsError instanceof Error ? fsError.message : String(fsError),
                    data: null // Ensure data is null
                };
            }

            console.log(`Deleting repository entry from database for ID: ${id}`);
            const deleteResponse = await this.repositoryRepository.deleteRepository(id);
            
            if (deleteResponse.status === ResponseStatus.FAILED) {
                console.error(`Database deletion failed for ID ${id}:`, deleteResponse.error);
            } else {
                console.log(`Database entry deleted successfully for ID: ${id}`);
                console.log(`=== REPOSITORY SERVICE: deleteBareRepo END - Success (ID: ${id}) ===`);
            }
            return deleteResponse;
            
        } catch (error: unknown) {
            console.error(`=== REPOSITORY SERVICE: deleteBareRepo ERROR (ID: ${id}) ===`);
            console.error(`Error deleting repository:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to delete repository",
                error: error instanceof Error ? error.message : String(error),
                data: null // Ensure data is null
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
        let destPath: string | null = null;

        try {
            const sourceDetailsResponse = await this.repositoryRepository.findRepositoryPathDetails(repoId);
            
            // Handle failure from findRepositoryPathDetails
            if (sourceDetailsResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to get source repo details for fork (RepoID: ${repoId}):`, sourceDetailsResponse.error);
                 // Create a new ApiResponse with the correct type <repository | null>
                return {
                    status: ResponseStatus.FAILED,
                    message: sourceDetailsResponse.message, // Preserve original message
                    error: sourceDetailsResponse.error,     // Preserve original error
                    data: null                           // Set data to null as expected by the return type
                };
            }
            
            if (!sourceDetailsResponse.data) {
                console.warn(`Source repository not found for fork (RepoID: ${repoId})`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Source repository not found.',
                    error: `Repository with ID ${repoId} not found.`,
                    data: null // Ensure data is null
                };
            }

            const { ownerUsername, repoName } = sourceDetailsResponse.data;
            console.log(`Source repo details found: Owner=${ownerUsername}, Name=${repoName}`);

            const sourceRepoResponse = await this.repositoryRepository.findById(repoId);
            if (sourceRepoResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to get full source repo data for fork (RepoID: ${repoId}):`, sourceRepoResponse.error);
                return sourceRepoResponse;
            }
            if (!sourceRepoResponse.data) {
                console.error(`Inconsistency: Source repository details found but full data missing (RepoID: ${repoId})`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Source repository data inconsistent.',
                    error: `Full data for repository ID ${repoId} missing.`,
                    data: null // Ensure data is null
                };
            }
            const sourceRepo = sourceRepoResponse.data;
            console.log(`Full source repo data retrieved.`);

            const userReposResponse = await this.repositoryRepository.findByOwnerId(userId);
            if (userReposResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to check for name conflicts for user ${userId}:`, userReposResponse.error);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to check for repository name conflicts.',
                    error: userReposResponse.error,
                    data: null // Ensure data is null
                };
            }
            if (userReposResponse.data && userReposResponse.data.some(r => r.name === repoName)) {
                console.log(`Name conflict detected: User ${username} already has a repo named ${repoName}`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository with this name already exists for this user.',
                    error: 'Name conflict.',
                    data: null // Ensure data is null
                };
            }
            console.log(`No name conflict found for user ${username}.`);

            const srcPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
            const destDir = path.join(GIT_REPO_BASE_PATH, username);
            destPath = path.join(destDir, `${repoName}.git`);
            const shellScript = `mkdir -p "${destDir}" && git clone --bare "${srcPath}" "${destPath}"`;
            console.log(`Source path: ${srcPath}`);
            console.log(`Destination path: ${destPath}`);
            console.log(`Executing shell script: ${shellScript}`);

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
                    error: err?.message || String(err),
                    data: null // Ensure data is null
                };
            }

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
                if (destPath) {
                    try {
                        console.log(`Attempting to clean up filesystem directory: ${destPath}`);
                        const cleanupCmd = `rm -rf "${destPath}"`;
                        await execPromise(cleanupCmd);
                        console.log(`Filesystem cleanup successful.`);
                    } catch (cleanupErr: any) {
                        console.error(`CRITICAL: Failed to cleanup filesystem directory ${destPath} after DB error:`, cleanupErr);
                    }
                }
                createDbResponse.message = 'Failed to create forked repository in database. Filesystem cleanup attempted.';
                return createDbResponse;
            }

            console.log(`Database record created successfully. Fork ID: ${createDbResponse.data?.id}`);
            console.log(`=== REPOSITORY SERVICE: forkRepository END - Success ===`);
            return createDbResponse;

        } catch (err: any) {
            console.error(`=== REPOSITORY SERVICE: forkRepository ERROR ===`);
            console.error('Unexpected error during fork operation:', err);
            return {
                status: ResponseStatus.FAILED,
                message: 'Unexpected error during fork operation.',
                error: err?.message || String(err),
                data: null // Ensure data is null
            };
        }
    }
}