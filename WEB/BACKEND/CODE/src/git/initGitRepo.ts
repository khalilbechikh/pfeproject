import { exec } from 'child_process';
import path from 'path';

/**
 * Function to create a bare Git repository.
 * @param repoName - Name of the repository to create.
 */
export const createBareRepo = (repoName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!repoName) {
            return reject(new Error("Repository name is required."));
        }

        const scriptPath = path.join(__dirname,'initGitRepo.sh');

        exec(`bash "${scriptPath}" "${repoName}"`, (error, stdout, stderr) => {
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
