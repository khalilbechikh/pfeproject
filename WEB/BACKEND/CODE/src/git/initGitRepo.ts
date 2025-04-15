import { exec } from 'child_process';
import path from 'path';
import { injectable, inject } from 'inversify';

/**
 * Function to create a bare Git repository under a user's directory.
 * @param repoName - Name of the repository to create
 * @param username - Username to organize repositories
 */
export const createBareRepo = (repoName: string, username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!repoName) {
            return reject(new Error("Repository name is required."));
        }

        if (!username) {
            return reject(new Error("Username is required."));
        }

        const scriptPath = path.join(__dirname, 'initGitRepo.sh');

        exec(`bash "${scriptPath}" "${repoName}" "${username}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);

            resolve();
        });
    });
};
