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
   * Middleware to verify if the authenticated user is the owner of a repository
   * 
   * @param req Express request object with user from JWT authentication
   * @param res Express response object
   * @param next Express next function
   */
  verifyRepositoryOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required.'
        });
        return;
      }

      const userId = parseInt(req.user.userId);
      const repositoryId = parseInt(req.params.repositoryId);

      // Check for valid repository ID
      if (isNaN(repositoryId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid repository ID format.'
        });
        return;
      }

      // Find the repository and check ownership
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
        select: { owner_user_id: true }
      });

      if (!repository) {
        res.status(404).json({
          status: 'error',
          message: 'Repository not found.'
        });
        return;
      }

      // Check if authenticated user is the owner
      if (repository.owner_user_id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied. You do not own this repository.'
        });
        return;
      }

      // User is the owner, proceed to the protected route
      next();
    } catch (error) {
      console.error('Repository ownership verification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during ownership verification.'
      });
    }
  };

  /**
   * Middleware to verify if the authenticated user has access to a repository
   * with the specified access level
   * 
   * @param requiredAccessLevel Minimum access level required (e.g. 'read', 'write', 'admin')
   */
  verifyRepositoryAccess = (requiredAccessLevel: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          res.status(401).json({
            status: 'error',
            message: 'Authentication required.'
          });
          return;
        }

        const userId = parseInt(req.user.userId);
        const repositoryId = parseInt(req.params.repositoryId);

        // Check for valid repository ID
        if (isNaN(repositoryId)) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid repository ID format.'
          });
          return;
        }

        // Find the repository
        const repository = await this.prisma.repository.findUnique({
          where: { id: repositoryId }
        });

        if (!repository) {
          res.status(404).json({
            status: 'error',
            message: 'Repository not found.'
          });
          return;
        }

        // If the user is the owner, they always have full access
        if (repository.owner_user_id === userId) {
          next();
          return;
        }

        // If not the owner, check access level in repository_access
        const access = await this.prisma.repository_access.findUnique({
          where: {
            repository_id_user_id: {
              repository_id: repositoryId,
              user_id: userId
            }
          }
        });

        // If no access record exists
        if (!access) {
          // Check if the repository is public (for read access)
          if (requiredAccessLevel === 'read' && repository.is_private === false) {
            next();
            return;
          }

          res.status(403).json({
            status: 'error',
            message: 'Access denied. You do not have access to this repository.'
          });
          return;
        }

        // Map access levels to numerical values for comparison
        const accessLevels: { [key: string]: number } = {
          'read': 1,
          'write': 2,
          'admin': 3
        };

        const userAccessLevel = accessLevels[access.access_level] || 0;
        const requiredLevel = accessLevels[requiredAccessLevel] || 0;

        // Check if user's access level is sufficient
        if (userAccessLevel >= requiredLevel) {
          next();
          return;
        }

        res.status(403).json({
          status: 'error',
          message: `Access denied. This action requires '${requiredAccessLevel}' access.`
        });
      } catch (error) {
        console.error('Repository access verification error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during access verification.'
        });
      }
    };
  };

  /**
   * Middleware to verify if the authenticated user is the owner of an issue
   */
  verifyIssueOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required.'
        });
        return;
      }

      const userId = parseInt(req.user.userId);
      const issueId = parseInt(req.params.issueId);

      // Check for valid issue ID
      if (isNaN(issueId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid issue ID format.'
        });
        return;
      }

      // Find the issue and check ownership
      const issue = await this.prisma.issue.findUnique({
        where: { id: issueId },
        include: {
          repository: true
        }
      });

      if (!issue) {
        res.status(404).json({
          status: 'error',
          message: 'Issue not found.'
        });
        return;
      }

      // Check if authenticated user is the issue author
      if (issue.author_id === userId) {
        next();
        return;
      }

      // If not the author, check if user is the repository owner
      if (issue.repository.owner_user_id === userId) {
        next();
        return;
      }

      // Check if user has admin access to the repository
      const access = await this.prisma.repository_access.findUnique({
        where: {
          repository_id_user_id: {
            repository_id: issue.repository_id,
            user_id: userId
          }
        }
      });

      if (access && access.access_level === 'admin') {
        next();
        return;
      }

      res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have permission to modify this issue.'
      });
    } catch (error) {
      console.error('Issue ownership verification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during ownership verification.'
      });
    }
  };
}