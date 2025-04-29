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

    // POST endpoint to create a repository
    router.post('/', authenticateJWT, (req, res) =>
        repositoryController.createRepository(req, res)
    );

    // DELETE endpoint to delete a repository
    router.delete('/:id', authenticateJWT, (req, res) =>
        repositoryController.deleteRepository(req, res)
    );

    // POST endpoint to fork a repository
    router.post('/:id/fork', authenticateJWT, (req, res) =>
        repositoryController.forkRepository(req, res)
    );

    // GET endpoint to retrieve a repository by ID
    router.get('/:id', authenticateJWT, (req, res) =>
        repositoryController.getRepositoryById(req, res)
    );

    return router;
};