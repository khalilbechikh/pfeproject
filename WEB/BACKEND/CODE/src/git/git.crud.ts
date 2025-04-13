import { exec } from 'child_process';
import path from 'path';
import { injectable, inject } from 'inversify';
import  {RepositoryRepository} from "../repositories/repository.repository";

/*  i want to creaet this fucntion inside the class :

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
*/

@injectable()
export  class  GitCrud{
    constructor(@inject("RepositoryRepository") private repoRepo: RepositoryRepository ) {
    }
    async createBareRepo(id: number, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!data.repoName) {
                return reject(new Error("Repository name is required."));
            }

            const scriptPath = path.join(__dirname, 'initGitRepo.sh');

            exec(`bash "${scriptPath}" "${data.repoName}"`, async (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
                console.log(`stdout: ${stdout}`);

                try {
                    await this.repoRepo.createRepository(data);
                    resolve();
                } catch (dbError) {
                    reject(dbError);
                }
            });
        });
    }
async  deleteBareRepo(id: number): Promise<void> {

}

}
