import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { RepositoryService, UpdateRepositoryDto, CreateRepositoryDto } from '../services/repository.service';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class RepositoryController {
    constructor(
        @inject(RepositoryService) private repositoryService: RepositoryService
    ) {
        console.log("RepositoryContjroller constructor called");
    }

    /**
     * Create a new repository
     * POST /api/repositories
     */
    async createRepository(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: createRepository START ===");
            console.log("Request body:", req.body);

            // Get user info from req.user instead of req.body
            if (!req.user) {
                res.status(401).json({ 
                    status: ResponseStatus.FAILED, 
                    message: 'Unauthorized', 
                    error: 'Authentication required' 
                });
                return;
            }

            const userId = parseInt(req.user.userId);
            const username = req.user.username;
            
            if (isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED, 
                    message: 'Bad Request', 
                    error: 'Invalid userId format' 
                });
                return;
            }

            const createData: CreateRepositoryDto = req.body;

            const result = await this.repositoryService.createBareRepo(userId, username, createData);

            if (result.status === ResponseStatus.SUCCESS) {
                console.log("Repository creation successful");
                res.status(201).json(result);
            } else {
                console.log("Repository creation failed with error:", result.error);
                res.status(400).json(result);
            }

            console.log("=== REPOSITORY CONTROLLER: createRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: createRepository ERROR ===");
            console.error("Error in createRepository controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to create repository due to a server error',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Update an existing repository
     * PUT /api/repositories/:id
     */
    async updateRepository(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: updateRepository START ===");
            console.log("Request params:", req.params);
            console.log("Request body:", req.body);
            
            const repositoryId = parseInt(req.params.id);
            
            if (isNaN(repositoryId)) {
                console.log("Invalid repository ID provided:", req.params.id);
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }
            
            const updateData: UpdateRepositoryDto = req.body;
            const result = await this.repositoryService.updateRepository(repositoryId, updateData);
            
            if (result.status === ResponseStatus.SUCCESS) {
                console.log("Repository update successful for ID:", repositoryId);
                res.status(200).json(result);
            } else {
                console.log("Repository update failed with error:", result.error);
                res.status(result.message === 'Repository not found' ? 404 : 400).json(result);
            }
            
            console.log("=== REPOSITORY CONTROLLER: updateRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: updateRepository ERROR ===");
            console.error("Error in updateRepository controller:", error);
            
            const errorResponse: ApiResponse<null> = {
                status: ResponseStatus.FAILED,
                message: 'Failed to update repository due to a server error',
                error: error instanceof Error ? error.message : String(error),
            };
            
            res.status(500).json(errorResponse);
        }
    }

    /**
     * Delete an existing repository
     * DELETE /api/repositories/:id
     */
    async deleteRepository(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: deleteRepository START ===");
            console.log("Request params:", req.params);

            const repositoryId = parseInt(req.params.id);

            if (isNaN(repositoryId)) {
                console.log("Invalid repository ID provided:", req.params.id);
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }

            const result = await this.repositoryService.deleteBareRepo(repositoryId);

            if (result.status === ResponseStatus.SUCCESS) {
                console.log("Repository deletion successful for ID:", repositoryId);
                res.status(200).json(result);
            } else {
                console.log("Repository deletion failed with error:", result.error);
                res.status(result.message === 'Repository not found' ? 404 : 400).json(result);
            }

            console.log("=== REPOSITORY CONTROLLER: deleteRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: deleteRepository ERROR ===");
            console.error("Error in deleteRepository controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to delete repository',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Fork an existing repository
     * POST /api/repositories/:id/fork
     */
    async forkRepository(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: forkRepository START ===");
            console.log("Request params:", req.params);

            const repositoryId = parseInt(req.params.id);

            if (isNaN(repositoryId)) {
                console.log("Invalid repository ID provided:", req.params.id);
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }

            // Get user info from req.user instead of req.body
            if (!req.user) {
                res.status(401).json({ 
                    status: ResponseStatus.FAILED, 
                    message: 'Unauthorized', 
                    error: 'Authentication required' 
                });
                return;
            }

            const userId = parseInt(req.user.userId);
            const username = req.user.username;
            
            if (isNaN(userId)) {
                res.status(400).json({ 
                    status: ResponseStatus.FAILED, 
                    message: 'Bad Request', 
                    error: 'Invalid userId format' 
                });
                return;
            }

            const result = await this.repositoryService.forkRepository(repositoryId, userId, username);

            if (result.status === ResponseStatus.SUCCESS) {
                console.log("Repository fork successful for ID:", repositoryId);
                res.status(201).json(result);
            } else {
                console.log("Repository fork failed with error:", result.error);
                let statusCode = 400;
                if (result.message.includes('Source repository not found')) {
                    statusCode = 404;
                } else if (result.error === 'Name conflict.') {
                    statusCode = 409;
                }
                res.status(statusCode).json(result);
            }

            console.log("=== REPOSITORY CONTROLLER: forkRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: forkRepository ERROR ===");
            console.error("Error in forkRepository controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to fork repository',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}