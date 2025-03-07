import { Router } from 'express';
import { CreateRepo } from '../controllers/git.controller';

export const configureGitRoutes = (): Router => {
    const router = Router();

    router.get('/:RepoName', CreateRepo);

    return router;
};
