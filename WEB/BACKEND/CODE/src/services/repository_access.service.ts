import { injectable, inject } from 'inversify';
import { repository_access, RepositoryAccess } from '@prisma/client';
import { z } from 'zod';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { RepositoryAccessRepository } from '../repositories/repository_access.repository';
import { TYPES } from '../di/types';

/**
 * ## RepositoryAccessDto Schema
 * 
 * Schema for validating repository access data.
 * 
 * | Field        | Type   | Validation Rules        |
 * |--------------|--------|-------------------------|
 * | repositoryId | number | Required, positive int  |
 * | userId       | number | Required, positive int  |
 * | accessLevel  | enum   | Required, valid access  |
 * 
 * ### Example:
 * ```json
 * {
 *   "repositoryId": 1,
 *   "userId": 42,
 *   "accessLevel": "edit"
 * }
 * ```
 */
export const RepositoryAccessDto = z.object({
    repositoryId: z
        .number({ required_error: 'Repository ID is required.' })
        .int('Repository ID must be an integer.')
        .positive('Repository ID must be a positive number.'),
        
    userId: z
        .number({ required_error: 'User ID is required.' })
        .int('User ID must be an integer.')
        .positive('User ID must be a positive number.'),
        
    accessLevel: z
        .enum(['view', 'edit'], { 
            required_error: 'Access level is required.',
            invalid_type_error: 'Access level must be either "view" or "edit".'
        })
});

export type RepositoryAccessDto = z.infer<typeof RepositoryAccessDto>;

/**
 * ## UpdateRepositoryAccessDto Schema
 * 
 * Schema for validating update to repository access level.
 * 
 * | Field       | Type | Validation Rules        |
 * |-------------|------|-------------------------|
 * | accessLevel | enum | Required, valid access  |
 * 
 * ### Example:
 * ```json
 * {
 *   "accessLevel": "edit"
 * }
 * ```
 */
export const UpdateRepositoryAccessDto = z.object({
    accessLevel: z
        .enum(['view', 'edit'], { 
            required_error: 'Access level is required.',
            invalid_type_error: 'Access level must be either "view" or "edit".'
        })
});

export type UpdateRepositoryAccessDto = z.infer<typeof UpdateRepositoryAccessDto>;

/**
 * ## VerifyAccessDto Schema
 * 
 * Schema for validating repository access verification.
 * 
 * | Field        | Type   | Validation Rules        |
 * |--------------|--------|-------------------------|
 * | repositoryId | number | Required, positive int  |
 * | userId       | number | Required, positive int  |
 * | accessLevel  | enum   | Required, valid access  |
 * 
 * ### Example:
 * ```json
 * {
 *   "repositoryId": 1,
 *   "userId": 42,
 *   "accessLevel": "view"
 * }
 * ```
 */
export const VerifyAccessDto = z.object({
    repositoryId: z
        .number({ required_error: 'Repository ID is required.' })
        .int('Repository ID must be an integer.')
        .positive('Repository ID must be a positive number.'),
        
    userId: z
        .number({ required_error: 'User ID is required.' })
        .int('User ID must be an integer.')
        .positive('User ID must be a positive number.'),
        
    accessLevel: z
        .enum(['view', 'edit'], { 
            required_error: 'Access level is required.',
            invalid_type_error: 'Access level must be either "view" or "edit".'
        })
});

export type VerifyAccessDto = z.infer<typeof VerifyAccessDto>;

/**
 * ## UserIdDto Schema
 * 
 * Schema for validating user ID parameter.
 * 
 * | Field  | Type   | Validation Rules       |
 * |--------|--------|------------------------|
 * | userId | number | Required, positive int |
 * 
 * ### Example:
 * ```json
 * {
 *   "userId": 42
 * }
 * ```
 */
export const UserIdDto = z.object({
    userId: z
        .number({ required_error: 'User ID is required.' })
        .int('User ID must be an integer.')
        .positive('User ID must be a positive number.')
});

export type UserIdDto = z.infer<typeof UserIdDto>;

/**
 * ## RepositoryIdDto Schema
 * 
 * Schema for validating repository ID parameter.
 * 
 * | Field        | Type   | Validation Rules       |
 * |--------------|--------|------------------------|
 * | repositoryId | number | Required, positive int |
 * 
 * ### Example:
 * ```json
 * {
 *   "repositoryId": 1
 * }
 * ```
 */
export const RepositoryIdDto = z.object({
    repositoryId: z
        .number({ required_error: 'Repository ID is required.' })
        .int('Repository ID must be an integer.')
        .positive('Repository ID must be a positive number.')
});

export type RepositoryIdDto = z.infer<typeof RepositoryIdDto>;

@injectable()
export class RepositoryAccessService {
    constructor(@inject(TYPES.RepositoryAccessRepository) private repositoryAccessRepository: RepositoryAccessRepository) {}

    /**
     * Get all repositories a user has access to
     * @param data Object containing userId
     * @returns Promise with ApiResponse containing array of repository_access
     */
    async getUserRepositoryAccess(data: UserIdDto): Promise<ApiResponse<repository_access[]>> {
        try {
            const validatedData = UserIdDto.parse(data);
            return await this.repositoryAccessRepository.getUserRepositoryAccess(validatedData.userId);
        } catch (error) {
            console.error('Error in RepositoryAccessService.getUserRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get user repository access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get all users who have access to a repository
     * @param data Object containing repositoryId
     * @returns Promise with ApiResponse containing array of repository_access
     */
    async getRepositoryUserAccess(data: RepositoryIdDto): Promise<ApiResponse<repository_access[]>> {
        try {
            const validatedData = RepositoryIdDto.parse(data);
            return await this.repositoryAccessRepository.getRepositoryUserAccess(validatedData.repositoryId);
        } catch (error) {
            console.error('Error in RepositoryAccessService.getRepositoryUserAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to get repository user access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Verify if a user has the specified level of access to a repository
     * @param data Object containing repositoryId, userId, and accessLevel
     * @returns Promise with ApiResponse containing boolean indicating access
     */
    async verifyRepositoryAccess(data: VerifyAccessDto): Promise<ApiResponse<boolean>> {
        try {
            const validatedData = VerifyAccessDto.parse(data);
            
            // Map the string enum value to the Prisma enum
            const accessLevel = validatedData.accessLevel === 'edit' 
                ? RepositoryAccess.edit 
                : RepositoryAccess.view;
            
            return await this.repositoryAccessRepository.verifyRepositoryAccess(
                validatedData.userId,
                validatedData.repositoryId,
                accessLevel
            );
        } catch (error) {
            console.error('Error in RepositoryAccessService.verifyRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to verify repository access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Add repository access for a user
     * @param data Object containing repositoryId, userId, and accessLevel
     * @returns Promise with ApiResponse containing the created repository_access
     */
    async addRepositoryAccess(data: RepositoryAccessDto): Promise<ApiResponse<repository_access>> {
        try {
            const validatedData = RepositoryAccessDto.parse(data);
            
            // Map the string enum value to the Prisma enum
            const accessLevel = validatedData.accessLevel === 'edit' 
                ? RepositoryAccess.edit 
                : RepositoryAccess.view;
            
            return await this.repositoryAccessRepository.addRepositoryAccess(
                validatedData.repositoryId,
                validatedData.userId,
                accessLevel
            );
        } catch (error) {
            console.error('Error in RepositoryAccessService.addRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to add repository access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Remove repository access for a user
     * @param data Object containing repositoryId and userId
     * @returns Promise with ApiResponse containing the removed repository_access
     */
    async removeRepositoryAccess(data: { repositoryId: number; userId: number }): Promise<ApiResponse<repository_access>> {
        try {
            const schema = z.object({
                repositoryId: z.number().int().positive(),
                userId: z.number().int().positive()
            });
            
            const validatedData = schema.parse(data);
            
            return await this.repositoryAccessRepository.removeRepositoryAccess(
                validatedData.repositoryId,
                validatedData.userId
            );
        } catch (error) {
            console.error('Error in RepositoryAccessService.removeRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to remove repository access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Update repository access level for a user
     * @param data Object containing repositoryId, userId, and accessLevel
     * @returns Promise with ApiResponse containing the updated repository_access
     */
    async updateRepositoryAccess(
        repoUserId: { repositoryId: number; userId: number },
        data: UpdateRepositoryAccessDto
    ): Promise<ApiResponse<repository_access>> {
        try {
            const idSchema = z.object({
                repositoryId: z.number().int().positive(),
                userId: z.number().int().positive()
            });
            
            const validatedIds = idSchema.parse(repoUserId);
            const validatedData = UpdateRepositoryAccessDto.parse(data);
            
            // Map the string enum value to the Prisma enum
            const accessLevel = validatedData.accessLevel === 'edit' 
                ? RepositoryAccess.edit 
                : RepositoryAccess.view;
            
            return await this.repositoryAccessRepository.updateRepositoryAccess(
                validatedIds.repositoryId,
                validatedIds.userId,
                accessLevel
            );
        } catch (error) {
            console.error('Error in RepositoryAccessService.updateRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update repository access',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}