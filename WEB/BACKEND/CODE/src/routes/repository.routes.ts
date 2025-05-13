import { Router } from 'express';
import container from '../di/inversify.config';
import { RepositoryController } from '../controllers/repository.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

export const configureRepositoryRoutes = (): Router => {
    const router = Router();
    const repositoryController = container.get<RepositoryController>(RepositoryController);

    // GET endpoint to retrieve all repositories (optionally filtered by name)
    // IMPORTANT: Place this before the '/:id' route to avoid conflicts
    router.get('/', authenticateJWT, (req, res) =>
        repositoryController.getAllRepositories(req, res)
    );

    // GET all repositories including archived (admin only)
    router.get('/all-including-archived', authenticateJWT, (req, res) =>
        repositoryController.getAllRepositoriesIncludingArchived(req, res)
    );

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

    // PATCH endpoint to change repository ownership
    router.patch('/:id/change-ownership', authenticateJWT, (req, res) =>
        repositoryController.changeOwnership(req, res)
    );

    // PATCH archive a repository (admin)
    router.patch('/:id/archive', authenticateJWT, (req, res) =>
        repositoryController.archiveRepository(req, res)
    );

    // PATCH restore a repository (admin)
    router.patch('/:id/restore', authenticateJWT, (req, res) =>
        repositoryController.restoreRepository(req, res)
    );

    // GET endpoint to retrieve a repository by ID
    router.get('/:id', authenticateJWT, (req, res) =>
        repositoryController.getRepositoryById(req, res)
    );

    return router;
};