import { exec } from 'child_process';
import path from 'path';
import { injectable, inject } from 'inversify';


/**
 * Function to create a bare Git repository.
 * @param repoName - Name of the repository to create.
 */
// i will create a class containing the  fucntions ans export it instead of direct fucntion













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
