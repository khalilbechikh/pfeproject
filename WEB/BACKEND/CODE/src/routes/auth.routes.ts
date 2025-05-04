import { Router } from 'express';
// Correct the import for the default export
import container from '../di/inversify.config';
import { AuthenticationController } from '../controllers/authentication.controller';
import { TYPES } from '../di/types';

const authRouter = Router();
const authController = container.get<AuthenticationController>(TYPES.AuthenticationController);

// Existing routes
authRouter.post('/signup', (req, res) => authController.signUp(req, res));
authRouter.post('/signin', (req, res) => authController.signIn(req, res));

// New routes for password reset
authRouter.post('/request-password-reset', (req, res) => authController.requestPasswordReset(req, res));
authRouter.post('/set-password', (req, res) => authController.setPassword(req, res));

export default authRouter;
