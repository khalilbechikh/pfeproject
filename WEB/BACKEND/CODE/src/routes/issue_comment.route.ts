import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { IssueCommentController } from '../controllers/issue_comment.controller';

/**
 * Factory that returns a router for issue‑comment operations.
 * The controller instance is resolved via Inversify, so every method call
 * is automatically wrapped in a tracing span by your middleware.
 */
export const issueCommentRoutes = (): Router => {
  const router = Router();

  const ctrl = container.get<IssueCommentController>(
    TYPES.IssueCommentController,
  );

  /* ───────── Issue‑comment endpoints ───────── */

  // Get a specific comment by ID
  router.get('/comments/:commentId', ctrl.getCommentById.bind(ctrl));

  // Get all comments for a specific issue
  router.get('/issues/:issueId/comments', ctrl.getCommentsByIssueId.bind(ctrl));

  // Create a new comment
  router.post('/comments', ctrl.createComment.bind(ctrl));

  // Update an existing comment
  router.put('/comments/:commentId', ctrl.updateComment.bind(ctrl));

  // Delete a comment
  router.delete('/comments/:commentId', ctrl.deleteComment.bind(ctrl));

  return router;
};

/* default export for backward‑compatibility */
export default issueCommentRoutes;
