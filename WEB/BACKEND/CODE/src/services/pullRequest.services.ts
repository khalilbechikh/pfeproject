import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { PullRequestRepository } from '../repositories/pullRequest.repository';
import { RepositoryRepository } from '../repositories/repository.repository';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { PrismaClient, pull_request, PullRequestStatus, Prisma } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises'; // Import fs promises

// Promisify exec to use with async/await
const execPromise = util.promisify(exec);

// Define base paths - Adjust if necessary
const BASE_REPO_PATH = '/home/jobran/Desktop/internship/my-project/VOLUMES/repositorys';
const TEMP_WORKDIR_BASE_PATH = path.join(BASE_REPO_PATH, 'tempworkdir');

// Define interface for the pull request diff preview response
interface PullRequestDiffPreview {
  conflict: boolean;
  changes: {
    file: string;
    status: 'added' | 'deleted' | 'modified';
    diff: string | null;
    datetime: string;
  }[];
}

@injectable()
export class PullRequestService {
    constructor(
        @inject(TYPES.PullRequestRepository) private pullRequestRepository: PullRequestRepository,
        @inject(TYPES.RepositoryRepository) private repositoryRepository: RepositoryRepository // Inject RepositoryRepository
    ) {
        console.log("PullRequestService initialized");
    }

    // Helper function to get repository path details
    private async getRepoPathDetails(repoId: number): Promise<{ ownerUsername: string, repoName: string } | null> {
        const response = await this.repositoryRepository.findRepositoryPathDetails(repoId);
        if (response.status === ResponseStatus.SUCCESS && response.data) {
            return response.data;
        } else {
            console.error(`Failed to get path details for repo ID ${repoId}: ${response.message || response.error}`);
            return null;
        }
    }

    // Helper function to construct the full bare repository path
    private getFullBareRepoPath(details: { ownerUsername: string, repoName: string }): string {
        return path.join(BASE_REPO_PATH, details.ownerUsername, `${details.repoName}.git`);
    }

    // Helper function to construct the temporary working directory path for a PR
    private getTempWorkdirPath(pullRequestId: number): string {
        return path.join(TEMP_WORKDIR_BASE_PATH, `pr-${pullRequestId}`);
    }

    /**
     * Creates a new pull request
     */
    async createPullRequest(
        data: Prisma.pull_requestCreateInput
    ): Promise<ApiResponse<pull_request>> {
        try {
            return await this.pullRequestRepository.createPullRequest(data);
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Service failed to create pull request',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Deletes a pull request by ID
     */
    async deletePullRequest(
        id: Prisma.pull_requestWhereUniqueInput
    ): Promise<ApiResponse<pull_request>> {
        try {
            return await this.pullRequestRepository.deletePullRequest(id);
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Service failed to delete pull request',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Updates the status of a pull request
     */
    async updatePullRequestStatus(
        id: Prisma.pull_requestWhereUniqueInput,
        status: PullRequestStatus
    ): Promise<ApiResponse<pull_request>> {
        try {
            return await this.pullRequestRepository.updatePullRequestStatus(id, status);
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: `Service failed to update pull request status to ${status}`,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Retrieves pull requests based on optional filtering criteria
     */
    async getAllPullRequests(
        ownerUserId?: number,
        sourceRepoId?: number,
        targetRepoId?: number
    ): Promise<ApiResponse<pull_request[]>> {
        try {
            return await this.pullRequestRepository.getAllPullRequests(
                ownerUserId,
                sourceRepoId,
                targetRepoId
            );
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Service failed to retrieve pull requests',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Preview the differences between source and target branches for a pull request using the bash script.
     * This replaces the previous implementation of previewPullRequestDiff.
     * @param pullRequestId ID of the pull request
     * @returns ApiResponse containing conflict status and changes information
     */
    async previewPullRequest(pullRequestId: number): Promise<ApiResponse<PullRequestDiffPreview>> {
        console.log(`Starting preview for PR ID: ${pullRequestId}`);
        try {
            // 1. Get PR details
            const prResponse = await this.pullRequestRepository.getPullRequestById(pullRequestId);
            if (prResponse.status !== ResponseStatus.SUCCESS || !prResponse.data) {
                throw new Error(`Pull request ${pullRequestId} not found or failed to retrieve: ${prResponse.message || prResponse.error}`);
            }
            const pr = prResponse.data;
            console.log(`PR details retrieved: Source Repo ID ${pr.source_repository_id}, Target Repo ID ${pr.target_repository_id}`);

            // 2. Get repository path details for source and target
            const sourceRepoDetails = await this.getRepoPathDetails(pr.source_repository_id);
            const targetRepoDetails = await this.getRepoPathDetails(pr.target_repository_id);

            if (!sourceRepoDetails || !targetRepoDetails) {
                throw new Error('Failed to retrieve repository path details for source or target repository.');
            }
            console.log(`Source details: ${JSON.stringify(sourceRepoDetails)}, Target details: ${JSON.stringify(targetRepoDetails)}`);

            // 3. Construct full paths to bare repositories
            const maintainerRepoPath = this.getFullBareRepoPath(targetRepoDetails); // Target is maintainer
            const contributorRepoPath = this.getFullBareRepoPath(sourceRepoDetails); // Source is contributor
            console.log(`Maintainer path: ${maintainerRepoPath}, Contributor path: ${contributorRepoPath}`);

            // 4. Construct path to the script
            const scriptPath = path.resolve(__dirname, '../bash/preview_pull_request_with_conflict_info.sh');
            console.log(`Script path: ${scriptPath}`);

            // 5. Execute the script
            const command = `bash "${scriptPath}" "${maintainerRepoPath}" "${contributorRepoPath}" "${pr.source_branch}" "${pr.target_branch}"`;
            console.log(`Executing command: ${command}`);
            const { stdout, stderr } = await execPromise(command);

            if (stderr) {
                console.warn('Script execution stderr (preview):', stderr);
                // Decide if stderr always means failure, or could be warnings
            }

            console.log('Script execution stdout (preview):', stdout);

            // 6. Parse and return the result
            const diffResult: PullRequestDiffPreview = JSON.parse(stdout.trim());

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Pull request diff preview generated successfully',
                data: diffResult
            };
        } catch (error: any) {
            console.error('Error previewing pull request diff:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to preview pull request diff',
                error: error.message || String(error)
            };
        }
    }

    /**
     * Prepares the merge environment for a pull request using the bash script.
     * Creates a temporary working directory and attempts the merge without committing.
     * @param pullRequestId ID of the pull request
     * @returns ApiResponse indicating success or failure, and the path to the temporary directory
     */
    async preparePullRequestMerge(pullRequestId: number): Promise<ApiResponse<{ tempWorkdirPath: string }>> {
        console.log(`Starting merge preparation for PR ID: ${pullRequestId}`);
        try {
            // 1. Get PR details
            const prResponse = await this.pullRequestRepository.getPullRequestById(pullRequestId);
            if (prResponse.status !== ResponseStatus.SUCCESS || !prResponse.data) {
                throw new Error(`Pull request ${pullRequestId} not found or failed to retrieve: ${prResponse.message || prResponse.error}`);
            }
            const pr = prResponse.data;

            // 2. Get repository path details
            const sourceRepoDetails = await this.getRepoPathDetails(pr.source_repository_id);
            const targetRepoDetails = await this.getRepoPathDetails(pr.target_repository_id);
            if (!sourceRepoDetails || !targetRepoDetails) {
                throw new Error('Failed to retrieve repository path details.');
            }

            // 3. Construct paths
            const maintainerBareRepoPath = this.getFullBareRepoPath(targetRepoDetails);
            const contributorRepoPath = this.getFullBareRepoPath(sourceRepoDetails);
            const tempWorkdirPath = this.getTempWorkdirPath(pullRequestId);
            console.log(`Maintainer bare path: ${maintainerBareRepoPath}`);
            console.log(`Contributor path: ${contributorRepoPath}`);
            console.log(`Temp workdir path: ${tempWorkdirPath}`);

            // Ensure the base temp directory exists
            await fs.mkdir(TEMP_WORKDIR_BASE_PATH, { recursive: true });

            // 4. Construct path to the script
            const scriptPath = path.resolve(__dirname, '../bash/prepare_pull_request_merge.sh');
            console.log(`Script path: ${scriptPath}`);

            // 5. Execute the script
            const command = `bash "${scriptPath}" "${maintainerBareRepoPath}" "${tempWorkdirPath}" "${contributorRepoPath}" "${pr.source_branch}" "${pr.target_branch}"`;
            console.log(`Executing command: ${command}`);
            const { stdout, stderr } = await execPromise(command);

            // Note: The prepare script logs success/conflict info but doesn't necessarily fail on conflict.
            // We rely on the finalize script to check for unresolved conflicts.
            if (stderr) {
                console.warn('Script execution stderr (prepare):', stderr);
            }
            console.log('Script execution stdout (prepare):', stdout);

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Pull request merge preparation initiated successfully. Check logs for conflict status.',
                data: { tempWorkdirPath }
            };
        } catch (error: any) {
            console.error('Error preparing pull request merge:', error);
            // Attempt cleanup if temp dir was created? Maybe not, user might need it.
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to prepare pull request merge',
                error: error.message || String(error)
            };
        }
    }

    /**
     * Finalizes the merge for a pull request using the bash script.
     * Assumes conflicts (if any) have been resolved in the temporary directory.
     * Commits the merge and updates the PR status.
     * @param pullRequestId ID of the pull request
     * @returns ApiResponse indicating success or failure of the final merge commit.
     */
    async finalizePullRequestMerge(pullRequestId: number): Promise<ApiResponse<pull_request>> {
        console.log(`Starting merge finalization for PR ID: ${pullRequestId}`);
        const tempWorkdirPath = this.getTempWorkdirPath(pullRequestId);
        try {
            // 1. Construct path to the script
            const scriptPath = path.resolve(__dirname, '../bash/finalize_pull_request_merge.sh');
            console.log(`Script path: ${scriptPath}`);
            console.log(`Temp workdir path: ${tempWorkdirPath}`);

            // 2. Execute the script
            const command = `bash "${scriptPath}" "${tempWorkdirPath}"`;
            console.log(`Executing command: ${command}`);
            // This script returns exit code 1 if conflicts exist, which execPromise throws as an error.
            const { stdout, stderr } = await execPromise(command);

            if (stderr) {
                console.warn('Script execution stderr (finalize):', stderr);
            }
            console.log('Script execution stdout (finalize):', stdout);

            // 3. If script succeeded (exit code 0), update PR status
            console.log(`Merge commit successful for PR ${pullRequestId}. Updating status.`);
            const updateResponse = await this.pullRequestRepository.updatePullRequestStatus(
                { id: pullRequestId },
                PullRequestStatus.MERGED
            );

            // 4. Optional: Clean up the temporary directory
            try {
                console.log(`Cleaning up temporary directory: ${tempWorkdirPath}`);
                await fs.rm(tempWorkdirPath, { recursive: true, force: true });
            } catch (cleanupError: any) {
                console.error(`Warning: Failed to clean up temporary directory ${tempWorkdirPath}:`, cleanupError);
                // Don't fail the whole operation for cleanup failure
            }

            return updateResponse; // Return the result of the DB update

        } catch (error: any) {
            // Check if the error is due to the script exiting with code 1 (conflicts)
            if (error.code === 1 && error.stderr?.includes('Conflicts still exist')) {
                console.log(`Finalize script failed for PR ${pullRequestId}: Conflicts still exist.`);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Merge failed: Conflicts still exist. Resolve them in the temporary directory and try again.',
                    error: 'Unresolved conflicts'
                };
            }

            // Handle other errors
            console.error(`Error finalizing pull request merge for PR ${pullRequestId}:`, error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to finalize pull request merge',
                error: error.message || String(error)
            };
        }
    }

    /**
     * Get pull request diff by providing repository and branch information
     * @param pullRequestId ID of the pull request
     * @returns ApiResponse containing conflict status and changes information
     * @deprecated Use previewPullRequest instead which uses the correct script.
     */
    async getPullRequestDiffById(pullRequestId: number): Promise<ApiResponse<PullRequestDiffPreview>> {
        // Keep the old method signature but mark as deprecated and call the new one
        console.warn("getPullRequestDiffById is deprecated, use previewPullRequest instead.");
        return this.previewPullRequest(pullRequestId);
    }
}
