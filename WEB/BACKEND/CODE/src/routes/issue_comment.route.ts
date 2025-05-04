import express from 'express';
import container from '../di/inversify.config';
import { IssueCommentController } from '../controllers/issue_comment.controller';
import { TYPES } from '../di/types';

const router = express.Router();
const issueCommentController = container.get<IssueCommentController>(TYPES.IssueCommentController);

// Get a specific comment by its ID
router.get('/comments/:commentId', issueCommentController.getCommentById);

// Get all comments for a specific issue
router.get('/issues/:issueId/comments', issueCommentController.getCommentsByIssueId);

// Create a new issue comment
router.post('/comments', issueCommentController.createComment);

// Update an existjjjing issue comment
router.put('/comments/:commentId', issueCommentController.updateComment);

// Delete an issue comment
router.delete('/comments/:commentId', issueCommentController.deleteComment);

export default router;
