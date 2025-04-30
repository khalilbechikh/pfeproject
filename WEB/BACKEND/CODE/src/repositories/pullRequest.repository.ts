import { PrismaClient, pull_request, PullRequestStatus, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../di/types';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class PullRequestRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {
        console.log("PullRequestRepository initialized");
    }

    /**
     * Creates a new pull request
     */
    async createPullRequest(
        data: Prisma.pull_requestCreateInput
    ): Promise<ApiResponse<pull_request>> {
        try {
            const pullRequest = await this.prisma.pull_request.create({
                data
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Pull request created successfully',
                data: pullRequest
            };
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create pull request',
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
            const deletedPullRequest = await this.prisma.pull_request.delete({
                where: id
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Pull request deleted successfully',
                data: deletedPullRequest
            };
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to delete pull request',
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
            const data: Prisma.pull_requestUpdateInput = {
                status,
                // Set merged_at timestamp if the status is being changed to MERGED
                ...(status === PullRequestStatus.MERGED && { merged_at: new Date() })
            };

            const updatedPullRequest = await this.prisma.pull_request.update({
                where: id,
                data
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: `Pull request status updated to ${status}`,
                data: updatedPullRequest
            };
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update pull request status',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
