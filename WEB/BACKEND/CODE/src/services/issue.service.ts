import { Prisma, issue } from '@prisma/client';
import { IssueRepository } from '../repositories/issue.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';

/**
 * ## CreateIssueDto Schema
 *
 * Validates the incoming data for creating an issue.
 *
 * | Field         | Type    | Validation Rules              |
 * |--------------|---------|-------------------------------|
 * | repositoryId | number  | Required, positive integer    |
 * | authorId     | number  | Required, positive integer    |
 * | title        | string  | Required, 1-255 chars         |
 * | description  | string  | Optional                      |
 *
 * ### Example:
 * ```json
 * {
 *   "repositoryId": 1,
 *   "authorId": 42,
 *   "title": "Bug in authentication flow",
 *   "description": "Users are unable to log in when using special characters in passwords"
 * }
 * ```
 */
export const CreateIssueDto = z.object({
    repositoryId: z
        .number({ required_error: 'Repository ID is required.' })
        .int('Repository ID must be an integer.')
        .positive('Repository ID must be positive.'),
    
    authorId: z
        .number({ required_error: 'Author ID is required.' })
        .int('Author ID must be an integer.')
        .positive('Author ID must be positive.'),
    
    title: z
        .string({ required_error: 'Issue title is required.' })
        .min(1, 'Issue title cannot be empty.')
        .max(255, 'Issue title cannot exceed 255 characters.'),
    
    description: z
        .string()
        .nullable()
        .optional(),
});

export type CreateIssueDto = z.infer<typeof CreateIssueDto>;

/**
 * ## UpdateIssueDto Schema
 *
 * Validates the incoming data for updating an issue.
 *
 * | Field        | Type    | Validation Rules              |
 * |-------------|---------|-------------------------------|
 * | title       | string  | Optional, 1-255 chars         |
 * | description | string  | Optional                      |
 * | status      | string  | Optional, valid status        |
 *
 * ### Example:
 * ```json
 * {
 *   "title": "Updated issue title",
 *   "description": "Updated issue description",
 *   "status": "closed"
 * }
 * ```
 */
export const UpdateIssueDto = z.object({
    title: z
        .string()
        .min(1, 'Issue title cannot be empty.')
        .max(255, 'Issue title cannot exceed 255 characters.')
        .optional(),
    
    description: z
        .string()
        .nullable()
        .optional(),
    
    status: z
        .enum(['open', 'closed'], { 
            invalid_type_error: 'Status must be either "open" or "closed".'
        })
        .optional(),
});

export type UpdateIssueDto = z.infer<typeof UpdateIssueDto>;

/**
 * ## AddCommentDto Schema
 *
 * Validates the incoming data for adding a comment to an issue.
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
 *   "content": "This issue is now fixed in PR #123"
 * }
 * ```
 */
export const AddCommentDto = z.object({
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

export type AddCommentDto = z.infer<typeof AddCommentDto>;

/**
 * ## SearchIssuesDto Schema
 *
 * Validates the incoming data for searching issues.
 *
 * | Field         | Type    | Validation Rules              |
 * |--------------|---------|-------------------------------|
 * | repositoryId | number  | Required, positive integer    |
 * | searchQuery  | string  | Required, not empty           |
 *
 * ### Example:
 * ```json
 * {
 *   "repositoryId": 1,
 *   "searchQuery": "authentication"
 * }
 * ```
 */
export const SearchIssuesDto = z.object({
    repositoryId: z
        .number({ required_error: 'Repository ID is required.' })
        .int('Repository ID must be an integer.')
        .positive('Repository ID must be positive.'),
    
    searchQuery: z
        .string({ required_error: 'Search query is required.' })
        .min(1, 'Search query cannot be empty.'),
});

export type SearchIssuesDto = z.infer<typeof SearchIssuesDto>;

@injectable()
export class IssueService {
    constructor(
        @inject(TYPES.IssueRepository) private issueRepository: IssueRepository
    ) {
        console.log("IssueService constructor called");
    }

    /**
     * Get all issues for a repository
     * @param repositoryId Repository ID to get issues for
     * @returns ApiResponse with array of issues or error
     */
    async getRepositoryIssues(repositoryId: number): Promise<ApiResponse<issue[]>> {
        try {
            console.log("=== ISSUE SERVICE: getRepositoryIssues START ===");
            console.log("Repository ID:", repositoryId);

            if (!repositoryId || repositoryId <= 0) {
                console.log("Invalid repository ID:", repositoryId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a positive integer',
                };
            }

            const response = await this.issueRepository.getRepositoryIssues(repositoryId);
            console.log("=== ISSUE SERVICE: getRepositoryIssues END ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: getRepositoryIssues ERROR ===");
            console.error("Error getting repository issues:", error);
            
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get repository issues',
                error: `${error}`,
            };
        }
    }

    /**
     * Get a specific issue by ID
     * @param issueId Issue ID to retrieve
     * @returns ApiResponse with issue or error
     */
    async getIssueById(issueId: number): Promise<ApiResponse<issue | null>> {
        try {
            console.log("=== ISSUE SERVICE: getIssueById START ===");
            console.log("Issue ID:", issueId);

            if (!issueId || issueId <= 0) {
                console.log("Invalid issue ID:", issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID',
                    error: 'Issue ID must be a positive integer',
                };
            }

            const response = await this.issueRepository.getIssueById(issueId);
            console.log("=== ISSUE SERVICE: getIssueById END ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: getIssueById ERROR ===");
            console.error("Error getting issue:", error);
            
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get issue',
                error: `${error}`,
            };
        }
    }

    /**
     * Create a new issue
     * @param createData Object containing repositoryId, authorId, title, and optional description
     * @returns ApiResponse with created issue or error
     */
    async createIssue(createData: CreateIssueDto): Promise<ApiResponse<issue>> {
        try {
            console.log("=== ISSUE SERVICE: createIssue START ===");
            console.log("Create data:", JSON.stringify(createData));

            // Validate data using Zod schema
            const validatedData = CreateIssueDto.parse(createData);
            console.log("Data validation successful");

            // Pass the validated data object
            const response = await this.issueRepository.createIssue(validatedData);
            
            console.log("Issue created successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE SERVICE: createIssue END - Success ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: createIssue ERROR ===");
            console.error("Error creating issue:", error);
            
            // Handle Zod validation errors separately for clearer error messages
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create issue',
                error: `${error}`,
            };
        }
    }

    /**
     * Update an existing issue
     * @param id Issue ID
     * @param updateData Issue data to update
     * @returns ApiResponse with updated issue or error
     */
    async updateIssue(id: number, updateData: UpdateIssueDto): Promise<ApiResponse<issue>> {
        try {
            console.log("=== ISSUE SERVICE: updateIssue START ===");
            console.log("Issue ID:", id);
            console.log("Update data:", JSON.stringify(updateData));

            if (!id || id <= 0) {
                console.log("Invalid issue ID:", id);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID',
                    error: 'Issue ID must be a positive integer',
                };
            }

            // Validate data using Zod schema
            const validatedData = UpdateIssueDto.parse(updateData);
            console.log("Data validation successful");

            // Check if issue exists
            const issueResponse = await this.issueRepository.getIssueById(id);
            if (issueResponse.status === ResponseStatus.FAILED || !issueResponse.data) {
                console.log("Issue not found with ID:", id);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Issue not found',
                    error: 'Issue not found',
                };
            }

            // Update issue using validatedData
            const response = await this.issueRepository.updateIssue(id, validatedData);
            console.log("Issue updated successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE SERVICE: updateIssue END - Success ===");

            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: updateIssue ERROR ===");
            console.error("Error updating issue:", error);
            
            // Handle Zod validation errors separately for clearer error messages
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update issue',
                error: `${error}`,
            };
        }
    }

    /**
     * Delete an issue
     * @param issueId Issue ID to delete
     * @returns ApiResponse with deleted issue or error
     */
    async deleteIssue(issueId: number): Promise<ApiResponse<issue>> {
        try {
            console.log("=== ISSUE SERVICE: deleteIssue START ===");
            console.log("Issue ID:", issueId);

            if (!issueId || issueId <= 0) {
                console.log("Invalid issue ID:", issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID',
                    error: 'Issue ID must be a positive integer',
                };
            }

            // Check if issue exists
            const issueResponse = await this.issueRepository.getIssueById(issueId);
            if (issueResponse.status === ResponseStatus.FAILED || !issueResponse.data) {
                console.log("Issue not found with ID:", issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Issue not found',
                    error: 'Issue not found',
                };
            }

            const response = await this.issueRepository.deleteIssue(issueId);
            console.log("Issue deleted successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE SERVICE: deleteIssue END - Success ===");
            
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: deleteIssue ERROR ===");
            console.error("Error deleting issue:", error);
            
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to delete issue',
                error: `${error}`,
            };
        }
    }

    /**
     * Add a comment to an issue
     * @param commentData Object containing issueId, authorId, and content
     * @returns ApiResponse with created comment or error
     */
    async addIssueComment(commentData: AddCommentDto): Promise<ApiResponse<any>> {
        try {
            console.log("=== ISSUE SERVICE: addIssueComment START ===");
            console.log("Comment data:", JSON.stringify(commentData));

            // Validate data using Zod schema
            const validatedData = AddCommentDto.parse(commentData);
            console.log("Data validation successful");

            // Check if issue exists
            const issueResponse = await this.issueRepository.getIssueById(validatedData.issueId);
            if (issueResponse.status === ResponseStatus.FAILED || !issueResponse.data) {
                console.log("Issue not found with ID:", validatedData.issueId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Issue not found',
                    error: 'Issue not found',
                };
            }

            // Pass the validated data object
            const response = await this.issueRepository.addIssueComment(validatedData);
            
            console.log("Comment added successfully:", JSON.stringify(response.data));
            console.log("=== ISSUE SERVICE: addIssueComment END - Success ===");
            
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: addIssueComment ERROR ===");
            console.error("Error adding comment:", error);
            
            // Handle Zod validation errors separately for clearer error messages
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to add comment',
                error: `${error}`,
            };
        }
    }

    /**
     * Get all issues created by a specific user
     * @param userId User ID to get issues for
     * @returns ApiResponse with array of issues or error
     */
    async getUserIssues(userId: number): Promise<ApiResponse<issue[]>> {
        try {
            console.log("=== ISSUE SERVICE: getUserIssues START ===");
            console.log("User ID:", userId);

            if (!userId || userId <= 0) {
                console.log("Invalid user ID:", userId);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid user ID',
                    error: 'User ID must be a positive integer',
                };
            }

            const response = await this.issueRepository.getUserIssues(userId);
            console.log("=== ISSUE SERVICE: getUserIssues END ===");
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: getUserIssues ERROR ===");
            console.error("Error getting user issues:", error);
            
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get user issues',
                error: `${error}`,
            };
        }
    }

    /**
     * Search for issues by title or description
     * @param searchData Object containing repositoryId and searchQuery
     * @returns ApiResponse with array of matching issues or error
     */
    async searchIssues(searchData: SearchIssuesDto): Promise<ApiResponse<issue[]>> {
        try {
            console.log("=== ISSUE SERVICE: searchIssues START ===");
            console.log("Search data:", JSON.stringify(searchData));

            // Validate data using Zod schema
            const validatedData = SearchIssuesDto.parse(searchData);
            console.log("Data validation successful");

            // Pass the validated data object
            const response = await this.issueRepository.searchIssues(validatedData);
            
            console.log("Issues search completed with", response.data?.length || 0, "results");
            console.log("=== ISSUE SERVICE: searchIssues END - Success ===");
            
            return response;
        } catch (error) {
            console.error("=== ISSUE SERVICE: searchIssues ERROR ===");
            console.error("Error searching issues:", error);
            
            // Handle Zod validation errors separately for clearer error messages
            if (error instanceof z.ZodError) {
                const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: formattedErrors,
                };
            }

            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to search issues',
                error: `${error}`,
            };
        }
    }
}