import { Router } from 'express';
import container from "../di/inversify.config";
import { RepositoryController } from '../controllers/repository.controller';
import { UserController } from '../controllers/user.controller';
// Assuming you have an auth middleware, e.g., isAdminMiddleware
// import { isAdminMiddleware } from '../middlewares/auth.middleware'; // Example, adjust as needed

const adminRouter = Router();

const repositoryController = container.get(RepositoryController);
const userController = container.get(UserController);

// Apply admin-specific middleware if you have one
// adminRouter.use(isAdminMiddleware); // Example: Protect all admin routes

// Repository management routes
adminRouter.get(
    '/repositories',
    repositoryController.getAllRepositories.bind(repositoryController)
);
adminRouter.delete(
    '/repositories/:id',
    repositoryController.deleteRepository.bind(repositoryController)
);

// User management routes
adminRouter.get(
    '/users',
    userController.getAllUsers.bind(userController)
);
adminRouter.delete(
    '/users/:id',
    userController.deleteUser.bind(userController)
);

export default adminRouter;
