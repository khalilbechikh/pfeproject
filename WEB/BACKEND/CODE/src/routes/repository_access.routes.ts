import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { RepositoryAccessController } from '../controllers/repository_access.controller';

/**
 * Factory that builds the “repository access” router.
 * The controller instance is resolved via Inversify, so every method call
 * is proxied by your tracing middleware and shows up as a span in Jaeger.
 */
export const repositoryAccessRoutes = (): Router => {
  const router = Router();

  const ctrl = container.get<RepositoryAccessController>(
    TYPES.RepositoryAccessController,
  );

  /* ───────── Access‑management endpoints ───────── */

  // List repositories a user can access
  router.get(
    '/users/:userId/repositories',
    ctrl.getUserRepositoryAccess.bind(ctrl),
  );

  // List users who can access a given repository
  router.get(
    '/repositories/:repositoryId/users',
    ctrl.getRepositoryUserAccess.bind(ctrl),
  );

  // Verify a user’s access level
  router.get(
    '/repositories/:repositoryId/users/:userId/verify',
    ctrl.verifyRepositoryAccess.bind(ctrl),
  );

  // Grant access
  router.post('/access', ctrl.addRepositoryAccess.bind(ctrl));

  // Revoke access
  router.delete(
    '/repositories/:repositoryId/users/:userId',
    ctrl.removeRepositoryAccess.bind(ctrl),
  );

  // Update access level
  router.put(
    '/repositories/:repositoryId/users/:userId',
    ctrl.updateRepositoryAccess.bind(ctrl),
  );

  return router;
};

/* default export keeps existing imports working */
export default repositoryAccessRoutes;
