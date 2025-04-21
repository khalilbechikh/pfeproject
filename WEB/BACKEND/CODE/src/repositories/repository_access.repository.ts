import { Prisma, PrismaClient, repository_access, RepositoryAccess } from '@prisma/client';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';

@injectable()
export class RepositoryAccessRepository {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Get all repositories a user has access to
     * @param userId User ID to check
     * @returns Promise with ApiResponse containing array of repository_access
     */
    async getUserRepositoryAccess(userId: number): Promise<ApiResponse<repository_access[]>> {
        try {
            const repositories = await this.prisma.repository_access.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    repository: true
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository access retrieved successfully",
                data: repositories
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.getUserRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve repository access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get all users who have access to a repository
     * @param repositoryId Repository ID to check
     * @returns Promise with ApiResponse containing array of repository_access
     */
    async getRepositoryUserAccess(repositoryId: number): Promise<ApiResponse<repository_access[]>> {
        try {
            const users = await this.prisma.repository_access.findMany({
                where: {
                    repository_id: repositoryId
                },
                include: {
                    user: true
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository user access retrieved successfully",
                data: users
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.getRepositoryUserAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to retrieve repository user access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Verify if a user has the specified level of access to a repository
     * @param userId User ID to check
     * @param repositoryId Repository ID to check
     * @param accessLevel Access level to verify
     * @returns Promise with ApiResponse containing boolean indicating access
     */
    async verifyRepositoryAccess(
        userId: number, 
        repositoryId: number, 
        accessLevel: RepositoryAccess
    ): Promise<ApiResponse<boolean>> {
        try {
            const access = await this.prisma.repository_access.findUnique({
                where: {
                    repository_id_user_id: {
                        repository_id: repositoryId,
                        user_id: userId
                    }
                }
            });

            // Check if user has access and if their access level meets or exceeds required level
            const hasAccess = !!access && (
                // If view access is required, either view or edit is sufficient
                // If edit access is required, only edit is sufficient
                (accessLevel === RepositoryAccess.view) || 
                (accessLevel === RepositoryAccess.edit && access.access_level === RepositoryAccess.edit)
            );

            return {
                status: ResponseStatus.SUCCESS,
                message: hasAccess ? "User has required access" : "User does not have required access",
                data: hasAccess
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.verifyRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to verify repository access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Add repository access for a user
     * @param repositoryId Repository ID
     * @param userId User ID
     * @param accessLevel Access level to grant
     * @returns Promise with ApiResponse containing the created repository_access
     */
    async addRepositoryAccess(
        repositoryId: number, 
        userId: number, 
        accessLevel: RepositoryAccess
    ): Promise<ApiResponse<repository_access>> {
        try {
            const access = await this.prisma.repository_access.create({
                data: {
                    repository_id: repositoryId,
                    user_id: userId,
                    access_level: accessLevel
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository access added successfully",
                data: access
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.addRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to add repository access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Remove repository access for a user
     * @param repositoryId Repository ID
     * @param userId User ID
     * @returns Promise with ApiResponse containing the removed repository_access
     */
    async removeRepositoryAccess(
        repositoryId: number, 
        userId: number
    ): Promise<ApiResponse<repository_access>> {
        try {
            const access = await this.prisma.repository_access.delete({
                where: {
                    repository_id_user_id: {
                        repository_id: repositoryId,
                        user_id: userId
                    }
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository access removed successfully",
                data: access
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.removeRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to remove repository access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update repository access level for a user
     * @param repositoryId Repository ID
     * @param userId User ID
     * @param accessLevel New access level
     * @returns Promise with ApiResponse containing the updated repository_access
     */
    async updateRepositoryAccess(
        repositoryId: number, 
        userId: number, 
        accessLevel: RepositoryAccess
    ): Promise<ApiResponse<repository_access>> {
        try {
            const access = await this.prisma.repository_access.update({
                where: {
                    repository_id_user_id: {
                        repository_id: repositoryId,
                        user_id: userId
                    }
                },
                data: {
                    access_level: accessLevel
                }
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: "Repository access updated successfully",
                data: access
            };
        } catch (error) {
            console.error('Error in RepositoryAccessRepository.updateRepositoryAccess:', error);
            return {
                status: ResponseStatus.FAILED,
                message: "Failed to update repository access",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}



