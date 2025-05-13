import { Router } from 'express';
import container from '../di/inversify.config';
import { RepositoryController } from '../controllers/repository.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware'; // Import the class
import { TYPES } from '../di/types'; // Import TYPES

export const configureRepositoryRoutes = (): Router => {
    const router = Router();
    const repositoryController = container.get<RepositoryController>(RepositoryController);
    // Get AuthMiddleware from container
    const authMiddleware = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

    // GET endpoint to retrieve all repositories (optionally filtered by name)
    // IMPORTANT: Place this before the '/:id' route to avoid conflicts
    router.get('/', authMiddleware.authenticate, (req, res) =>
        repositoryController.getAllRepositories(req, res)
    );

    // PUT endpoint to update a repository
    router.put('/:id', authMiddleware.authenticate, (req, res) => 
        repositoryController.updateRepository(req, res));

    // POST endpoint to create a repository
    router.post('/', authMiddleware.authenticate, (req, res) =>
        repositoryController.createRepository(req, res)
    );

    // DELETE endpoint to delete a repository
    router.delete('/:id', authMiddleware.authenticate, (req, res) =>
        repositoryController.deleteRepository(req, res)
    );

    // POST endpoint to fork a repository
    router.post('/:id/fork', authMiddleware.authenticate, (req, res) =>
        repositoryController.forkRepository(req, res)
    );

    // GET endpoint to retrieve a repository by ID
    router.get('/:id', authMiddleware.authenticate, (req, res) =>
        repositoryController.getRepositoryById(req, res)
    );

    return router;
};