import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'inversify';

/**
 * Middleware to verify a user's ownership of a repository
 * or check if they have sufficient access rights
 */
@injectable()
export class OwnershipMiddleware {
  constructor(@inject('PrismaClient') private prisma: PrismaClient) {}

  /**
   * Creates a middleware to check repository access with specified permission level
   * @param requiredAccess - The required access level
   * @returns Express middleware function
   */
  withAccess(requiredAccess: 'owner' | 'edit' | 'view' = 'view') {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const repoId = parseInt(req.params.repoId);
        
        // Get user ID from the authenticated user object (set by authenticateJWT middleware)
        if (!req.user || !req.user.userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const userId = parseInt(req.user.userId);
        
        if (isNaN(userId) || isNaN(repoId)) {
          return res.status(400).json({ error: 'Invalid user ID or repository ID' });
        }

        // Check if repository exists
        const repository = await this.prisma.repository.findUnique({
          where: { id: repoId }
        });

        if (!repository) {
          return res.status(404).json({ error: 'Repository not found' });
        }

        // Check if user is the owner
        if (repository.owner_user_id === userId) {
          // Owner has all access rights
          return next();
        }

        // If owner access is required but user is not the owner
        if (requiredAccess === 'owner') {
          return res.status(403).json({ error: 'Only the repository owner can perform this action' });
        }

        // Check if user has specific access rights
        const accessRecord = await this.prisma.repository_access.findUnique({
          where: {
            repository_id_user_id: {
              repository_id: repoId,
              user_id: userId
            }
          }
        });

        if (!accessRecord) {
          return res.status(403).json({ error: 'You do not have access to this repository' });
        }

        // Check if user has the required access level
        if (requiredAccess === 'edit' && accessRecord.access_level !== 'edit') {
          return res.status(403).json({ error: 'You do not have edit rights for this repository' });
        }

        // At this point, the user has sufficient access
        return next();
      } catch (error) {
        console.error('Error verifying repository access:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  // Convenience methods for common access levels
  viewAccess = () => this.withAccess('view');
  editAccess = () => this.withAccess('edit');
  ownerAccess = () => this.withAccess('owner');
}
