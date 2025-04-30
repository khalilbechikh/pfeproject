import { Router } from 'express';
import { configureUserRoutes } from './user.routes';
//import { configureGitRoutes } from './git.routes';
import { authenticationRoutes } from './authentication.routes';
import { configureRepositoryRoutes } from './repository.routes';
import folderPreviewRoutes from './folder.preview.routes'; // Import the new routes

export const configureRoutes = (): Router => {
    const router = Router();

    router.use('/users', configureUserRoutes());
   // router.use('/git', configureGitRoutes());
    router.use('', authenticationRoutes());
    router.use('/repositories', configureRepositoryRoutes());
    router.use('/preview', folderPreviewRoutes); // Use the new routes with a base path like '/preview'

    return router;
};