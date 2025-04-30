import { exec } from 'child_process';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as util from 'util';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

const execPromise = util.promisify(exec);

interface PathValidationSuccess {
    fullPath: string;
    normalizedPath: string;
    userTempWorkdirPath: string;
}

interface FileDetails {
    name: string;
    type: 'folder' | 'file';
    size: number;
    lastModified: Date;
}

interface FolderContent {
    type: 'folder';
    path: string;
    content: FileDetails[];
}

interface FileContent {
    type: 'file';
    path: string;
    content: string;
    size: number;
    lastModified: Date;
}

interface RenameResult {
    oldPath: string;
    newPath: string;
}

export class FolderPreviewService {
    private readonly sourceGitPathRoot = '/srv/git/';

    /**
     * Get user-specific source git path
     */
    private getUserSourceGitPath(username: string): string {
        return path.join(this.sourceGitPathRoot, username);
    }

    /**
     * Get user-specific temporary workdir path
     */
    private getUserTempWorkdirPath(username: string): string {
        const userSourcePath = this.getUserSourceGitPath(username);
        return path.join(userSourcePath, 'temp-working-directory');
    }

    /**
     * Helper to resolve and validate path within user's temp workdir.
     * Returns an ApiResponse indicating success or failure.
     */
    private async resolveAndValidatePath(username: string, relativePath: string | undefined | null): Promise<ApiResponse<PathValidationSuccess | null>> {
        const userTempWorkdirPath = this.getUserTempWorkdirPath(username);

        // Ensure the user's temp directory exists before proceeding
        try {
            await fsp.access(userTempWorkdirPath);
        } catch (error) {
            // If the directory doesn't exist, it might be okay if we are cloning,
            // but for other operations, it's an error. We'll handle this contextually.
            return { status: ResponseStatus.FAILED, message: `User temporary directory not found for ${username}`, error: 'User directory missing' };
        }

        if (!relativePath || typeof relativePath !== 'string') {
            return { status: ResponseStatus.FAILED, message: 'Path parameter is required and must be a string', error: 'Invalid path parameter' };
        }

        // Ensure path is relative and safe (no path traversal)
        const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
        // Construct full path within the user's temp directory
        const fullPath = path.resolve(userTempWorkdirPath, normalizedPath);

        // Verification Step: Check if the resolved path is still within the user's allowed directory
        const resolvedUserTempWorkdirPath = path.resolve(userTempWorkdirPath);
        // Allow access to the workdir itself, not just subdirectories
        if (!fullPath.startsWith(resolvedUserTempWorkdirPath + path.sep) && fullPath !== resolvedUserTempWorkdirPath) {
            return { status: ResponseStatus.FAILED, message: 'Access denied: Path is outside the allowed directory.', error: 'Path traversal attempt' };
        }

        return { status: ResponseStatus.SUCCESS, message: 'Path validated successfully', data: { fullPath, normalizedPath, userTempWorkdirPath } };
    }

    /**
     * Clones a Git repository from source location to temp workdir.
     */
    public async cloneRepo(username: string, repoName: string): Promise<ApiResponse<string | null>> {
        const userSourceGitPath = this.getUserSourceGitPath(username);
        const userTempWorkdirPath = this.getUserTempWorkdirPath(username);
        const sourcePath = path.join(userSourceGitPath, repoName);
        const targetPath = path.join(userTempWorkdirPath, repoName); // Target is repo inside temp dir

        try {
            // Check if source exists
            try {
                await fsp.access(sourcePath);
            } catch (error) {
                return { status: ResponseStatus.FAILED, message: `Repository ${repoName} not found for user ${username}`, error: 'Source repository not found' };
            }

            // Create user-specific target directory (temp-working-directory) if it doesn't exist
            await fsp.mkdir(userTempWorkdirPath, { recursive: true });

            // Remove existing target repository directory if it exists, before cloning
            try {
                await fsp.rm(targetPath, { recursive: true, force: true });
            } catch (error: any) {
                // Ignore ENOENT (file not found), rethrow others
                if (error.code !== 'ENOENT') throw error;
            }


            // Clone the repository using Git
            // Ensure sourcePath is treated as a local path by git clone
            await execPromise(`git clone "file://${sourcePath}" "${targetPath}"`);

            return {
                status: ResponseStatus.SUCCESS,
                message: `Repository ${repoName} successfully cloned to ${targetPath}`,
                data: path.join('temp-working-directory', repoName) // Return relative path from user source root
            };
        } catch (error: any) {
            console.error('Error cloning repository in service:', error);
            return { status: ResponseStatus.FAILED, message: 'Failed to clone repository', error: error.stderr || error.message || 'Unknown error during clone' };
        }
    }

    /**
     * Gets content of a file or directory within the user's temp workdir.
     */
    public async getPathContent(username: string, relativePath: string): Promise<ApiResponse<FolderContent | FileContent | null>> {
        const pathValidationResult = await this.resolveAndValidatePath(username, relativePath);
        if (pathValidationResult.status === ResponseStatus.FAILED || !pathValidationResult.data) {
            return { status: ResponseStatus.FAILED, message: pathValidationResult.message, error: pathValidationResult.error };
        }
        const { fullPath, normalizedPath } = pathValidationResult.data;

        try {
            // Check existence first
             try {
                 await fsp.access(fullPath);
             } catch (error) {
                 return { status: ResponseStatus.FAILED, message: 'Path not found', error: 'ENOENT' };
             }

            const stats = await fsp.stat(fullPath);

            if (stats.isDirectory()) {
                const items = await fsp.readdir(fullPath);
                const contentDetails = await Promise.all(
                    items.map(async (item) => {
                        const itemPath = path.join(fullPath, item);
                        let itemStat;
                        try {
                            itemStat = await fsp.stat(itemPath);
                            return {
                                name: item,
                                type: itemStat.isDirectory() ? 'folder' : 'file',
                                size: itemStat.size,
                                lastModified: itemStat.mtime
                            } as FileDetails;
                        } catch (statError) {
                            // Handle cases where item might disappear between readdir and stat (rare)
                            console.error(`Could not stat item ${itemPath}:`, statError);
                            return null; // Or some indicator of an issue
                        }
                    })
                );

                // Filter out nulls if any stat calls failed
                const validContentDetails = contentDetails.filter(details => details !== null) as FileDetails[];

                return {
                    status: ResponseStatus.SUCCESS,
                    message: 'Folder content retrieved successfully',
                    data: {
                        type: 'folder',
                        path: normalizedPath,
                        content: validContentDetails
                    }
                };
            } else if (stats.isFile()) {
                const fileContent = await fsp.readFile(fullPath, 'utf8');
                return {
                    status: ResponseStatus.SUCCESS,
                    message: 'File content retrieved successfully',
                    data: {
                        type: 'file',
                        path: normalizedPath,
                        content: fileContent,
                        size: stats.size,
                        lastModified: stats.mtime
                    }
                };
            } else {
                // This case should be rare (e.g., symbolic links not followed, special files)
                return { status: ResponseStatus.FAILED, message: 'Path is not a regular file or directory', error: 'Invalid path type' };
            }
        } catch (error: any) {
            console.error('Error fetching path content in service:', error);
            if (error.code === 'ENOENT') {
                return { status: ResponseStatus.FAILED, message: 'Path not found', error: error.message };
            }
            return { status: ResponseStatus.FAILED, message: 'Failed to fetch path content', error: error.message || 'Unknown error' };
        }
    }

    /**
     * Modifies file content within the user's temp workdir.
     */
    public async modifyFile(username: string, relativePath: string, newContent: string): Promise<ApiResponse<string | null>> {
        const pathValidationResult = await this.resolveAndValidatePath(username, relativePath);
        if (pathValidationResult.status === ResponseStatus.FAILED || !pathValidationResult.data) {
            return { status: ResponseStatus.FAILED, message: pathValidationResult.message, error: pathValidationResult.error };
        }
        const { fullPath, normalizedPath } = pathValidationResult.data;

        try {
            // Check if it exists and is a file
            let stats;
             try {
                 stats = await fsp.stat(fullPath);
             } catch (error: any) {
                 if (error.code === 'ENOENT') {
                     return { status: ResponseStatus.FAILED, message: 'File not found', error: 'File not found' };
                 }
                 throw error; // Re-throw other stat errors
             }

            if (!stats.isFile()) {
                return { status: ResponseStatus.FAILED, message: 'The specified path is not a file', error: 'Not a file' };
            }

            // Update file content
            await fsp.writeFile(fullPath, newContent, 'utf8');

            return {
                status: ResponseStatus.SUCCESS,
                message: 'File updated successfully',
                data: normalizedPath
            };
        } catch (error: any) {
            console.error('Error updating file in service:', error);
            // We already handle ENOENT above
            return { status: ResponseStatus.FAILED, message: 'Failed to update file', error: error.message || 'Unknown error' };
        }
    }

    /**
     * Creates a file or folder within the user's temp workdir.
     */
    public async createItem(username: string, relativePath: string, type: 'file' | 'folder', content?: string): Promise<ApiResponse<{ path: string, type: 'file' | 'folder' } | null>> {
        const pathValidationResult = await this.resolveAndValidatePath(username, relativePath);
        if (pathValidationResult.status === ResponseStatus.FAILED || !pathValidationResult.data) {
            return { status: ResponseStatus.FAILED, message: pathValidationResult.message, error: pathValidationResult.error };
        }
        const { fullPath, normalizedPath } = pathValidationResult.data;

        try {
            // Check if item already exists using access (lighter than stat)
            try {
                await fsp.access(fullPath);
                // If access succeeds, the item exists
                return { status: ResponseStatus.FAILED, message: `Item already exists at path: ${normalizedPath}`, error: 'Item exists' };
            } catch (err: any) {
                if (err.code !== 'ENOENT') {
                    throw err; // Re-throw unexpected errors (e.g., permission issues)
                }
                // ENOENT means the path does not exist, which is good, continue creation
            }

            // Ensure parent directory exists
            const parentDir = path.dirname(fullPath);
            await fsp.mkdir(parentDir, { recursive: true });

            if (type === 'folder') {
                await fsp.mkdir(fullPath);
                return {
                    status: ResponseStatus.SUCCESS,
                    message: `Folder created successfully at ${normalizedPath}`,
                    data: { path: normalizedPath, type: 'folder' }
                };
            } else { // type === 'file'
                await fsp.writeFile(fullPath, content || '', 'utf8'); // Create file with optional content or empty
                return {
                    status: ResponseStatus.SUCCESS,
                    message: `File created successfully at ${normalizedPath}`,
                    data: { path: normalizedPath, type: 'file' }
                };
            }
        } catch (error: any) {
            console.error('Error creating item in service:', error);
            return { status: ResponseStatus.FAILED, message: 'Failed to create item', error: error.message || 'Unknown error' };
        }
    }

    /**
     * Removes a file or folder within the user's temp workdir.
     */
    public async removeItem(username: string, relativePath: string): Promise<ApiResponse<string | null>> {
        const pathValidationResult = await this.resolveAndValidatePath(username, relativePath);
        if (pathValidationResult.status === ResponseStatus.FAILED || !pathValidationResult.data) {
            return { status: ResponseStatus.FAILED, message: pathValidationResult.message, error: pathValidationResult.error };
        }
        const { fullPath, normalizedPath } = pathValidationResult.data;

        try {
            // Check if item exists before attempting removal using access
            try {
                await fsp.access(fullPath);
            } catch (error: any) {
                 if (error.code === 'ENOENT') {
                    return { status: ResponseStatus.FAILED, message: 'Item not found', error: 'Item not found' };
                 }
                 throw error; // Re-throw other access errors
            }


            // Remove file or directory (recursively)
            await fsp.rm(fullPath, { recursive: true, force: true });

            return {
                status: ResponseStatus.SUCCESS,
                message: `Item removed successfully from ${normalizedPath}`,
                data: normalizedPath
            };
        } catch (error: any) {
            console.error('Error removing item in service:', error);
            // ENOENT is handled above
            return { status: ResponseStatus.FAILED, message: 'Failed to remove item', error: error.message || 'Unknown error' };
        }
    }

    /**
     * Renames/moves a file or folder within the user's temp workdir.
     */
    public async renameItem(username: string, oldRelativePath: string, newRelativePath: string): Promise<ApiResponse<RenameResult | null>> {
        // Validate old path
        const oldPathValidation = await this.resolveAndValidatePath(username, oldRelativePath);
        if (oldPathValidation.status === ResponseStatus.FAILED || !oldPathValidation.data) {
            return { status: ResponseStatus.FAILED, message: `Old path error: ${oldPathValidation.message}`, error: oldPathValidation.error };
        }
        const { fullPath: oldFullPath, normalizedPath: normalizedOldPath } = oldPathValidation.data;

        // Validate new path
        const newPathValidation = await this.resolveAndValidatePath(username, newRelativePath);
        if (newPathValidation.status === ResponseStatus.FAILED || !newPathValidation.data) {
            return { status: ResponseStatus.FAILED, message: `New path error: ${newPathValidation.message}`, error: newPathValidation.error };
        }
        const { fullPath: newFullPath, normalizedPath: normalizedNewPath } = newPathValidation.data;

        try {
            // Check if old item exists using access
            try {
                await fsp.access(oldFullPath);
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    return { status: ResponseStatus.FAILED, message: `Source item not found at ${normalizedOldPath}`, error: 'Source not found' };
                }
                throw err; // Re-throw other errors
            }

            // Check if new path already exists using access
            try {
                await fsp.access(newFullPath);
                // If access succeeds, the target path exists
                return { status: ResponseStatus.FAILED, message: `Target path already exists at ${normalizedNewPath}`, error: 'Target exists' };
            } catch (err: any) {
                if (err.code !== 'ENOENT') {
                    throw err; // Re-throw unexpected errors
                }
                // ENOENT means the target path does not exist, which is good
            }

            // Ensure parent directory of the new path exists
            const newParentDir = path.dirname(newFullPath);
            await fsp.mkdir(newParentDir, { recursive: true });

            // Rename/move the item
            await fsp.rename(oldFullPath, newFullPath);

            return {
                status: ResponseStatus.SUCCESS,
                message: `Item successfully renamed/moved from ${normalizedOldPath} to ${normalizedNewPath}`,
                data: { oldPath: normalizedOldPath, newPath: normalizedNewPath }
            };
        } catch (error: any) {
            console.error('Error renaming item in service:', error);
            return { status: ResponseStatus.FAILED, message: 'Failed to rename item', error: error.message || 'Unknown error' };
        }
    }
}