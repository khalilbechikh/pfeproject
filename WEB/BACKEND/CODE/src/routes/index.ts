import { Router } from 'express';
import { configureUserRoutes } from './user.routes';
import {configureGitRoutes} from  './git.routes'

export const configureRoutes = (): Router => {
    const router = Router();

    // Mount user routes under /api/users
    router.use('/users', configureUserRoutes());
    router.use('/git',configureGitRoutes());

    // Add more route configurations here as needed

    return router;
};