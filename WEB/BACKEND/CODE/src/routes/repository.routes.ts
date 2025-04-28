import { Router } from 'express';
import container from '../di/inversify.config';
import { RepositoryController } from '../controllers/repository.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

export const configureRepositoryRoutes = (): Router => {
    const router = Router();
    const repositoryController = container.get<RepositoryController>(RepositoryController);

    // PUT endpoint to update a repository
    router.put('/:id', authenticateJWT, (req, res) => 
        repositoryController.updateRepository(req, res));

    return router;
};