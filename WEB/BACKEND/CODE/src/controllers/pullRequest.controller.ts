import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { PullRequestService } from '../services/pullRequest.services';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { PullRequestStatus, Prisma } from '@prisma/client';

@injectable()
export class PullRequestController {
    constructor(
        @inject(TYPES.PullRequestService) private pullRequestService: PullRequestService
    ) {
        console.log("PullRequestController initialized");
    }

    // --- Route Handlers ---

    public async createPullRequest(req: Request, res: Response): Promise<void> {
        try {
            const data: Prisma.pull_requestCreateInput = req.body; // Add more robust validation if needed
            const result: ApiResponse = await this.pullRequestService.createPullRequest(data);
            const statusCode = result.status === ResponseStatus.SUCCESS ? 201 : 500; // 201 Created
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in createPullRequest controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to create pull request',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async getAllPullRequests(req: Request, res: Response): Promise<void> {
        try {
            const ownerUserId = req.query.ownerUserId ? parseInt(req.query.ownerUserId as string, 10) : undefined;
            const sourceRepoId = req.query.sourceRepoId ? parseInt(req.query.sourceRepoId as string, 10) : undefined;
            const targetRepoId = req.query.targetRepoId ? parseInt(req.query.targetRepoId as string, 10) : undefined;

            // Basic validation for integer parsing
            if (req.query.ownerUserId && isNaN(ownerUserId!)) {
                 const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid ownerUserId parameter' };
                 res.status(400).json(response);
                 return;
            }
            if (req.query.sourceRepoId && isNaN(sourceRepoId!)) {
                 const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid sourceRepoId parameter' };
                 res.status(400).json(response);
                 return;
            }
            if (req.query.targetRepoId && isNaN(targetRepoId!)) {
                 const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid targetRepoId parameter' };
                 res.status(400).json(response);
                 return;
            }

            const result: ApiResponse = await this.pullRequestService.getAllPullRequests(ownerUserId, sourceRepoId, targetRepoId);
            const statusCode = result.status === ResponseStatus.SUCCESS ? 200 : 500; // Assuming service handles not found cases gracefully
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in getAllPullRequests controller:", error);
             const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to retrieve pull requests',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async previewPullRequest(req: Request, res: Response): Promise<void> {
        try {
            const pullRequestId = parseInt(req.params.id, 10);
            if (isNaN(pullRequestId)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid Pull Request ID' };
                res.status(400).json(response);
                return;
            }
            const result: ApiResponse = await this.pullRequestService.previewPullRequest(pullRequestId);
            let statusCode = 500; // Default to internal server error
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
            } else if (result.message?.includes('not found')) { // Check message for specific failure cases
                statusCode = 404;
            }
            // Add more specific status codes based on result.message or result.error if needed
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in previewPullRequest controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to preview pull request',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async preparePullRequestMerge(req: Request, res: Response): Promise<void> {
        try {
            const pullRequestId = parseInt(req.params.id, 10);
            if (isNaN(pullRequestId)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid Pull Request ID' };
                res.status(400).json(response);
                return;
            }
            const result: ApiResponse = await this.pullRequestService.preparePullRequestMerge(pullRequestId);
            let statusCode = 500;
             if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
            } else if (result.message?.includes('not found')) {
                statusCode = 404;
            } else if (result.error === 'Unresolved conflicts') { // Example: Check error field
                 statusCode = 409; // Conflict
             }
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in preparePullRequestMerge controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to prepare pull request merge',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async finalizePullRequestMerge(req: Request, res: Response): Promise<void> {
        try {
            const pullRequestId = parseInt(req.params.id, 10);
            if (isNaN(pullRequestId)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid Pull Request ID' };
                res.status(400).json(response);
                return;
            }
            const result: ApiResponse = await this.pullRequestService.finalizePullRequestMerge(pullRequestId);
            let statusCode = 500;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
            } else if (result.error === 'Unresolved conflicts') {
                statusCode = 409; // Conflict
            } else if (result.message?.includes('not found')) {
                statusCode = 404;
            }
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in finalizePullRequestMerge controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to finalize pull request merge',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async updatePullRequestStatus(req: Request, res: Response): Promise<void> {
        try {
            const pullRequestId = parseInt(req.params.id, 10);
            const { status } = req.body;

            if (isNaN(pullRequestId)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid Pull Request ID' };
                res.status(400).json(response);
                return;
            }
            if (!status || !Object.values(PullRequestStatus).includes(status)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid or missing status in request body' };
                res.status(400).json(response);
                return;
            }

            const result: ApiResponse = await this.pullRequestService.updatePullRequestStatus({ id: pullRequestId }, status);
            let statusCode = 500;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
            } else if (result.message?.includes('not found')) {
                statusCode = 404;
            }
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in updatePullRequestStatus controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to update pull request status',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async deletePullRequest(req: Request, res: Response): Promise<void> {
        try {
            const pullRequestId = parseInt(req.params.id, 10);
            if (isNaN(pullRequestId)) {
                const response: ApiResponse = { status: ResponseStatus.FAILED, message: 'Invalid Pull Request ID' };
                res.status(400).json(response);
                return;
            }
            const result: ApiResponse = await this.pullRequestService.deletePullRequest({ id: pullRequestId });
            let statusCode = 500;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200; // Or 204 No Content if nothing is returned in data
            } else if (result.message?.includes('not found')) {
                statusCode = 404;
            }
            res.status(statusCode).json(result);
        } catch (error) {
            console.error("Error in deletePullRequest controller:", error);
            const response: ApiResponse = {
                status: ResponseStatus.FAILED,
                message: 'Controller failed to delete pull request',
                error: error instanceof Error ? error.message : String(error),
            };
            res.status(500).json(response);
        }
    }

    public async getPullRequestDiffById(req: Request, res: Response): Promise<void> {
        // This route is deprecated and just calls the preview method
        console.warn("Deprecated route /:id/diff accessed, redirecting to preview logic.");
        await this.previewPullRequest(req, res); // Reuse the preview logic including its response handling
    }

    // Removed the sendResponse helper method as it's no longer needed with direct response handling
}
