import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { PullRequestController } from '../controllers/pullRequest.controller';

export const configurePullRequestRoutes = (): Router => {
    const router = Router();
    // Resolve the controller from the container
    const pullRequestController = container.get<PullRequestController>(TYPES.PullRequestController);

    // Define routes
    router.post('/', pullRequestController.createPullRequest);
    router.get('/', pullRequestController.getAllPullRequests);
    router.get('/:id/preview', pullRequestController.previewPullRequest); // Route for previewing
    router.post('/:id/prepare-merge', pullRequestController.preparePullRequestMerge);
    router.post('/:id/finalize-merge', pullRequestController.finalizePullRequestMerge);
    router.patch('/:id/status', pullRequestController.updatePullRequestStatus); // Use PATCH for partial updates like status
    router.delete('/:id', pullRequestController.deletePullRequest);

    // Deprecated route (points to preview)
    router.get('/:id/diff', pullRequestController.getPullRequestDiffById);

    return router;
};

