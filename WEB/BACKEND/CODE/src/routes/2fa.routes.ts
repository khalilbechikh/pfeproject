import { Router } from 'express';
import container from '../di/inversify.config';

import { TYPES } from '../di/types';
import { TwoFactorAuthController } from '../controllers/2fa';
import { AuthMiddleware } from '../middlewares/auth.middleware';

/**
 * Factory that returns a fresh router every time it’s imported.
 * All controller methods are `bind`‑ed so `this` works, and every call
 * is auto‑traced by the Inversify tracing middleware you added earlier.
 */
export const twoFactorAuthRoutes = (): Router => {
  const router = Router();

  /* Resolve singletons from the container (they’ll be proxied for tracing) */
  const ctrl  = container.get<TwoFactorAuthController>(TYPES.TwoFactorAuthController);
  const auth  = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  /** @route GET /2fa/generate – Generate a new 2FA QR code (private) */
  router.get(
    '/generate',
    auth.authenticate.bind(auth),
    ctrl.generateTwoFactorAuth.bind(ctrl),
  );

  /** @route POST /2fa/verify – Verify a 2FA token & enable 2FA (private) */
  router.post(
    '/verify',
    auth.authenticate.bind(auth),
    ctrl.verifyAndEnableTwoFactor.bind(ctrl),
  );

  /** @route POST /2fa/validate – Validate a supplied 2FA token (public) */
  router.post('/validate', ctrl.validateTwoFactorToken.bind(ctrl));

  /** @route DELETE /2fa – Disable 2FA (private) */
  router.delete(
    '/',
    auth.authenticate.bind(auth),
    ctrl.disableTwoFactor.bind(ctrl),
  );

  return router;
};

/* default export keeps existing import lines working */
export default twoFactorAuthRoutes;
