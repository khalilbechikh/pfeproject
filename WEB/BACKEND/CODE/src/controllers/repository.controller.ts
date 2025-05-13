import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { RepositoryService, UpdateRepositoryDto } from '../services/repository.service';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class RepositoryController {
    constructor(
        @inject(RepositoryService) private repositoryService: RepositoryService
    ) {
        console.log("RepositoryContjroller constructor called");
    }

    /**
     * Get all repositories, optionally filtering by name.
     * GET /api/repositories?search=searchText
     */
    async getAllRepositories(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: getAllRepositories START ===");
            const searchText = req.query.search as string | undefined;
            console.log("Search query:", searchText);

            const result = await this.repositoryService.getAllRepositories(searchText);

            const statusCode = result.status === ResponseStatus.SUCCESS ? 200 : 500;

            if (statusCode === 200) {
                console.log(`Found ${result.data?.length} repositories.`);
            } else {
                console.log("Failed to retrieve repositories with error:", result.error);
            }

            res.status(statusCode).json(result);

            console.log("=== REPOSITORY CONTROLLER: getAllRepositories END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: getAllRepositories ERROR ===");
            console.error("Error in getAllRepositories controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve repositories due to a server error',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get all repositories including archived (admin only)
     */
    async getAllRepositoriesIncludingArchived(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.repositoryService.getAllRepositoriesIncludingArchived();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve repositories (including archived)',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get a repository by its ID, optionally including related data.
     * GET /api/repositories/:id?relations=tableName1,tableName2
     */
    async getRepositoryById(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: getRepositoryById START ===");
            console.log("Request params:", req.params);
            console.log("Request query:", req.query);

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

            let includeTables: string[] | undefined;
            if (req.query.relations && typeof req.query.relations === 'string') {
                includeTables = req.query.relations.split(',').map(table => table.trim()).filter(Boolean);
                console.log("Including related tables (relations):", includeTables);
            }

            const result = await this.repositoryService.getRepositoryById(repositoryId, includeTables);

            let statusCode: number;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = result.data ? 200 : 404;
                if (statusCode === 200) {
                    console.log("Repository found:", result.data!.id);
                } else {
                    console.log("Repository not found for ID:", repositoryId);
                }
            } else {
                console.log("Failed to retrieve repository with error:", result.error);
                statusCode = 500;
            }

            res.status(statusCode).json(result);

            console.log("=== REPOSITORY CONTROLLER: getRepositoryById END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: getRepositoryById ERROR ===");
            console.error("Error in getRepositoryById controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve repository due to a server error',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Create a new repository
     * POST /api/repositories
     */
    async createRepository(req: Request, res: Response): Promise<void> {
        try {
            console.log("=== REPOSITORY CONTROLLER: createRepository START ===");
            console.log("Request body:", req.body);

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

            const createData = req.body;
            const result = await this.repositoryService.createBareRepo(userId, username, createData);

            let statusCode: number;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 201;
                console.log("Repository creation successful");
            } else {
                console.log("Repository creation failed with error:", result.error);
                if (result.message === 'Validation failed' || result.error === 'Username is required') {
                    statusCode = 400;
                } else if (result.error === 'User not found' || result.error?.includes('Unique constraint failed')) {
                    statusCode = 400;
                } else if (result.message.includes('filesystem') || result.message.includes('script')) {
                    statusCode = 500;
                } else {
                    statusCode = 500;
                }
            }

            res.status(statusCode).json(result);

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

            let statusCode: number;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
                console.log("Repository update successful for ID:", repositoryId);
            } else {
                console.log("Repository update failed with error:", result.error);
                if (result.message === 'Repository not found') {
                    statusCode = 404;
                } else if (result.message === 'Validation failed') {
                    statusCode = 400;
                } else {
                    statusCode = 500;
                }
            }

            res.status(statusCode).json(result);

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

            let statusCode: number;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 200;
                console.log("Repository deletion successful for ID:", repositoryId);
            } else {
                console.log("Repository deletion failed with error:", result.error);
                if (result.message === 'Repository not found') {
                    statusCode = 404;
                } else if (result.message.includes('filesystem')) {
                    statusCode = 500;
                } else {
                    statusCode = 500;
                }
            }

            res.status(statusCode).json(result);

            console.log("=== REPOSITORY CONTROLLER: deleteRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: deleteRepository ERROR ===");
            console.error("Error in deleteRepository controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to delete repository due to a server error',
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
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }
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

            let statusCode: number;
            if (result.status === ResponseStatus.SUCCESS) {
                statusCode = 201;
                console.log("Repository fork successful for ID:", repositoryId);
            } else {
                console.log("Repository fork failed with error:", result.error);
                if (result.message.includes('Source repository not found')) {
                    statusCode = 404;
                } else if (result.error === 'Name conflict.') {
                    statusCode = 409;
                } else if (result.message.includes('filesystem')) {
                    statusCode = 500;
                } else {
                    statusCode = 500;
                }
            }

            res.status(statusCode).json(result);

            console.log("=== REPOSITORY CONTROLLER: forkRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: forkRepository ERROR ===");
            console.error("Error in forkRepository controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to fork repository due to a server error',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Archive a repository (admin)
     */
    async archiveRepository(req: Request, res: Response): Promise<void> {
        try {
            const repositoryId = parseInt(req.params.id);
            if (isNaN(repositoryId)) {
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }
            const result = await this.repositoryService.archiveRepository(repositoryId);
            res.status(result.status === ResponseStatus.SUCCESS ? 200 : 400).json(result);
        } catch (error) {
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to archive repository',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Restore a repository (admin)
     */
    async restoreRepository(req: Request, res: Response): Promise<void> {
        try {
            const repositoryId = parseInt(req.params.id);
            if (isNaN(repositoryId)) {
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }
            const result = await this.repositoryService.restoreRepository(repositoryId);
            res.status(result.status === ResponseStatus.SUCCESS ? 200 : 400).json(result);
        } catch (error) {
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to restore repository',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Change the owner of a repository
     * PATCH /api/repositories/:id/change-ownership
     */
    async changeOwnership(req: Request, res: Response): Promise<void> {
        try {
            const repositoryId = parseInt(req.params.id);
            if (isNaN(repositoryId)) {
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Invalid repository ID',
                    error: 'Repository ID must be a number',
                });
                return;
            }
            const { email } = req.body;
            if (!email || typeof email !== 'string') {
                res.status(400).json({
                    status: ResponseStatus.FAILED,
                    message: 'Email is required',
                    error: 'A valid email must be provided',
                });
                return;
            }
            const result = await this.repositoryService.changeOwnership(repositoryId, email);
            let statusCode = 200;
            if (result.status === ResponseStatus.FAILED) {
                if (result.message === 'Repository not found') statusCode = 404;
                else if (result.message === 'User not found' || result.message === 'Invalid email') statusCode = 400;
                else statusCode = 500;
            }
            res.status(statusCode).json(result);
        } catch (error) {
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to change repository ownership due to a server error',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}