// authentication.routes.ts
import { Router, Request, Response } from 'express';
import container from "../di/inversify.config";
import { AuthenticationController } from "../controllers/authentication.controller";
import { TYPES } from '../di/types'; // Import TYPES if needed for controller resolution

export const authenticationRoutes = (): Router => {
    const router = Router();
    // Resolve controller once
    const authenticationController = container.get<AuthenticationController>(TYPES.AuthenticationController);

    router.post('/signup', async (req: Request, res: Response) => {
        await authenticationController.signUp(req, res);
    });

    router.post('/signin', async (req: Request, res: Response) => {
        await authenticationController.signIn(req, res);
    });

    // Add route for requesting password reset
    router.post('/request-password-reset', async (req: Request, res: Response) => {
        await authenticationController.requestPasswordReset(req, res);
    });

    // Add route for setting a new password (after reset request)
    router.post('/set-password', async (req: Request, res: Response) => {
        await authenticationController.setPassword(req, res);
    });

    return router;
}