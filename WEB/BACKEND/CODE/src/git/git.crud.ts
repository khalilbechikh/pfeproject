import { exec } from 'child_process';
import path from 'path';
import { injectable, inject } from 'inversify';
import { RepositoryRepository } from "../repositories/repository.repository";
import fs from 'fs';
import { TYPES } from '../di/types';

// TODO: Move this to configuration/environment variables, ensure consistency with GitService
const GIT_REPO_BASE_PATH = '/srv/git';

@injectable()
export class GitCrud {
    constructor(@inject(TYPES.RepositoryRepository) private repoRepo: RepositoryRepository) {
        console.log('GitCrud constructor called, RepositoryRepository injected');
    }

    /**
     * Creates a bare Git repository under the user's directory and records it in the database.
     * @param userId - User ID
     * @param data - Repository data including repository name and username
     * @returns Promise resolving when repository is created
     */
    async createBareRepo(userId: number, data: any): Promise<void> {
        console.log('=== GITCRUD: createBareRepo START ===');
        console.log('userId:', userId);
        console.log('data:', JSON.stringify(data));
        
        return new Promise((resolve, reject) => {
            if (!data.repoName) {
                console.log('Repository name not provided');
                return reject(new Error("Repository name is required."));
            }

            if (!data.username) {
                console.log('Username not provided');
                return reject(new Error("Username is required."));
            }

            const scriptPath = path.join(__dirname, 'initGitRepo.sh');
            console.log('Using script at path:', scriptPath);
            
            // Check if script exists and is executable
            try {
                fs.accessSync(scriptPath, fs.constants.X_OK);
                console.log('Script exists and is executable');
            } catch (error: unknown) {
                console.error('Script access error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return reject(new Error(`Cannot access script at ${scriptPath}: ${errorMessage}`));
            }

            const command = `bash "${scriptPath}" "${data.repoName}" "${data.username}"`;
            console.log('Executing command:', command);

            exec(command, async (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing script:', error);
                    return reject(error);
                }
                
                if (stderr) {
                    console.error(`Script stderr output: ${stderr}`);
                }
                
                console.log(`Script stdout output: ${stdout}`);
                console.log('Git repository created successfully on filesystem');

                try {
                    console.log('Creating repository entry in database');
                    // Create repository entry in database with owner
                    const repoData = {
                        name: data.name,
                        description: data.description || 
                            `Repository for ${data.username}/${data.repoName}.git`,
                        is_private: data.is_private || false,
                        owner: {
                            connect: {
                                id: userId
                            }
                        }
                    };
                    
                    console.log('Database repository data:', JSON.stringify(repoData));
                    const createdRepo = await this.repoRepo.createRepository(repoData);
                    console.log('Repository created in database with ID:', createdRepo.id);
                    console.log('=== GITCRUD: createBareRepo END - Success ===');
                    resolve();
                } catch (dbError: unknown) {
                    console.error('=== GITCRUD: createBareRepo ERROR ===');
                    console.error('Database error creating repository:', dbError);
                    console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace available');
                    reject(dbError);
                }
            });
        });
    }

    /**
     * Deletes a bare Git repository from the filesystem and the database.
     * @param id - Repository ID
     * @returns Promise resolving when repository is deleted
     */
    async deleteBareRepo(id: number): Promise<void> {
        console.log(`=== GITCRUD: deleteBareRepo START (ID: ${id}) ===`);
        // Get repository path details from database
        const repoDetails = await this.repoRepo.findRepositoryPathDetails(id);

        if (!repoDetails) {
            console.error(`Repository path details not found for ID: ${id}`);
            throw new Error(`Repository with ID ${id} not found or owner details missing.`);
        }

        const { ownerUsername, repoName } = repoDetails;
        // Construct the correct path including the username
        const repoFullPath = path.join(GIT_REPO_BASE_PATH, ownerUsername, `${repoName}.git`);
        console.log(`Constructed path for deletion: ${repoFullPath}`);

        return new Promise((resolve, reject) => {
            // Construct deletion command using the full path
            // Ensure path is quoted to handle potential special characters
            const command = `rm -rf "${repoFullPath}"`;
            console.log(`Executing deletion command: ${command}`);

            exec(command, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing filesystem delete command for ${repoFullPath}:`, error);
                    return reject(new Error(`Failed to delete repository directory: ${error.message}`));
                }

                if (stderr) {
                    console.warn(`Filesystem delete command stderr for ${repoFullPath}: ${stderr}`);
                }

                console.log(`Filesystem repository deleted successfully: ${repoFullPath}`);
                console.log(`Script stdout output: ${stdout}`);

                try {
                    console.log(`Deleting repository entry from database for ID: ${id}`);
                    await this.repoRepo.deleteRepository(id);
                    console.log(`Database entry deleted successfully for ID: ${id}`);
                    console.log(`=== GITCRUD: deleteBareRepo END - Success (ID: ${id}) ===`);
                    resolve();
                } catch (dbError: unknown) {
                    console.error(`=== GITCRUD: deleteBareRepo ERROR (ID: ${id}) ===`);
                    console.error(`Database error deleting repository with ID ${id}:`, dbError);
                    reject(new Error(`Failed to delete repository database entry: ${dbError instanceof Error ? dbError.message : String(dbError)}`));
                }
            });
        });
    }
}
