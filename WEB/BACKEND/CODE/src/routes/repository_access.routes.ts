import express from 'express';
import container from '../di/inversify.config';
import { RepositoryAccessController } from '../controllers/repository_access.controller';
import { TYPES } from '../di/types';

const router = express.Router();
const repositoryAccessController = container.get<RepositoryAccessController>(TYPES.RepositoryAccessController);

// Get all repositories a user has access to
router.get('/users/:userId/repositories', repositoryAccessController.getUserRepositoryAccess);

// Get all users who have access to a repository
router.get('/repositories/:repositoryId/users', repositoryAccessController.getRepositoryUserAccess);

// Verify if a user has the specified level of access to a repository
router.get('/repositories/:repositoryId/users/:userId/verify', repositoryAccessController.verifyRepositoryAccess);

// Add repository access for a user
router.post('/access', repositoryAccessController.addRepositoryAccess);

// Remove repository access for a user
router.delete('/repositories/:repositoryId/users/:userId', repositoryAccessController.removeRepositoryAccess);

// Update repository access level for a user
router.put('/repositories/:repositoryId/users/:userId', repositoryAccessController.updateRepositoryAccess);

export default router;
