import { injectable, inject } from 'inversify';
import { exec as callbackExec } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import util from 'util';
import { TYPES } from '../di/types';
import { RepositoryRepository } from '../repositories/repository.repository';

const exec = util.promisify(callbackExec);

// TODO: Move these to configuration/environment variables
const GIT_REPO_BASE_PATH = '/srv/git'; // Path inside the container where bare repos are stored
const GIT_TEMP_CLONE_PARENT_PATH = path.join(os.tmpdir(), 'git-clones'); // Base path for temporary clones

interface GitCommandResult {
    stdout: string;
    stderr: string;
}

interface MergeCheckResult {
    status: 'clean' | 'conflict' | 'error';
    conflictingFiles?: string[];
    error?: string;
}

interface MergeResult {
    status: 'merged' | 'error';
    error?: string;
}


@injectable()
export class GitService {

    constructor(
        @inject(TYPES.RepositoryRepository) private repositoryRepository: RepositoryRepository
    ) {
        console.log("GitService initialized");
        // Ensure the parent directory for temporary clones exists
        // This is fire-and-forget, errors will be caught during mkdtemp if needed
        mkdtemp(GIT_TEMP_CLONE_PARENT_PATH).catch(() => {});
    }

    /**
     * Retrieves the full path to a bare repository based on its ID.
     * Requires RepositoryRepository.findRepositoryPathDetails to be implemented.
     */
    private async getRepoFullPath(repoId: number): Promise<string> {
        const repoDetails = await this.repositoryRepository.findRepositoryPathDetails(repoId);
        if (!repoDetails) {
            throw new Error(`Repository details not found for ID: ${repoId}`);
        }
        // Construct path like /srv/git/ownerUsername/repoName.git
        const repoPath = path.join(GIT_REPO_BASE_PATH, repoDetails.ownerUsername, `${repoDetails.repoName}.git`);
        console.log(`Constructed repo path for ID ${repoId}: ${repoPath}`);
        // TODO: Add check to ensure path exists? (fs.promises.access)
        return repoPath;
    }

    /**
     * Executes a Git command in a specified directory.
     */
    private async executeGitCommand(command: string, cwd: string): Promise<GitCommandResult> {
        // Basic sanitization/quoting for safety, though complex inputs might need more robust handling
        const safeCommand = `git ${command}`; // Rely on exec shell parsing for now
        console.log(`Executing command in ${cwd}: ${safeCommand}`);
        try {
            // Set a reasonable timeout (e.g., 60 seconds)
            const { stdout, stderr } = await exec(safeCommand, { cwd, timeout: 60000 });
            console.log(`Command "${safeCommand}" stdout:\n${stdout}`);
            if (stderr) {
                console.warn(`Command "${safeCommand}" stderr:\n${stderr}`);
            }
            return { stdout, stderr };
        } catch (error: any) {
            console.error(`Error executing command "${safeCommand}" in ${cwd}:`, error);
            throw new Error(`Git command failed: ${command}\nError: ${error.message}\nStderr: ${error.stderr || 'N/A'}`);
        }
    }

    /**
     * Sets up a temporary non-bare clone of the target repository,
     * adds the source repository as a remote, and fetches the source branch.
     */
    private async setupTemporaryClone(targetRepoId: number, sourceRepoId: number, sourceBranch: string): Promise<{ tempRepoPath: string, sourceRemoteName: string }> {
        const targetRepoPath = await this.getRepoFullPath(targetRepoId);
        const sourceRepoPath = await this.getRepoFullPath(sourceRepoId);
        // Use a more descriptive remote name to avoid potential clashes if multiple PRs from the same repo are processed concurrently
        const sourceRemoteName = `pr-source-${sourceRepoId}-${Date.now()}`;

        let tempRepoPath: string | undefined;
        try {
            tempRepoPath = await mkdtemp(path.join(GIT_TEMP_CLONE_PARENT_PATH, `pr-${targetRepoId}-merge-`));
            console.log(`Created temporary directory: ${tempRepoPath}`);

            // Clone the target repository (non-bare) into the temp dir
            await this.executeGitCommand(`clone --quiet "${targetRepoPath}" .`, tempRepoPath);

            // Add the source repository as a remote
            await this.executeGitCommand(`remote add ${sourceRemoteName} "${sourceRepoPath}"`, tempRepoPath);

            // Fetch the specific source branch from the new remote
            // Use --depth 1 if history isn't needed for the operation (diff/merge usually don't)
            await this.executeGitCommand(`fetch --quiet --depth=1 ${sourceRemoteName} ${sourceBranch}`, tempRepoPath);

            return { tempRepoPath, sourceRemoteName };
        } catch (error) {
            if (tempRepoPath) {
                await this.cleanupTemporaryClone(tempRepoPath);
            }
            console.error('Error during temporary clone setup:', error);
            throw error; // Re-throw the error
        }
    }

    /**
     * Removes the temporary clone directory.
     */
    private async cleanupTemporaryClone(tempRepoPath: string): Promise<void> {
        console.log(`Cleaning up temporary directory: ${tempRepoPath}`);
        try {
            await rm(tempRepoPath, { recursive: true, force: true, maxRetries: 3 });
        } catch (error) {
            console.error(`Failed to clean up temporary directory ${tempRepoPath}:`, error);
            // Log the error but don't necessarily throw
        }
    }

    /**
     * Gets the diff between the target branch and the source branch.
     */
    async getDiff(targetRepoId: number, targetBranch: string, sourceRepoId: number, sourceBranch: string): Promise<string> {
        let setupResult: { tempRepoPath: string; sourceRemoteName: string } | undefined;
        try {
            setupResult = await this.setupTemporaryClone(targetRepoId, sourceRepoId, sourceBranch);
            const { tempRepoPath, sourceRemoteName } = setupResult;

            // Fetch the target branch explicitly to ensure we have its latest state for diff comparison
            // Use --depth 1 as we only need the tip for diffing against the merge base
            await this.executeGitCommand(`fetch --quiet --depth=1 origin ${targetBranch}`, tempRepoPath);

            // Get the diff using the 'three-dot' notation, which compares the source branch tip
            // against the merge base with the target branch. This shows changes introduced by the source branch.
            const diffCommand = `diff origin/${targetBranch}...${sourceRemoteName}/${sourceBranch}`;
            const { stdout } = await this.executeGitCommand(diffCommand, tempRepoPath);

            return stdout;
        } finally {
            if (setupResult?.tempRepoPath) {
                await this.cleanupTemporaryClone(setupResult.tempRepoPath);
            }
        }
    }

    /**
     * Checks if merging the source branch into the target branch would cause conflicts.
     */
    async checkMergeConflict(targetRepoId: number, targetBranch: string, sourceRepoId: number, sourceBranch: string): Promise<MergeCheckResult> {
        let setupResult: { tempRepoPath: string; sourceRemoteName: string } | undefined;
        try {
            setupResult = await this.setupTemporaryClone(targetRepoId, sourceRepoId, sourceBranch);
            const { tempRepoPath, sourceRemoteName } = setupResult;

            // Fetch the target branch explicitly to ensure we merge against its latest state
            await this.executeGitCommand(`fetch --quiet origin ${targetBranch}`, tempRepoPath);
            await this.executeGitCommand(`checkout ${targetBranch}`, tempRepoPath);

            // Attempt the merge without committing or fast-forwarding
            const mergeCommand = `merge --no-commit --no-ff ${sourceRemoteName}/${sourceBranch}`;
            try {
                await this.executeGitCommand(mergeCommand, tempRepoPath);
                console.log('Merge preview successful (no conflicts). Aborting preview merge.');
                await this.executeGitCommand('merge --abort', tempRepoPath);
                return { status: 'clean' };
            } catch (error: any) {
                const output = error.stderr?.toLowerCase() || error.message?.toLowerCase() || '';
                if (output.includes('conflict') || output.includes('automatic merge failed')) {
                    console.warn('Merge preview detected conflicts.');
                    let conflictingFiles: string[] = [];
                    try {
                        // Use diff --name-only after a failed merge to list conflicted files
                        const statusResult = await this.executeGitCommand('diff --name-only --diff-filter=U', tempRepoPath);
                        conflictingFiles = statusResult.stdout
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0);
                        console.log('Conflicting files:', conflictingFiles);
                    } catch (statusError) {
                        console.error('Failed to get conflicting files after merge failure:', statusError);
                    }
                    await this.executeGitCommand('merge --abort', tempRepoPath);
                    return { status: 'conflict', conflictingFiles };
                } else {
                    console.error('Unexpected error during merge preview:', error);
                    try { await this.executeGitCommand('merge --abort', tempRepoPath); } catch { /* Ignore abort error */ }
                    return { status: 'error', error: error.message || 'Unknown merge error' };
                }
            }
        } finally {
            if (setupResult?.tempRepoPath) {
                await this.cleanupTemporaryClone(setupResult.tempRepoPath);
            }
        }
    }

    /**
     * Merges the source branch into the target branch and pushes the result to the bare repository.
     */
    async mergeBranches(targetRepoId: number, targetBranch: string, sourceRepoId: number, sourceBranch: string, commitMessage: string): Promise<MergeResult> {
        let setupResult: { tempRepoPath: string; sourceRemoteName: string } | undefined;
        const targetRepoPath = await this.getRepoFullPath(targetRepoId); // Get path for push target

        try {
            setupResult = await this.setupTemporaryClone(targetRepoId, sourceRepoId, sourceBranch);
            const { tempRepoPath, sourceRemoteName } = setupResult;

            // Fetch and checkout the target branch
            await this.executeGitCommand(`fetch --quiet origin ${targetBranch}`, tempRepoPath);
            await this.executeGitCommand(`checkout ${targetBranch}`, tempRepoPath);

            // Perform the merge (create merge commit, no fast-forward)
            // Escape double quotes in the commit message
            const escapedMessage = commitMessage.replace(/"/g, '\\"'); // Keep this escape for the inner quotes
            const mergeCommand = `merge --no-ff -m "${escapedMessage}" ${sourceRemoteName}/${sourceBranch}`;
            await this.executeGitCommand(mergeCommand, tempRepoPath);
            console.log('Merge successful in temporary clone.');

            // Push the merged target branch back to the original bare repository
            const pushCommand = `push origin ${targetBranch}`;
            await this.executeGitCommand(pushCommand, tempRepoPath);
            console.log(`Successfully pushed merged ${targetBranch} to ${targetRepoPath}`);

            return { status: 'merged' };
        } catch (error: any) {
            console.error('Error during merge execution:', error);
             if (setupResult?.tempRepoPath) {
                 // Attempt to clean up merge state in temp repo if merge/push failed
                 try { await this.executeGitCommand('merge --abort', setupResult.tempRepoPath); } catch { /* Ignore */ }
             }
            return { status: 'error', error: error.message || 'Unknown merge execution error' };
        } finally {
            if (setupResult?.tempRepoPath) {
                await this.cleanupTemporaryClone(setupResult.tempRepoPath);
            }
        }
    }
}
