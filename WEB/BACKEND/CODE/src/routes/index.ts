import { Router } from 'express';
import { configureUserRoutes } from './user.routes';
import {configureGitRoutes} from  './git.routes'
import {authenticationRoutes} from './authentication.routes';

export const configureRoutes = (): Router => {
    const router = Router();

    router.use('/users', configureUserRoutes());
    router.use('/git',configureGitRoutes());
    router.use('',authenticationRoutes());


    return router;
};