import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * Checks if a user has the required access level to a repository
 * @param prisma - The Prisma client instance
 * @param repoId - The ID of the repository
 * @returns A middleware function that verifies repository access
 */
export const verifyRepositoryAccess = (prisma: PrismaClient, repoId: number) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.userId || req.body.userId);
      const requiredAccess = req.params.accessLevel || req.body.accessLevel || 'view';
      
      if (isNaN(userId) || isNaN(repoId)) {
        return res.status(400).json({ error: 'Invalid user ID or repository ID' });
      }

      if (!['owner', 'edit', 'view'].includes(requiredAccess)) {
        return res.status(400).json({ error: 'Invalid access level requirement' });
      }

      // Check if repository exists
      const repository = await prisma.repository.findUnique({
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
      const accessRecord = await prisma.repository_access.findUnique({
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
