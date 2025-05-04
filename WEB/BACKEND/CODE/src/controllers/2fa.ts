import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { TYPES } from '../di/types';

/**
 * Controller for handling Two-Factor Authentication (2FA) operations
 */
@injectable()
export class TwoFactorAuthController {
    constructor(
        @inject(UserService) private userService: UserService
    ) {}

    /**
     * Generates a new 2FA secret and QR code for the user
     * Uses the authenticated user information from the request object
     * that was set by the authenticateJWT middleware
     */
    public async generateTwoFactorAuth(req: Request, res: Response): Promise<void> {
        try {
            // Check if user is authenticated and user info exists in request
            if (!req.user || !req.user.userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required.'
                });
                return;
            }

            const userId = req.user.userId;
            const username = req.user.username;

            // Generate a new secret key for the user
            const secret = speakeasy.generateSecret({
                name: `MyGitApp:${username}` // The name that appears in the authentication app
            });

            // Save the secret to the user's record (temporary - will be confirmed later)
            await this.userService.updateUserTwoFactorSecret(userId, secret.base32);

            // Generate QR code as a data URL
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

            // Return the QR code and the secret key
            res.status(200).json({
                status: 'success',
                data: {
                    qrCode: qrCodeUrl,
                    secret: secret.base32,
                    message: 'Scan the QR code with your authentication app to set up 2FA'
                }
            });
        } catch (error) {
            console.error('Error generating 2FA:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate 2FA authentication setup'
            });
        }
    }

    /**
     * Verifies the 2FA token provided by the user
     * and enables 2FA on their account if valid
     */
    public async verifyAndEnableTwoFactor(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required.'
                });
                return;
            }

            const { token } = req.body;
            const userId = req.user.userId;

            if (!token) {
                res.status(400).json({
                    status: 'error',
                    message: 'Verification token is required'
                });
                return;
            }

            // Get the user's temporary secret
            const user = await this.userService.findUserById(userId);
            
            if (!user || !user.twoFactorSecret) {
                res.status(400).json({
                    status: 'error',
                    message: 'No 2FA setup found for this user. Please generate a new QR code first.'
                });
                return;
            }

            // Verify the token against the saved secret
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token
            });

            if (verified) {
                // Enable 2FA for the user
                await this.userService.enableTwoFactor(userId);
                
                res.status(200).json({
                    status: 'success',
                    message: 'Two-factor authentication has been enabled successfully.'
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid verification token. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error verifying 2FA token:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to verify and enable 2FA'
            });
        }
    }

    /**
     * Validates a 2FA token during login
     */
    public async validateTwoFactorToken(req: Request, res: Response): Promise<void> {
        try {
            const { userId, token } = req.body;

            if (!userId || !token) {
                res.status(400).json({
                    status: 'error',
                    message: 'User ID and token are required'
                });
                return;
            }

            // Get the user's 2FA secret
            const user = await this.userService.findUserById(userId);
            
            if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
                res.status(400).json({
                    status: 'error',
                    message: '2FA is not enabled for this user'
                });
                return;
            }

            // Verify the token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 1 // Allow 1 step before and after for time skew
            });

            if (verified) {
                res.status(200).json({
                    status: 'success',
                    message: '2FA token is valid',
                    data: {
                        userId: user.id,
                        username: user.username
                    }
                });
            } else {
                res.status(401).json({
                    status: 'error',
                    message: 'Invalid 2FA token'
                });
            }
        } catch (error) {
            console.error('Error validating 2FA token:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to validate 2FA token'
            });
        }
    }

    /**
     * Disables 2FA for the authenticated user
     */
    public async disableTwoFactor(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user.userId) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required.'
                });
                return;
            }

            const userId = req.user.userId;

            // Disable 2FA and clear the secret
            await this.userService.disableTwoFactor(userId);
            
            res.status(200).json({
                status: 'success',
                message: 'Two-factor authentication has been disabled successfully.'
            });
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to disable 2FA'
            });
        }
    }
}