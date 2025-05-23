import { Prisma, repository } from '@prisma/client';
import { RepositoryRepository } from '../repositories/repository.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises'; // Use promises version of fs
import { AuthUser } from '../types/auth.types';

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
     * @param user Optional user object to filter repositories for a specific user
     * @returns ApiResponse with the list of repositories or error
     */
    async getAllRepositories(searchText?: string, user?: AuthUser): Promise<ApiResponse<repository[]>> {
        console.log(`=== REPOSITORY SERVICE: getAllRepositories START ===`);
        console.log(`Search text: ${searchText || 'None'}`);
        console.log(`User object:`, user);
        console.log(`User ID: ${user?.userId || 'None'}`);
        console.log(`Username: ${user?.username || 'None'}`);
        console.log(`Is Admin: ${user?.is_admin !== undefined ? user.is_admin : 'None'}`);
        try {
            const response = await this.repositoryRepository.findAll(searchText, user);

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
        let repoFullPath: string | null = null; // Track path for potential cleanup

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

            repoFullPath = path.join(GIT_REPO_BASE_PATH, username, `${validatedData.name}.git`);
            console.log(`Calculated repository path: ${repoFullPath}`);

            const scriptPath = path.join(process.cwd(), 'src', 'git', 'initGitRepo.sh');
            console.log('Using script at path:', scriptPath);

            try {
                await fs.access(scriptPath, fs.constants.X_OK);
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
                console.log('Git repository created successfully on filesystem at:', repoFullPath);
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
                repoPath: repoFullPath,
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
                if (repoFullPath) {
                    try {
                        console.log(`Attempting cleanup of filesystem repo: ${repoFullPath}`);
                        await fs.rm(repoFullPath, { recursive: true, force: true });
                        console.log(`Filesystem cleanup successful for: ${repoFullPath}`);
                    } catch (cleanupError) {
                        console.error(`CRITICAL: Failed to cleanup filesystem repo ${repoFullPath} after DB error:`, cleanupError);
                    }
                }
            } else if (!response.data) {
                console.error('Repository creation reported success but no data returned from DB');
                if (repoFullPath) {
                    try {
                        console.log(`Attempting cleanup of filesystem repo due to inconsistent DB state: ${repoFullPath}`);
                        await fs.rm(repoFullPath, { recursive: true, force: true });
                        console.log(`Filesystem cleanup successful for: ${repoFullPath}`);
                    } catch (cleanupError) {
                        console.error(`CRITICAL: Failed to cleanup filesystem repo ${repoFullPath} after inconsistent DB state:`, cleanupError);
                    }
                }
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
            if (repoFullPath) {
                try {
                    await fs.access(repoFullPath);
                    console.log(`Attempting cleanup due to unexpected error: ${repoFullPath}`);
                    await fs.rm(repoFullPath, { recursive: true, force: true });
                    console.log(`Filesystem cleanup successful.`);
                } catch (cleanupErr: any) {
                    if (cleanupErr.code !== 'ENOENT') {
                        console.error(`CRITICAL: Failed to cleanup filesystem repo ${repoFullPath} after unexpected error:`, cleanupErr);
                    }
                }
            }
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to create repository due to an unexpected error",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Deletes a bare Git repository from the filesystem and the database.
     * Uses the stored repoPath if available, otherwise falls back to reconstructing it.
     * @param id - Repository ID
     * @returns ApiResponse with success/failure status
     */
    async deleteBareRepo(id: number): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: deleteBareRepo START (ID: ${id}) ===`);
        let repoFullPath: string | null = null;

        try {
            type RepositoryWithOwner = repository & { owner?: { username: string } };
            const repoResponse = await this.repositoryRepository.findById(id, ['owner']) as ApiResponse<RepositoryWithOwner | null>;

            if (repoResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to retrieve repository data for ID ${id}:`, repoResponse.error);
                return repoResponse;
            }

            if (!repoResponse.data) {
                console.warn(`Repository not found for ID: ${id}`);
                return {
                    status: ResponseStatus.SUCCESS,
                    message: "Repository not found or already deleted",
                    data: null
                };
            }

            const repositoryData = repoResponse.data;

            if (repositoryData.repoPath) {
                repoFullPath = repositoryData.repoPath;
                console.log(`Using stored repoPath: ${repoFullPath}`);
            } else {
                console.warn(`repoPath not found in DB for ID ${id}. Falling back to reconstruction.`);
                if (!repositoryData.owner?.username) {
                    console.error(`Fallback failed: Owner details missing for repo ID ${id}. Cannot reconstruct path.`);
                    return {
                        status: ResponseStatus.FAILED,
                        message: "Failed to determine repository path for deletion",
                        error: "Owner details missing for path reconstruction.",
                        data: null
                    };
                }

                const ownerUsername = repositoryData.owner.username;
                const repoName = repositoryData.name;

                if (repositoryData.parent_id && repoName.includes('/')) {
                    const [originalOwner, actualRepoName] = repoName.split('/');
                    repoFullPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, originalOwner, `${actualRepoName}.git`);
                    console.log(`Reconstructed FORK path for deletion: ${repoFullPath}`);
                } else {
                    repoFullPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
                    console.log(`Reconstructed NORMAL path for deletion: ${repoFullPath}`);
                }
            }

            if (!repoFullPath) {
                console.error(`Could not determine a valid path for deletion for repo ID ${id}. Aborting filesystem delete.`);
                return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to determine repository path",
                    error: "Path could not be determined from DB or reconstruction.",
                    data: null
                };
            }

            const execPromise = (cmd: string) => new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) return reject(error);
                    resolve({ stdout, stderr });
                });
            });

            try {
                await fs.access(repoFullPath);
                console.log(`Filesystem repository exists at: ${repoFullPath}`);
                const command = `rm -rf "${repoFullPath}"`;
                console.log(`Executing deletion command: ${command}`);
                await execPromise(command);
                console.log(`Filesystem repository deleted successfully: ${repoFullPath}`);
            } catch (fsError: any) {
                if (fsError.code === 'ENOENT') {
                    console.warn(`Filesystem repository not found at ${repoFullPath}, proceeding with DB deletion.`);
                } else {
                    console.error(`Error deleting filesystem repository ${repoFullPath}:`, fsError);
                    return {
                        status: ResponseStatus.FAILED,
                        message: "Failed to delete repository from filesystem",
                        error: fsError instanceof Error ? fsError.message : String(fsError),
                        data: null
                    };
                }
            }

            console.log(`Deleting repository entry from database for ID: ${id}`);
            const deleteResponse = await this.repositoryRepository.deleteRepository(id);

            if (deleteResponse.status === ResponseStatus.FAILED) {
                console.error(`Database deletion failed for ID ${id}:`, deleteResponse.error);
                console.warn(`Potential inconsistency: Filesystem repo at ${repoFullPath} may have been deleted, but DB deletion failed.`);
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
                message: "Failed to delete repository due to an unexpected error",
                error: error instanceof Error ? error.message : String(error),
                data: null
            };
        }
    }

    /**
     * Forks a repository: clones it to the new user's namespace and creates a DB record.
     * The database name for the fork will be stored as 'originalOwnerUsername/reponame'.
     * The filesystem path will be '/srv/git/forkingUsername/originalOwnerUsername/reponame.git'.
     * @param repoId - ID of the repository to fork
     * @param userId - ID of the user who will own the fork
     * @param username - Username of the new owner (for filesystem path)
     * @returns ApiResponse with new repo data or error
     */
    async forkRepository(repoId: number, userId: number, username: string): Promise<ApiResponse<repository | null>> {
        console.log(`=== REPOSITORY SERVICE: forkRepository START (RepoID: ${repoId}, UserID: ${userId}, Username: ${username}) ===`);
        let destPath: string | null = null;

        try {
            type RepositoryWithOwner = repository & { owner?: { username: string } };
            const sourceRepoResponse = await this.repositoryRepository.findById(repoId, ['owner']) as ApiResponse<RepositoryWithOwner | null>;

            if (sourceRepoResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to get source repo data for fork (RepoID: ${repoId}):`, sourceRepoResponse.error);
                return sourceRepoResponse;
            }
            if (!sourceRepoResponse.data || !sourceRepoResponse.data.owner?.username) {
                console.error(`Source repository or its owner details not found (RepoID: ${repoId})`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Source repository or owner details not found.',
                    error: `Repository or owner details missing for ID ${repoId}.`,
                    data: null
                };
            }
            const sourceRepo = sourceRepoResponse.data!;
            const ownerUsername = sourceRepo.owner!.username;
            const repoName = sourceRepo.name;
            console.log(`Source repo details found: Owner=${ownerUsername}, Name=${repoName}`);

            const desiredForkName = `${ownerUsername}/${repoName}`;
            const srcPath = sourceRepo.repoPath ? sourceRepo.repoPath : path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
            const destDir = path.join(GIT_REPO_BASE_PATH, username);
            destPath = path.join(destDir, ownerUsername, `${repoName}.git`);
            console.log(`Desired DB name for fork: ${desiredForkName}`);
            console.log(`Source filesystem path: ${srcPath}`);
            console.log(`Destination filesystem path: ${destPath}`);

            console.log(`Checking for name conflict with: ${desiredForkName} for user ID ${userId}`);
            const userReposResponse = await this.repositoryRepository.findByOwnerId(userId);
            if (userReposResponse.status === ResponseStatus.FAILED) {
                console.error(`Failed to check for name conflicts for user ${userId}:`, userReposResponse.error);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to check for repository name conflicts.',
                    error: userReposResponse.error,
                    data: null
                };
            }
            if (userReposResponse.data && userReposResponse.data.some(r => r.name === desiredForkName)) {
                console.log(`Name conflict detected: User ${username} (ID: ${userId}) already has a repo named ${desiredForkName}`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository with this name already exists for this user.',
                    error: 'Name conflict.',
                    data: null
                };
            }
            console.log(`No name conflict found for user ${username} with name ${desiredForkName}.`);

            const shellScript = `mkdir -p "${path.dirname(destPath)}" && git clone --bare "${srcPath}" "${destPath}"`;
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
                console.log(`Filesystem clone successful to: ${destPath}`);
            } catch (err: any) {
                console.error('Error executing filesystem clone:', err);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Failed to clone repository on filesystem.',
                    error: err?.message || String(err),
                    data: null
                };
            }

            console.log(`Creating database record for the fork.`);
            const forkData: Prisma.repositoryCreateInput = {
                name: desiredForkName,
                description: `Forked from ${ownerUsername}/${repoName}. ${sourceRepo.description || ''}`.trim(),
                is_private: sourceRepo.is_private,
                repoPath: destPath,
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
                        await fs.rm(destPath, { recursive: true, force: true });
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
            if (destPath) {
                try {
                    await fs.access(destPath);
                    console.log(`Attempting cleanup due to unexpected error: ${destPath}`);
                    await fs.rm(destPath, { recursive: true, force: true });
                    console.log(`Filesystem cleanup successful.`);
                } catch (cleanupErr: any) {
                    if (cleanupErr.code !== 'ENOENT') {
                        console.error(`CRITICAL: Failed to cleanup filesystem directory ${destPath} after unexpected error:`, cleanupErr);
                    }
                }
            }
            return {
                status: ResponseStatus.FAILED,
                message: 'Unexpected error during fork operation.',
                error: err?.message || String(err),
                data: null
            };
        }
    }
}