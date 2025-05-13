import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { IssueController } from '../controllers/issue.controller';

/**
 * Factory that returns a router for all “issue” operations.
 * The resolved controller is proxied by the Inversify tracing middleware,
 * so every method call becomes its own span in Jaeger.
 */
export const issueRoutes = (): Router => {
  const router = Router();

  const issueCtrl = container.get<IssueController>(TYPES.IssueController);

  /* ───────── Global search (across all repos) ───────── */
  // NOTE: place before dynamic /:issueId routes to avoid conflicts
  router.get('/search', issueCtrl.findAllIssues.bind(issueCtrl));

  /* ───────── Repository‑level operations ───────── */
  router.get(
    '/repository/:repositoryId',
    issueCtrl.getRepositoryIssues.bind(issueCtrl),
  );

  router.get(
    '/repository/:repositoryId/search',
    issueCtrl.searchIssues.bind(issueCtrl),
  );

  router.get(
    '/repository/:repositoryId/comments',
    issueCtrl.getRepositoryIssueComments.bind(issueCtrl),
  );

  /* ───────── Individual issue operations ───────── */
  router.get('/:issueId', issueCtrl.getIssueById.bind(issueCtrl));
  router.get('/:issueId/comments', issueCtrl.getIssueComments.bind(issueCtrl));
  router.post('/', issueCtrl.createIssue.bind(issueCtrl));
  router.put('/:issueId', issueCtrl.updateIssue.bind(issueCtrl));
  router.delete('/:issueId', issueCtrl.deleteIssue.bind(issueCtrl));

  /* ───────── Issue comments (stand‑alone) ───────── */
  router.post('/comments', issueCtrl.addIssueComment.bind(issueCtrl));

  /* ───────── User issues ───────── */
  router.get('/user/:userId', issueCtrl.getUserIssues.bind(issueCtrl));

  return router;
};

/* default export for backward‑compatibility */
export default issueRoutes;
