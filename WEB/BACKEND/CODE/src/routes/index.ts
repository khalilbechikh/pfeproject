import { Router } from 'express';
import { configureUserRoutes } from './user.routes';

export const configureRoutes = (): Router => {
    const router = Router();

    // Mount user routes under /api/users
    router.use('/users', configureUserRoutes());

    // Add more route configurations here as needed

    return router;
};