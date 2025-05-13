import { Router } from 'express';
import container from '../di/inversify.config';
import { avatarUpload } from '../config/multer.config';
import { TYPES } from '../di/types';
import { UserController } from '../controllers/user.controller';

/**
 * Factory that builds the User router.
 * The controller instance is resolved via Inversify and automatically
 * proxied for Jaeger tracing.
 */
export const configureUserRoutes = (): Router => {
  const router = Router();
  const userCtrl = container.get<UserController>(TYPES.UserController);

  /* ───────── User CRUD endpoints ───────── */
  router.get('/email/:email', userCtrl.getUserByEmail.bind(userCtrl));
  router.get('/', userCtrl.getAllUsers.bind(userCtrl));
  router.get('/:id', userCtrl.getUserById.bind(userCtrl));
  router.post('/', userCtrl.createUser.bind(userCtrl));
  router.put('/:id', userCtrl.updateUser.bind(userCtrl));
  router.put('/:id/change-password', userCtrl.changePassword.bind(userCtrl));
  router.patch('/:id/avatar', avatarUpload, userCtrl.uploadAvatar.bind(userCtrl));
  router.patch('/:id/suspend', userCtrl.suspendUnsuspendUser.bind(userCtrl));
  router.delete('/:id', userCtrl.deleteUser.bind(userCtrl));

  return router;
};

/* default export keeps existing imports working */
export default configureUserRoutes;
