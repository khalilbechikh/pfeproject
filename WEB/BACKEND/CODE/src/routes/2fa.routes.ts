import express from 'express';
import { TwoFactorAuthController } from '../controllers/2fa';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { authenticateJWT } from '../middlewares/auth.middleware';

const twoFactorAuthRouter = express.Router();
const twoFactorAuthController = container.get<TwoFactorAuthController>(TYPES.TwoFactorAuthController);

/**
 * @route   GET /api/2fa/generate
 * @desc    Generate a new 2FA QR code for the authenticated user
 * @access  Private (requires valid JWT token)
 */
twoFactorAuthRouter.get('/generate', 
    authenticateJWT, 
    (req, res) => twoFactorAuthController.generateTwoFactorAuth(req, res)
);

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify a 2FA token and enable 2FA for the user
 * @access  Private (requires valid JWT token)
 */
twoFactorAuthRouter.post('/verify', 
    authenticateJWT, 
    (req, res) => twoFactorAuthController.verifyAndEnableTwoFactor(req, res)
);

/**
 * @route   POST /api/2fa/validate
 * @desc    Validate a 2FA token during login process
 * @access  Public
 */
twoFactorAuthRouter.post('/validate', 
    (req, res) => twoFactorAuthController.validateTwoFactorToken(req, res)
);

/**
 * @route   DELETE /api/2fa
 * @desc    Disable 2FA for the authenticated user
 * @access  Private (requires valid JWT token)
 */
twoFactorAuthRouter.delete('/', 
    authenticateJWT, 
    (req, res) => twoFactorAuthController.disableTwoFactor(req, res)
);

export default twoFactorAuthRouter;