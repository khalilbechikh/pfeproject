import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import container from '../di/inversify.config';

export const configureUserRoutes = (): Router => {
    const router = Router();
    const userController = container.get<UserController>(UserController);

    // GET /api/users/:id - Get a user by ID
    router.get('/:id', userController.getUserById);

    // POST /api/users - Create a new user
    router.post('/', userController.createUser);

    // PUT /api/users/:id - Update a user by ID
    router.put('/:id', userController.updateUser);

    // DELETE /api/users/:id - Delete a user by ID
    router.delete('/:id', userController.deleteUser);

    return router;
};