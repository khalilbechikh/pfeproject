import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';

import { RepositoryController } from '../controllers/repository.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

/**
 * Factory that builds the Repository router.
 * Controller and middleware instances are resolved via Inversify and are
 * therefore proxied by your tracing middleware—every call shows up in Jaeger.
 */
export const configureRepositoryRoutes = (): Router => {
  const router = Router();

  const repoCtrl = container.get<RepositoryController>(TYPES.RepositoryController);
  const auth     = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  /* ───────── Repository CRUD / actions ───────── */

  // List / search repositories
  router.get('/', auth.authenticate.bind(auth), repoCtrl.getAllRepositories.bind(repoCtrl));

  // Create repository
  router.post('/', auth.authenticate.bind(auth), repoCtrl.createRepository.bind(repoCtrl));

  // Update repository
  router.put('/:id', auth.authenticate.bind(auth), repoCtrl.updateRepository.bind(repoCtrl));

  // Delete repository
  router.delete('/:id', auth.authenticate.bind(auth), repoCtrl.deleteRepository.bind(repoCtrl));

  // Fork repository
  router.post('/:id/fork', auth.authenticate.bind(auth), repoCtrl.forkRepository.bind(repoCtrl));

  // Get repository by ID  (placed last to avoid conflicts)
  router.get('/:id', auth.authenticate.bind(auth), repoCtrl.getRepositoryById.bind(repoCtrl));

  return router;
};

/* default export keeps existing imports working */
export default configureRepositoryRoutes;
