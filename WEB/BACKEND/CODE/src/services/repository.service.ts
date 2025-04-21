import { Prisma, repository } from '@prisma/client';
import { RepositoryRepository } from '../repositories/repository.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { TYPES } from '../di/types';
import { z } from 'zod';

/**
 * ## UpdateRepositoryDto Schema
 *
 * Validates the incoming data for updating a repository.
 *
 * | Field        | Type    | Validation Rules              |
 * |-------------|---------|-------------------------------|
 * | name        | string  | Optional, 1-255 chars         |
 * | description | string  | Optional                      |
 * | is_private  | boolean | Optional                      |
 *
 * ### Example:
 * ```json
 * {
 *   "name": "updated-repo-name",
 *   "description": "Updated description for the repository",
 *   "is_private": true
 * }
 * ```
 */
export const UpdateRepositoryDto = z.object({
    name: z
        .string()
        .min(1, 'Repository name cannot be empty.')
        .max(255, 'Repository name cannot exceed 255 characters.')
        .optional(),
    
    description: z
        .string()
        .optional(),
    
    is_private: z
        .boolean()
        .optional(),
});

export type UpdateRepositoryDto = z.infer<typeof UpdateRepositoryDto>;

@injectable()
export class RepositoryService {
    constructor(
        @inject(TYPES.RepositoryRepository) private repositoryRepository: RepositoryRepository
    ) {
        console.log("RepositoryService constructor called");
    }

    /**
     * Update an existing repository
     * @param id Repository ID
     * @param updateData Repository data to update
     * @returns ApiResponse with updated repository or error
     */
    async updateRepository(id: number, updateData: UpdateRepositoryDto): Promise<ApiResponse<repository>> {
        try {
            console.log("=== REPOSITORY SERVICE: updateRepository START ===");
            console.log("Repository ID:", id);
            console.log("Update data:", JSON.stringify(updateData));

            // Validate data using Zod schema
            const validatedData = UpdateRepositoryDto.parse(updateData);
            console.log("Data validation successful");

            // Check if repository exists
            const existingRepo = await this.repositoryRepository.findById(id);
            if (!existingRepo) {
                console.log("Repository not found with ID:", id);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Repository not found',
                    error: 'Repository not found',
                };
            }

            // Update repository
            const updatedRepository = await this.repositoryRepository.updateRepository(id, validatedData);
            console.log("Repository updated successfully:", JSON.stringify(updatedRepository));
            console.log("=== REPOSITORY SERVICE: updateRepository END - Success ===");

            return {
                status: ResponseStatus.SUCCESS,
                message: 'Repository updated successfully',
                data: updatedRepository,
            };
        } catch (error) {
            console.error("=== REPOSITORY SERVICE: updateRepository ERROR ===");
            console.error("Error updating repository:", error);
            
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
                message: 'Failed to update repository',
                error: `${error}`,
            };
        }
    }
}