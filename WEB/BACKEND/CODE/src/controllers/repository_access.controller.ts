import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { RepositoryAccessService } from '../services/repository_access.service';
import { ResponseStatus } from '../DTO/apiResponse.DTO';
import {TYPES} from "../di/types";

@injectable()
export class RepositoryAccessController {
    constructor(
        @inject(TYPES.RepositoryAccessService) private repositoryAccessService: RepositoryAccessService
    ) {}

    /**
     * Get all repositories a user has access to
     * @param req Request with userId parameter
     * @param res Response
     */
    getUserRepositoryAccess = async (req: Request, res: Response): Promise<void> => {
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

            const response = await this.repositoryAccessService.getUserRepositoryAccess({ userId });
            
            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.getUserRepositoryAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get user repository access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get all users who have access to a repository
     * @param req Request with repositoryId parameter
     * @param res Response
     */
    getRepositoryUserAccess = async (req: Request, res: Response): Promise<void> => {
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

            const response = await this.repositoryAccessService.getRepositoryUserAccess({ repositoryId });
            
            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.getRepositoryUserAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to get repository user access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Verify if a user has the specified level of access to a repository
     * @param req Request with repositoryId, userId, and accessLevel in body
     * @param res Response
     */
    verifyRepositoryAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const repositoryId = parseInt(req.params.repositoryId, 10);
            const userId = parseInt(req.params.userId, 10);
            const { accessLevel } = req.query;

            if (isNaN(repositoryId) || isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid ID format',
                    error: 'Repository ID and User ID must be numbers'
                });
                return;
            }

            if (!accessLevel || (accessLevel !== 'view' && accessLevel !== 'edit')) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid access level',
                    error: 'Access level must be either "view" or "edit"'
                });
                return;
            }

            const response = await this.repositoryAccessService.verifyRepositoryAccess({ 
                repositoryId,
                userId,
                accessLevel: accessLevel as 'view' | 'edit'
            });
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.verifyRepositoryAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to verify repository access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Add repository access for a user
     * @param req Request with repositoryId, userId, and accessLevel in body
     * @param res Response
     */
    addRepositoryAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const { repositoryId, userId, accessLevel } = req.body;

            if (!repositoryId || !userId || !accessLevel) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing required fields',
                    error: 'Repository ID, User ID, and access level are required'
                });
                return;
            }

            const response = await this.repositoryAccessService.addRepositoryAccess({
                repositoryId: Number(repositoryId),
                userId: Number(userId),
                accessLevel
            });

            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response);
                return;
            }
            
            res.status(201).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.addRepositoryAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to add repository access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Remove repository access for a user
     * @param req Request with repositoryId and userId parameters
     * @param res Response
     */
    removeRepositoryAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const repositoryId = parseInt(req.params.repositoryId, 10);
            const userId = parseInt(req.params.userId, 10);

            if (isNaN(repositoryId) || isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid ID format',
                    error: 'Repository ID and User ID must be numbers'
                });
                return;
            }

            const response = await this.repositoryAccessService.removeRepositoryAccess({
                repositoryId,
                userId
            });

            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.removeRepositoryAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to remove repository access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Update repository access level for a user
     * @param req Request with repositoryId, userId parameters and accessLevel in body
     * @param res Response
     */
    updateRepositoryAccess = async (req: Request, res: Response): Promise<void> => {
        try {
            const repositoryId = parseInt(req.params.repositoryId, 10);
            const userId = parseInt(req.params.userId, 10);
            const { accessLevel } = req.body;

            if (isNaN(repositoryId) || isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Invalid ID format',
                    error: 'Repository ID and User ID must be numbers'
                });
                return;
            }

            if (!accessLevel) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED,
                    message: 'Missing required field',
                    error: 'Access level is required'
                });
                return;
            }

            const response = await this.repositoryAccessService.updateRepositoryAccess(
                { repositoryId, userId },
                { accessLevel }
            );

            if (response.status === ResponseStatus.FAILED) {
                res.status(400).json(response);
                return;
            }
            
            res.status(200).json(response);
        } catch (error) {
            console.error('Error in RepositoryAccessController.updateRepositoryAccess:', error);
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: 'Failed to update repository access',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}