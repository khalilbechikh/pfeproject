// authentication.routes.ts
import { Router, Request, Response } from 'express';
import container from "../di/inversify.config";
import { AuthenticationController } from "../controllers/authentication.controller";

export const authenticationRoutes = (): Router => {
    const router = Router();

    router.post('/signup', async (req: Request, res: Response) => {
        const authenticationController = container.get<AuthenticationController>(AuthenticationController);
        await authenticationController.signUp(req, res);
    });

    router.post('/signin', async (req: Request, res: Response) => {
        const authenticationController = container.get<AuthenticationController>(AuthenticationController);
        await authenticationController.signIn(req, res);
    });

    return router;
}