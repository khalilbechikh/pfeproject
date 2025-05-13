import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { PullRequestController } from '../controllers/pullRequest.controller';

/**
 * Factory that builds the Pull‑request router.
 * The controller instance comes from Inversify and is therefore proxied
 * by your tracing middleware—every method call appears as a span in Jaeger.
 */
export const configurePullRequestRoutes = (): Router => {
  const router = Router();

  const prCtrl = container.get<PullRequestController>(
    TYPES.PullRequestController,
  );

  /* ───────── Pull‑request endpoints ───────── */

  router.post('/', prCtrl.createPullRequest.bind(prCtrl));

  router.get('/', prCtrl.getAllPullRequests.bind(prCtrl));

  // Preview changes in a pull request
  router.get('/:id/preview', prCtrl.previewPullRequest.bind(prCtrl));

  // Prepare & finalise merge
  router.post('/:id/prepare-merge', prCtrl.preparePullRequestMerge.bind(prCtrl));
  router.post('/:id/finalize-merge', prCtrl.finalizePullRequestMerge.bind(prCtrl));

  // Update status
  router.patch('/:id/status', prCtrl.updatePullRequestStatus.bind(prCtrl));

  // Delete PR
  router.delete('/:id', prCtrl.deletePullRequest.bind(prCtrl));

  /* Deprecated diff route (kept for compat) */
  router.get('/:id/diff', prCtrl.getPullRequestDiffById.bind(prCtrl));

  return router;
};

/* default export keeps existing imports working */
export default configurePullRequestRoutes;
