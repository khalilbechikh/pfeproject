import { Prisma, PrismaClient, issue_comment } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class IssueCommentRepository {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Get a specific issue comment by ID
     * @param commentId Comment ID to retrieve
     * @returns Promise with ApiResponse containing the comment
     */
    async getCommentById(commentId: number): Promise<ApiResponse<issue_comment | null>> {
        try {
            const comment = await this.prisma.issue_comment.findUnique({
                where: {
                    id: commentId
                },
                include: {
                    author: true // Include author details
                }
            });

            if (!comment) {
                return {
                    status: ResponseStatus.FAILED,
                    message: "Comment not found",
                    data: null
                };
            }

            return {
                status: ResponseStatus.SUCCESS,
                message: "Comment retrieved successfully",
                data: comment
            };
        } catch (error) {
            console.error('Error in IssueCommentRepository.getCommentById:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve comment",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create a new issue comment
     * @param createData Object containing issue ID, author ID, and content
     * @returns Promise with ApiResponse containing the created comment
     */
    async createComment(
        createData: {
            issueId: number;
            authorId: number;
            content: string;
        }
    ): Promise<ApiResponse<issue_comment>> {
        try {
            // Note: The issue.repository.ts already has addIssueComment.
            // This method might be redundant or named differently depending on usage.
            // Renaming to createComment for clarity within this repository.
            const comment = await this.prisma.issue_comment.create({
                data: {
                    issue_id: createData.issueId,
                    author_id: createData.authorId,
                    content: createData.content
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue comment created successfully",
                data: comment
            };
        } catch (error) {
            console.error('Error in IssueCommentRepository.createComment:', error);
            // Handle potential foreign key constraint errors, e.g., if issueId or authorId doesn't exist
             if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') { // Foreign key constraint failed
                     return {
                        status: ResponseStatus.FAILED,
                        message: "Failed to create comment: Invalid issue ID or author ID.",
                        error: error.message
                    };
                }
            }
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to create issue comment",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update an existing issue comment
     * @param commentId Comment ID to update
     * @param updateData Data to update on the comment (only content is typically updatable)
     * @returns Promise with ApiResponse containing the updated comment
     */
    async updateComment(
        commentId: number,
        updateData: {
            content: string;
        }
    ): Promise<ApiResponse<issue_comment>> {
        try {
            const comment = await this.prisma.issue_comment.update({
                where: {
                    id: commentId
                },
                data: {
                    content: updateData.content
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Comment updated successfully",
                data: comment
            };
        } catch (error) {
            console.error('Error in IssueCommentRepository.updateComment:', error);
             if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // P2025: Record to update not found.
                if (error.code === 'P2025') {
                    return {
                        status: ResponseStatus.FAILED,
                        message: "Comment not found",
                        error: error.message
                    };
                }
            }
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to update comment",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Delete an issue comment
     * @param commentId Comment ID to delete
     * @returns Promise with ApiResponse containing the deleted comment
     */
    async deleteComment(commentId: number): Promise<ApiResponse<issue_comment>> {
        try {
            const comment = await this.prisma.issue_comment.delete({
                where: {
                    id: commentId
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Comment deleted successfully",
                data: comment
            };
        } catch (error) {
            console.error('Error in IssueCommentRepository.deleteComment:', error);
             if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // P2025: Record to delete not found.
                if (error.code === 'P2025') {
                    return {
                        status: ResponseStatus.FAILED,
                        message: "Comment not found",
                        error: error.message
                    };
                }
            }
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to delete comment",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

     /**
     * Get all comments for a specific issue
     * @param issueId Issue ID to get comments for
     * @returns Promise with ApiResponse containing array of comments
     */
    async getCommentsByIssueId(issueId: number): Promise<ApiResponse<issue_comment[]>> {
        try {
            const comments = await this.prisma.issue_comment.findMany({
                where: {
                    issue_id: issueId
                },
                include: {
                    author: true // Include author details
                },
                 orderBy: {
                    created_at: 'asc' // Order comments chronologically
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Issue comments retrieved successfully",
                data: comments
            };
        } catch (error) {
            console.error('Error in IssueCommentRepository.getCommentsByIssueId:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve issue comments",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
