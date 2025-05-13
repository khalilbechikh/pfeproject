import express from 'express';
import { TwoFactorAuthController } from '../controllers/2fa';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';
import { AuthMiddleware } from '../middlewares/auth.middleware'; // Import the class

const twoFactorAuthRouter = express.Router();
const twoFactorAuthController = container.get<TwoFactorAuthController>(TYPES.TwoFactorAuthController);
const authMiddleware = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

/**
 * @route   GET /api/2fa/generate
 * @desc    Generate a new 2FA QR code for the authenticated user
 * @access  Private (requires valid JWT token)
 */
twoFactorAuthRouter.get('/generate', 
    authMiddleware.authenticate, // Use the new middleware
    (req, res) => twoFactorAuthController.generateTwoFactorAuth(req, res)
);

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify a 2FA token and enable 2FA for the user
 * @access  
 */
twoFactorAuthRouter.post('/verify', 
    authMiddleware.authenticate, 
    (req, res) => twoFactorAuthController.verifyAndEnableTwoFactor(req, res)
);

/**
 * @route   
 * @desc    
 * @access  
 */
twoFactorAuthRouter.post('/validate', 
    (req, res) => twoFactorAuthController.validateTwoFactorToken(req, res)
);

/**
 * @route   
 * @desc    
 * @access  
 */
twoFactorAuthRouter.delete('/', 
    authMiddleware.authenticate, // Use the new middleware
    (req, res) => twoFactorAuthController.disableTwoFactor(req, res)
);

export default twoFactorAuthRouter;