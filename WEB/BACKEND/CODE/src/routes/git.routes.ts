import { Router } from 'express';
import { CreateRepo } from '../controllers/git.controller';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Import the middleware

export const configureGitRoutes = (): Router => {
    const router = Router();

    // Apply the authentication middleware to protect the route
    router.get('/:RepoName', authenticateJWT, CreateRepo);

    return router;
};