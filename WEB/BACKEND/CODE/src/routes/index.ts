import { Router } from 'express';
import { configureUserRoutes } from './user.routes';

import { authenticationRoutes } from './authentication.routes';
import { configureRepositoryRoutes } from './repository.routes';
import folderPreviewRoutes from './folder.preview.routes'; // Import the new routes
import { configurePullRequestRoutes } from './pullRequest.routes'; // Import pull request routes
import issueRoutes from './issue.routes'; // Import issue routes default 
import repositoryAccessController  from './repository_access.routes'; 
import twoFactorAuthRouter from './2fa.routes'; // Import 2FA routes

export const configureRoutes = (): Router => {
    const router = Router();

    router.use('/users', configureUserRoutes());
    // router.use('/git', configureGitRoutes());
    router.use('', authenticationRoutes());
    router.use('/repositories', configureRepositoryRoutes());
    router.use('/preview', folderPreviewRoutes); // Use the new routes with a base path like '/preview'
    router.use('/pull-requests', configurePullRequestRoutes()); // Add pull request routes
    router.use('/issues', issueRoutes); // Use the imported issue router directly
    router.use('/2fa', twoFactorAuthRouter); // Add 2FA routes
    router.use('/repository-access', repositoryAccessController); // Add repository access routes
    return router;
};