import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IssueCommentService, CreateIssueCommentDto, UpdateIssueCommentDto } from '../services/issue_comment.service';
import { ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';

@injectable()
export class IssueCommentController {
    constructor(
        @inject(TYPES.IssueCommentService) private issueCommentService: IssueCommentService
    ) {}

    /**
     * Get a specific comment by its ID
     * @param req Request with commentId parameter
     * @param res Response
     */
    getCommentById = async (req: Request, res: Response): Promise<void> => {
        try {
            const commentId = parseInt(req.params.commentId, 10);

            if (isNaN(commentId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID format',
                    error: 'Comment ID must be a number'
                });
                return;
            }

            const response = await this.issueCommentService.getCommentById(commentId);
            
            if (response.status === ResponseStatus.FAILED) {
                res.status(response.message === 'Comment not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueCommentController.getCommentById:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all comments for a specific issue
     * @param req Request with issueId parameter
     * @param res Response
     */
    getCommentsByIssueId = async (req: Request, res: Response): Promise<void> => {
        try {
            // Assuming issueId is passed as a route parameter, e.g., /issues/:issueId/comments
            const issueId = parseInt(req.params.issueId, 10); 

            if (isNaN(issueId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID format',
                    error: 'Issue ID must be a number'
                });
                return;
            }

            const response = await this.issueCommentService.getCommentsByIssueId(issueId);
            
            if (response.status === ResponseStatus.FAILED) {
                 // Handle 'Issue not found' from service
                res.status(response.message === 'Issue not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueCommentController.getCommentsByIssueId:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get issue comments',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Create a new issue comment
     * @param req Request with comment data in the body (issueId, authorId, content)
     * @param res Response
     */
    createComment = async (req: Request, res: Response): Promise<void> => {
        try {
            // Basic check for body existence
            if (!req.body || Object.keys(req.body).length === 0) {
                 res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing request body',
                    error: 'Request body with comment data is required'
                });
                return;
            }

            // Service layer handles detailed validation with CreateIssueCommentDto
            const response = await this.issueCommentService.createComment(req.body as CreateIssueCommentDto);

            if (response.status === ResponseStatus.FAILED) {
                // Service layer provides validation or 'Issue not found' errors
                res.status(response.message === 'Issue not found' ? 404 : 400).json(response); 
                return;
            }
            
            res.status(201).json(response); // 201 Created
        } catch (error) {
            console.error('Error in IssueCommentController.createComment:', error);
             // Check if it's a Zod validation error passed up (though service handles it)
            if (error instanceof z.ZodError) {
                 res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                });
                return;
            }
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to create comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Update an existing issue comment
     * @param req Request with commentId parameter and update data (content) in the body
     * @param res Response
     */
    updateComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const commentId = parseInt(req.params.commentId, 10);

            if (isNaN(commentId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID format',
                    error: 'Comment ID must be a number'
                });
                return;
            }

            // Basic check for body existence
             if (!req.body || Object.keys(req.body).length === 0) {
                 res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing request body',
                    error: 'Request body with update data is required'
                });
                return;
            }

            // Service layer handles detailed validation with UpdateIssueCommentDto
            const response = await this.issueCommentService.updateComment(commentId, req.body as UpdateIssueCommentDto);

            if (response.status === ResponseStatus.FAILED) {
                 // Handle not found or validation errors from service
                res.status(response.message === 'Comment not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueCommentController.updateComment:', error);
             // Check if it's a Zod validation error passed up (though service handles it)
            if (error instanceof z.ZodError) {
                 res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Validation failed',
                    error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                });
                return;
            }
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to update comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete an issue comment
     * @param req Request with commentId parameter
     * @param res Response
     */
    deleteComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const commentId = parseInt(req.params.commentId, 10);

            if (isNaN(commentId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid comment ID format',
                    error: 'Comment ID must be a number'
                });
                return;
            }

            const response = await this.issueCommentService.deleteComment(commentId);

            if (response.status === ResponseStatus.FAILED) {
                // Handle not found from service
                res.status(response.message === 'Comment not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(204).send(); // 204 No Content for successful DELETE
        } catch (error) {
            console.error('Error in IssueCommentController.deleteComment:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to delete comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
