import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IssueService, CreateIssueDto, UpdateIssueDto, AddCommentDto, SearchIssuesDto, SearchAllIssuesDto } from '../services/issue.service'; // Added SearchAllIssuesDto
import { ResponseStatus } from '../DTO/apiResponse.DTO';
import { z } from 'zod'; // Import Zod for potential controller-level validation if needed

@injectable()
export class IssueController {
    constructor(
        @inject(IssueService) private issueService: IssueService
    ) {}

    /**
     * Get all issues for a specific repository
     * @param req Request with repositoryId parameter
     * @param res Response
     */
    getRepositoryIssues = async (req: Request, res: Response): Promise<void> => {
        try {
            const repositoryId = parseInt(req.params.repositoryId, 10);

            if (isNaN(repositoryId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID format',
                    error: 'Repository ID must be a number'
                });
                return;
            }

            const response = await this.issueService.getRepositoryIssues(repositoryId);
            
            if (response.status === ResponseStatus.FAILED) {
                // Service layer likely handles not found, but keep 400 for potential bad requests
                res.status(400).json(response); 
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.getRepositoryIssues:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get repository issues',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get a specific issue by its ID
     * @param req Request with issueId parameter
     * @param res Response
     */
    getIssueById = async (req: Request, res: Response): Promise<void> => {
        try {
            const issueId = parseInt(req.params.issueId, 10);

            if (isNaN(issueId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID format',
                    error: 'Issue ID must be a number'
                });
                return;
            }

            const response = await this.issueService.getIssueById(issueId);
            
            if (response.status === ResponseStatus.FAILED) {
                 // Handle not found specifically if needed, otherwise 400/404 based on service response
                res.status(response.message === 'Issue not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.getIssueById:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get issue',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Create a new issue
     * @param req Request with issue data in the body
     * @param res Response
     */
    createIssue = async (req: Request, res: Response): Promise<void> => {
        try {
            // Basic check for body existence
            if (!req.body || Object.keys(req.body).length === 0) {
                 res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing request body',
                    error: 'Request body with issue data is required'
                });
                return;
            }

            // Service layer handles detailed validation with CreateIssueDto
            const response = await this.issueService.createIssue(req.body as CreateIssueDto);

            if (response.status === ResponseStatus.FAILED) {
                // Service layer provides validation errors
                res.status(400).json(response); 
                return;
            }
            
            res.status(201).json(response); // 201 Created
        } catch (error) {
            console.error('Error in IssueController.createIssue:', error);
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
                message: 'Failed to create issue',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Update an existing issue
     * @param req Request with issueId parameter and update data in the body
     * @param res Response
     */
    updateIssue = async (req: Request, res: Response): Promise<void> => {
        try {
            const issueId = parseInt(req.params.issueId, 10);

            if (isNaN(issueId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID format',
                    error: 'Issue ID must be a number'
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

            // Service layer handles detailed validation with UpdateIssueDto
            const response = await this.issueService.updateIssue(issueId, req.body as UpdateIssueDto);

            if (response.status === ResponseStatus.FAILED) {
                 // Handle not found or validation errors from service
                res.status(response.message === 'Issue not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.updateIssue:', error);
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
                message: 'Failed to update issue',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Delete an issue
     * @param req Request with issueId parameter
     * @param res Response
     */
    deleteIssue = async (req: Request, res: Response): Promise<void> => {
        try {
            const issueId = parseInt(req.params.issueId, 10);

            if (isNaN(issueId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid issue ID format',
                    error: 'Issue ID must be a number'
                });
                return;
            }

            const response = await this.issueService.deleteIssue(issueId);

            if (response.status === ResponseStatus.FAILED) {
                // Handle not found from service
                res.status(response.message === 'Issue not found' ? 404 : 400).json(response);
                return;
            }
            
            // Send back the deleted issue data or just a success message
            // res.status(200).json(response); 
            res.status(204).send(); // 204 No Content is often preferred for DELETE success
        } catch (error) {
            console.error('Error in IssueController.deleteIssue:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to delete issue',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Add a comment to an issue
     * @param req Request with comment data in the body
     * @param res Response
     */
    addIssueComment = async (req: Request, res: Response): Promise<void> => {
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
            
            // We expect issueId to be part of the body DTO
            // Service layer handles detailed validation with AddCommentDto
            const response = await this.issueService.addIssueComment(req.body as AddCommentDto);

            if (response.status === ResponseStatus.FAILED) {
                // Handle validation errors or 'Issue not found' from service
                 res.status(response.message === 'Issue not found' ? 404 : 400).json(response);
                return;
            }
            
            res.status(201).json(response); // 201 Created
        } catch (error) {
            console.error('Error in IssueController.addIssueComment:', error);
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
                message: 'Failed to add issue comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

     /**
     * Get all issues created by a specific user
     * @param req Request with userId parameter
     * @param res Response
     */
    getUserIssues = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId, 10);

            if (isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid user ID format',
                    error: 'User ID must be a number'
                });
                return;
            }

            const response = await this.issueService.getUserIssues(userId);
            
            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response); 
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.getUserIssues:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get user issues',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Search for issues within a repository by title or description
     * @param req Request with repositoryId parameter and searchQuery query parameter
     * @param res Response
     */
    searchIssues = async (req: Request, res: Response): Promise<void> => {
        try {
            const repositoryId = parseInt(req.params.repositoryId, 10);
            const { searchQuery } = req.query;

            if (isNaN(repositoryId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID format',
                    error: 'Repository ID must be a number'
                });
                return;
            }

            if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
                 res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing or invalid search query',
                    error: 'A non-empty searchQuery query parameter is required'
                });
                return;
            }

            // Construct the DTO for the service layer
            const searchData: SearchIssuesDto = {
                repositoryId,
                searchQuery
            };

            // Service layer handles detailed validation with SearchIssuesDto
            const response = await this.issueService.searchIssues(searchData);
            
            if (response.status === ResponseStatus.FAILED) {
                // Service layer provides validation errors
                res.status(400).json(response); 
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.searchIssues:', error);
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
                message: 'Failed to search issues',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Search for issues across all repositories by title or description
     * @param req Request with searchQuery query parameter
     * @param res Response
     */
    findAllIssues = async (req: Request, res: Response): Promise<void> => {
        try {
            const { searchQuery } = req.query;

            if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
                 res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing or invalid search query',
                    error: 'A non-empty searchQuery query parameter is required'
                });
                return;
            }

            // Construct the DTO for the service layer
            const searchData: SearchAllIssuesDto = {
                searchQuery
            };

            // Service layer handles detailed validation with SearchAllIssuesDto
            const response = await this.issueService.findAllIssues(searchData);
            
            if (response.status === ResponseStatus.FAILED) {
                // Service layer provides validation errors
                res.status(400).json(response); 
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in IssueController.findAllIssues:', error);
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
                message: 'Failed to search all issues',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

