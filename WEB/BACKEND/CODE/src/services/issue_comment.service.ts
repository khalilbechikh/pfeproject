import { Prisma, issue_comment } from '@prisma/client';
import { IssueCommentRepository } from '../repositories/issue_comment.repository';
import { IssueRepository } from '../repositories/issue.repository'; // To check if issue exists
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';

/**
 * ## CreateIssueCommentDto Schema
 *
 * Validates the incoming data for creating an issue comment.
 *
 * | Field      | Type    | Validation Rules              |
 * |-----------|---------|-------------------------------|
 * | issueId   | number  | Required, positive integer    |
 * | authorId  | number  | Required, positive integer    |
 * | content   | string  | Required, not empty           |
 *
 * ### Example:
 * ```json
 * {
 *   "issueId": 1,
 *   "authorId": 42,
 *   "content": "This looks like a duplicate of issue #5."
 * }
 * ```
 */
export const CreateIssueCommentDto = z.object({
    issueId: z
        .number({ required_error: 'Issue ID is required.' })
        .int('Issue ID must be an integer.')
        .positive('Issue ID must be positive.'),

    authorId: z
        .number({ required_error: 'Author ID is required.' })
        .int('Author ID must be an integer.')
        .positive('Author ID must be positive.'),

    content: z
        .string({ required_error: 'Comment content is required.' })
        .min(1, 'Comment content cannot be empty.'),
});

export type CreateIssueCommentDto = z.infer<typeof CreateIssueCommentDto>;

/**
 * ## UpdateIssueCommentDto Schema
 *
 * Validates the incoming data for updating an issue comment.
 *
 * | Field      | Type    | Validation Rules              |
 * |-----------|---------|-------------------------------|
 * | content   | string  | Required, not empty           |
 *
 * ### Example:
 * ```json
 * {
 *   "content": "Updated comment content."
 * }
 * ```
 */
export const UpdateIssueCommentDto = z.object({
    content: z
        .string({ required_error: 'Comment content is required.' })
        .min(1, 'Comment content cannot be empty.'),
});

export type UpdateIssueCommentDto = z.infer<typeof UpdateIssueCommentDto>;


@injectable()
export class IssueCommentService {
    constructor(
        @inject(TYPES.IssueCommentRepository) private issueCommentRepository: IssueCommentRepository,
        @inject(TYPES.IssueRepository) private issueRepository: IssueRepository // Inject IssueRepository
    ) {
        console.log("IssueCommentService constructor called");
    }

    /**
     * Get a specific comment by ID
     * @param commentId Comment ID to retrieve
     * @returns ApiResponse with comment or error
     */
    async getCommentById(commentId: number): Promise<ApiResponse<issue_comment | null>> {
        try {
            console.log("=== ISSUE COMMENT SERVICE: getCommentById START ===");
            console.log("Comment ID:", commentId);

            if (!commentId || commentId <= 0) {
                console.log("Invalid comment ID:", commentId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID',
                    error: 'Comment ID must be a positive integer',
                };
            }

            const response = await this.issueCommentRepository.getCommentById(commentId);
            console.log("=== ISSUE COMMENT SERVICE: getCommentById END ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE COMMENT SERVICE: getCommentById ERROR ===");
            console.error("Error getting comment:", error);

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get comment',
                error: `${error}`,
            };
        }
    }

     /**
     * Get all comments for a specific issue
     * @param issueId Issue ID to get comments for
     * @returns ApiResponse with array of comments or error
     */
    async getCommentsByIssueId(issueId: number): Promise<ApiResponse<issue_comment[]>> {
        try {
            console.log("=== ISSUE COMMENT SERVICE: getCommentsByIssueId START ===");
            console.log("Issue ID:", issueId);

            if (!issueId || issueId <= 0) {
                console.log("Invalid issue ID:", issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID',
                    error: 'Issue ID must be a positive integer',
                };
            }

             // Optional: Check if issue exists first
            const issueResponse = await this.issueRepository.getIssueById(issueId);
            if (issueResponse.status === ResponseStatus.FAILED || !issueResponse.data) {
                console.log("Issue not found with ID:", issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Issue not found',
                    error: 'Cannot retrieve comments for a non-existent issue.',
                };
            }

            const response = await this.issueCommentRepository.getCommentsByIssueId(issueId);
            console.log("=== ISSUE COMMENT SERVICE: getCommentsByIssueId END ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE COMMENT SERVICE: getCommentsByIssueId ERROR ===");
            console.error("Error getting issue comments:", error);

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get issue comments',
                error: `${error}`,
            };
        }
    }


    /**
     * Create a new issue comment
     * @param createData Object containing issueId, authorId, and content
     * @returns ApiResponse with created comment or error
     */
    async createComment(createData: CreateIssueCommentDto): Promise<ApiResponse<issue_comment>> {
        try {
            console.log("=== ISSUE COMMENT SERVICE: createComment START ===");
            console.log("Create data:", JSON.stringify(createData));

            // Validate data using Zod schema
            const validatedData = CreateIssueCommentDto.parse(createData);
            console.log("Data validation successful");

            // Check if issue exists before creating comment
            const issueResponse = await this.issueRepository.getIssueById(validatedData.issueId);
            if (issueResponse.status === ResponseStatus.FAILED || !issueResponse.data) {
                console.log("Issue not found with ID:", validatedData.issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Issue not found',
                    error: 'Cannot create comment for a non-existent issue.',
                };
            }

            // Pass the validated data object to the repository
            const response = await this.issueCommentRepository.createComment(validatedData);

            console.log("Comment created successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE COMMENT SERVICE: createComment END - Success ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE COMMENT SERVICE: createComment ERROR ===");
            console.error("Error creating comment:", error);

            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }
             // Handle potential repo errors (like invalid authorId if not checked elsewhere)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                 return {
                    status: ResponseStatus.FAILED,
                    message: "Failed to create comment: Invalid author ID.", // Issue ID checked above
                    error: "Author ID does not exist."
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create comment',
                error: `${error}`,
            };
        }
    }

    /**
     * Update an existing issue comment
     * @param commentId Comment ID
     * @param updateData Comment data to update (only content)
     * @returns ApiResponse with updated comment or error
     */
    async updateComment(commentId: number, updateData: UpdateIssueCommentDto): Promise<ApiResponse<issue_comment>> {
        try {
            console.log("=== ISSUE COMMENT SERVICE: updateComment START ===");
            console.log("Comment ID:", commentId);
            console.log("Update data:", JSON.stringify(updateData));

             if (!commentId || commentId <= 0) {
                console.log("Invalid comment ID:", commentId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID',
                    error: 'Comment ID must be a positive integer',
                };
            }

            // Validate data using Zod schema
            const validatedData = UpdateIssueCommentDto.parse(updateData);
            console.log("Data validation successful");

            // Check if comment exists before updating
            const commentResponse = await this.issueCommentRepository.getCommentById(commentId);
            if (commentResponse.status === ResponseStatus.FAILED || !commentResponse.data) {
                console.log("Comment not found with ID:", commentId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Comment not found',
                    error: 'Comment not found', // Match repo message
                };
            }

            // Update comment using validatedData
            const response = await this.issueCommentRepository.updateComment(commentId, validatedData);
            console.log("Comment updated successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE COMMENT SERVICE: updateComment END - Success ===");

            return response;
        } catch (error) {
            console.error("=== ISSUE COMMENT SERVICE: updateComment ERROR ===");
            console.error("Error updating comment:", error);

            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }
             // Handle repo errors (like comment disappearing between check and update)
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 return {
                    status: ResponseStatus.FAILED,
                    message: "Comment not found",
                    error: "Record to update not found."
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update comment',
                error: `${error}`,
            };
        }
    }

    /**
     * Delete an issue comment
     * @param commentId Comment ID to delete
     * @returns ApiResponse with deleted comment or error
     */
    async deleteComment(commentId: number): Promise<ApiResponse<issue_comment>> {
        try {
            console.log("=== ISSUE COMMENT SERVICE: deleteComment START ===");
            console.log("Comment ID:", commentId);

             if (!commentId || commentId <= 0) {
                console.log("Invalid comment ID:", commentId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID',
                    error: 'Comment ID must be a positive integer',
                };
            }

            // Check if comment exists before deleting (optional, repo handles 'not found')
            // const commentResponse = await this.issueCommentRepository.getCommentById(commentId);
            // if (commentResponse.status === ResponseStatus.FAILED || !commentResponse.data) {
            //     console.log("Comment not found with ID:", commentId);
            //     return {
            //         status: ResponseStatus.FAILED,
            //         message: 'Comment not found',
            //         error: 'Comment not found',
            //     };
            // }

            const response = await this.issueCommentRepository.deleteComment(commentId);
            // The repository handles the "not found" case, so we check its response
             if (response.status === ResponseStatus.FAILED && response.message === 'Comment not found') {
                 console.log("Comment not found with ID:", commentId);
                 return response; // Return the repo's "not found" response
             }

            console.log("Comment deleted successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE COMMENT SERVICE: deleteComment END - Success ===");

            return response;
        } catch (error) {
            console.error("=== ISSUE COMMENT SERVICE: deleteComment ERROR ===");
            console.error("Error deleting comment:", error);

             // Handle repo errors (like comment disappearing between check and delete)
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 return {
                    status: ResponseStatus.FAILED,
                    message: "Comment not found",
                    error: "Record to delete not found."
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to delete comment',
                error: `${error}`,
            };
        }
    }
}
