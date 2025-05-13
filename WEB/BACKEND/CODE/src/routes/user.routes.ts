import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import container from '../di/inversify.config';
import { avatarUpload } from '../config/multer.config'; // Adjust the path as needed

export const configureUserRoutes = (): Router => {
    const router = Router();
    const userController = container.get<UserController>(UserController);

    // GET /api/users - Get all users
    router.get('/', userController.getAllUsers);

    // GET /api/users/:id - Get a user by ID
    router.get('/:id', userController.getUserById);

    // GET /api/users/email/:email - Get a user by email
    router.get('/email/:email', userController.getUserByEmail);

    // POST /api/users - Create a new user
    router.post('/', userController.createUser);

    // PUT /api/users/:id - Update a user by ID
    router.put('/:id', userController.updateUser);

    // DELETE /api/users/:id - Delete a user by ID
    router.delete('/:id', userController.deleteUser);

    router.put('/:id/change-password', userController.changePassword);

    router.patch(
        '/:id/avatar', // Remove duplicate 'users' from path
        avatarUpload,
        userController.uploadAvatar.bind(userController)
    );

    router.patch('/:id/suspend', userController.suspendUnsuspendUser);

    return router;
};