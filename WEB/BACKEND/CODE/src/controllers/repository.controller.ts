import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { RepositoryService, UpdateRepositoryDto } from '../services/repository.service';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class RepositoryController {
    constructor(
        @inject(RepositoryService) private repositoryService: RepositoryService
    ) {
        console.log("RepositoryController constructor called");
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
            
            // Call service to update the repository
            const updateData: UpdateRepositoryDto = req.body;
            const result = await this.repositoryService.updateRepository(repositoryId, updateData);
            
            // Set appropriate HTTP status based on the result
            if (result.status === ResponseStatus.SUCCESS) {
                console.log("Repository update successful for ID:", repositoryId);
                res.status(200).json(result);
            } else {
                console.log("Repository update failed with error:", result.error);
                res.status(result.error === 'Repository not found' ? 404 : 400).json(result);
            }
            
            console.log("=== REPOSITORY CONTROLLER: updateRepository END ===");
        } catch (error) {
            console.error("=== REPOSITORY CONTROLLER: updateRepository ERROR ===");
            console.error("Error in updateRepository controller:", error);
            
            const errorResponse: ApiResponse<null> = {
                status: ResponseStatus.FAILED,
                message: 'Failed to update repository',
                error: error instanceof Error ? error.message : String(error),
            };
            
            res.status(500).json(errorResponse);
        }
    }
}