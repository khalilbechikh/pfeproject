// src/routes/authentication.routes.ts
import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { AuthenticationController } from '../controllers/authentication.controller';

export const authenticationRoutes = (): Router => {
  const router = Router();

  /* Resolve the controller once; the instance is already proxied for tracing */
  const authCtrl = container.get<AuthenticationController>(
    TYPES.AuthenticationController,
  );

  /* ───────── Auth endpoints ───────── */
  router.post('/signup',  authCtrl.signUp.bind(authCtrl));
  router.post('/signin',  authCtrl.signIn.bind(authCtrl));

  /* ───────── Password‑reset flow ───────── */
  router.post(
    '/request-password-reset',
    authCtrl.requestPasswordReset.bind(authCtrl),
  );
  router.post('/set-password', authCtrl.setPassword.bind(authCtrl));

  return router;
};

/* default export so existing imports still work */
export default authenticationRoutes;
