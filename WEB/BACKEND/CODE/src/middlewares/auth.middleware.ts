import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { injectable } from 'inversify';

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Interface for decoded token data - updated to match controller's token format
interface DecodedToken {
    userId: string;
    username: string;
    iat: number;
    exp: number;
}

// Extend Express Request interface to include user information
declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

@injectable()
export class AuthMiddleware {
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your_secret_key_here';
    }

    /**
     * Middleware to authenticate requests using JWT tokens
     * Extracts token from Authorization header, verifies it,
     * and attaches user data to the request object
     */
    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        // Get authorization header
        const authHeader = req.headers.authorization;

        // Check if authorization header exists
        if (!authHeader) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required. No token provided.'
            });
            return;
        }

        // Extract token from header (remove 'Bearer ' prefix)
        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication failed. Invalid token format.'
            });
            return;
        }

        try {
            // Verify and decode the token
            const decoded = jwt.verify(token, this.jwtSecret) as DecodedToken;

            // Attach user info to request object for use in route handlers
            req.user = decoded;

            // Continue to the protected route
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication failed. Token expired.'
                });
                return;
            }

            res.status(401).json({
                status: 'error',
                message: 'Authentication failed. Invalid token.'
            });
            return;
        }
    };
}