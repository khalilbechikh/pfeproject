import { Router } from 'express';
import container from '../di/inversify.config';
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

  // GET /users – list all users
  router.get('/', userCtrl.getAllUsers.bind(userCtrl));

  // GET /users/:id – fetch single user
  router.get('/:id', userCtrl.getUserById.bind(userCtrl));

  // POST /users – create user
  router.post('/', userCtrl.createUser.bind(userCtrl));

  // PUT /users/:id – update user
  router.put('/:id', userCtrl.updateUser.bind(userCtrl));

  // DELETE /users/:id – remove user
  router.delete('/:id', userCtrl.deleteUser.bind(userCtrl));

  return router;
};

/* default export keeps existing imports working */
export default configureUserRoutes;
