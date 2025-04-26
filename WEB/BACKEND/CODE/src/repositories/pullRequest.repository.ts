import { PrismaClient, pull_request, PullRequestStatus, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../di/types';

@injectable()
export class PullRequestRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {
        console.log("PullRequestRepository initialized");
    }

    /**
     * Create a new pull request
     */
    async createPullRequest(data: Prisma.pull_requestUncheckedCreateInput): Promise<pull_request> {
        console.log('=== PULL REQUEST REPOSITORY: createPullRequest START ===');
        console.log('Received data:', JSON.stringify(data, null, 2));
        try {
            // Ensure default status if not provided
            const dataToSave = {
                ...data,
                status: data.status || PullRequestStatus.OPEN, // Default to OPEN
            };

            console.log('Data to save:', JSON.stringify(dataToSave, null, 2));

            // Verify related records exist (optional but good practice)
            if (dataToSave.author_id) {
                const authorExists = await this.prisma.users.findUnique({ where: { id: dataToSave.author_id } });
                if (!authorExists) throw new Error(`Author user with ID ${dataToSave.author_id} does not exist.`);
            }
            const sourceRepoExists = await this.prisma.repository.findUnique({ where: { id: dataToSave.source_repository_id } });
            if (!sourceRepoExists) throw new Error(`Source repository with ID ${dataToSave.source_repository_id} does not exist.`);
            const targetRepoExists = await this.prisma.repository.findUnique({ where: { id: dataToSave.target_repository_id } });
            if (!targetRepoExists) throw new Error(`Target repository with ID ${dataToSave.target_repository_id} does not exist.`);

            console.log('Calling prisma.pull_request.create');
            const newPullRequest = await this.prisma.pull_request.create({
                data: dataToSave,
            });

            console.log('Pull request created successfully:', JSON.stringify(newPullRequest));
            console.log('=== PULL REQUEST REPOSITORY: createPullRequest END - Success ===');
            return newPullRequest;
        } catch (error: unknown) {
            console.error('=== PULL REQUEST REPOSITORY: createPullRequest ERROR ===');
            console.error('Error in PullRequestRepository.createPullRequest:', error);
            // Log Prisma-specific errors if available
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                console.error('Prisma error message:', error.message);
            }
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
            throw error;
        }
    }

    /**
     * Find a pull request by its ID
     */
    async findPullRequestById(id: number): Promise<pull_request | null> {
        try {
            const pullRequest = await this.prisma.pull_request.findUnique({
                where: { id: id },
                include: { // Include related data for context
                    author: true,
                    source_repository: true,
                    target_repository: true,
                }
            });
            return pullRequest;
        } catch (error: unknown) {
            console.error(`Error finding pull request with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update the status of a pull request (e.g., to MERGED or CLOSED)
     */
    async updatePullRequestStatus(id: number, status: PullRequestStatus, mergedAt?: Date): Promise<pull_request> {
        console.log(`=== PULL REQUEST REPOSITORY: updatePullRequestStatus START (ID: ${id}, Status: ${status}) ===`);
        try {
            const dataToUpdate: Prisma.pull_requestUpdateInput = {
                status: status,
                updated_at: new Date(), // Explicitly set updated_at
            };

            if (status === PullRequestStatus.MERGED) {
                dataToUpdate.merged_at = mergedAt || new Date(); // Set merged timestamp
            }

            console.log('Data to update:', JSON.stringify(dataToUpdate, null, 2));

            const updatedPullRequest = await this.prisma.pull_request.update({
                where: { id: id },
                data: dataToUpdate,
            });

            console.log('Pull request status updated successfully:', JSON.stringify(updatedPullRequest));
            console.log('=== PULL REQUEST REPOSITORY: updatePullRequestStatus END - Success ===');
            return updatedPullRequest;
        } catch (error: unknown) {
            console.error(`=== PULL REQUEST REPOSITORY: updatePullRequestStatus ERROR (ID: ${id}) ===`);
            console.error('Error updating pull request status:', error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                console.error('Prisma error message:', error.message);
            }
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
            throw error;
        }
    }

    // Add other methods as needed, e.g., find by repository, find by author, etc.
    async findOpenPullRequestsByTargetRepo(targetRepoId: number): Promise<pull_request[]> {
        try {
            const pullRequests = await this.prisma.pull_request.findMany({
                where: {
                    target_repository_id: targetRepoId,
                    status: PullRequestStatus.OPEN,
                },
                include: {
                    author: true,
                    source_repository: true,
                },
                orderBy: {
                    created_at: 'desc',
                }
            });
            return pullRequests;
        } catch (error: unknown) {
            console.error(`Error finding open pull requests for target repo ID ${targetRepoId}:`, error);
            throw error;
        }
    }
}
