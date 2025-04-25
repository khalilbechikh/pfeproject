import { Prisma, PrismaClient, issue } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class IssueRepository {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Get all issues for a repository
     * @param repositoryId Repository ID to get issues for
     * @returns Promise with ApiResponse containing array of issues
     */
    async getRepositoryIssues(repositoryId: number): Promise<ApiResponse<issue[]>> {
        try {
            const issues = await this.prisma.issue.findMany({
                where: {
                    repository_id: repositoryId
                },
                include: {
                    author: true,
                    issue_comment: true
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository issues retrieved successfully",
                data: issues
            };
        } catch (error) {
            console.error('Error in IssueRepository.getRepositoryIssues:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve repository issues",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get a specific issue by ID
     * @param issueId Issue ID to retrieve
     * @returns Promise with ApiResponse containing the issue
     */
    async getIssueById(issueId: number): Promise<ApiResponse<issue | null>> {
        try {
            const issue = await this.prisma.issue.findUnique({
                where: {
                    id: issueId
                },
                include: {
                    author: true,
                    issue_comment: {
                        include: {
                            author: true
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    }
                }
            });

            if (!issue) {
                return {
                    status: ResponseStatus.FAILED,
                    message: "Issue not found",
                    data: null
                };
            }

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue retrieved successfully",
                data: issue
            };
        } catch (error) {
            console.error('Error in IssueRepository.getIssueById:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve issue",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create a new issue
     * @param createData Object containing repository ID, author ID, title and description
     * @returns Promise with ApiResponse containing the created issue
     */
    async createIssue(
        createData: {
            repositoryId: number;
            authorId: number;
            title: string;
            description?: string | null;
        }
    ): Promise<ApiResponse<issue>> {
        try {
            const issue = await this.prisma.issue.create({
                data: {
                    repository_id: createData.repositoryId,
                    author_id: createData.authorId,
                    title: createData.title,
                    description: createData.description ?? null,
                    status: 'open'
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue created successfully",
                data: issue
            };
        } catch (error) {
            console.error('Error in IssueRepository.createIssue:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to create issue",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update an existing issue
     * @param issueId Issue ID to update
     * @param updateData Data to update on the issue
     * @returns Promise with ApiResponse containing the updated issue
     */
    async updateIssue(
        issueId: number,
        updateData: {
            title?: string;
            description?: string | null; // Allow null
            status?: string;
        }
    ): Promise<ApiResponse<issue>> {
        try {
            // Prisma update should handle null correctly if the schema allows it.
            // Pass updateData directly.
            const issue = await this.prisma.issue.update({
                where: {
                    id: issueId
                },
                data: updateData 
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue updated successfully",
                data: issue
            };
        } catch (error) {
            console.error('Error in IssueRepository.updateIssue:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to update issue",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Delete an issue
     * @param issueId Issue ID to delete
     * @returns Promise with ApiResponse containing the deleted issue
     */
    async deleteIssue(issueId: number): Promise<ApiResponse<issue>> {
        try {
            const issue = await this.prisma.issue.delete({
                where: {
                    id: issueId
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue deleted successfully",
                data: issue
            };
        } catch (error) {
            console.error('Error in IssueRepository.deleteIssue:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to delete issue",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Add a comment to an issue
     * @param commentData Object containing issue ID, author ID, and content
     * @returns Promise with ApiResponse containing the created comment
     */
    async addIssueComment(
        commentData: {
            issueId: number;
            authorId: number;
            content: string;
        }
    ): Promise<ApiResponse<any>> {
        try {
            const comment = await this.prisma.issue_comment.create({
                data: {
                    issue_id: commentData.issueId,
                    author_id: commentData.authorId,
                    content: commentData.content
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue comment added successfully",
                data: comment
            };
        } catch (error) {
            console.error('Error in IssueRepository.addIssueComment:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to add issue comment",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get all issues created by a specific user
     * @param userId User ID to get issues for
     * @returns Promise with ApiResponse containing array of issues
     */
    async getUserIssues(userId: number): Promise<ApiResponse<issue[]>> {
        try {
            const issues = await this.prisma.issue.findMany({
                where: {
                    author_id: userId
                },
                include: {
                    repository: true
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "User issues retrieved successfully",
                data: issues
            };
        } catch (error) {
            console.error('Error in IssueRepository.getUserIssues:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve user issues",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Search for issues by title or description
     * @param searchData Object containing repository ID and search query
     * @returns Promise with ApiResponse containing array of matching issues
     */
    async searchIssues(
        searchData: {
            repositoryId: number;
            searchQuery: string;
        }
    ): Promise<ApiResponse<issue[]>> {
        try {
            const issues = await this.prisma.issue.findMany({
                where: {
                    repository_id: searchData.repositoryId,
                    OR: [
                        {
                            title: {
                                contains: searchData.searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            description: {
                                contains: searchData.searchQuery,
                                mode: 'insensitive'
                            }
                        }
                    ]
                },
                include: {
                    author: true
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issues search completed successfully",
                data: issues
            };
        } catch (error) {
            console.error('Error in IssueRepository.searchIssues:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to search issues",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}