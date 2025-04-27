import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { AuthService } from "../services/auth.service";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

enum ResponseStatus {
    SUCCESS = "success",
    FAILED = "failed",
    WARNING = "warning"
}

enum CustomSuccessCode {
    VALIDATION_WARNING = 210,
    BUSINESS_RULE_WARNING = 211,
    PARTIAL_SUCCESS = 212
}

@injectable()
export class AuthenticationController {
    constructor(@inject(AuthService) private authService: AuthService) {}

    // Update the formatWarningResponse method
private formatWarningResponse(message: string): { 
    status: ResponseStatus, 
    message: string, 
    code: CustomSuccessCode
} {
    // Handle username already exists
    if (message.includes('Username already taken')) {
        return {
            status: ResponseStatus.WARNING,
            message: 'Username already taken. Please choose a different username.',
            code: CustomSuccessCode.BUSINESS_RULE_WARNING
        };
    }
    
    // Handle email already exists
    if (message.includes('Email already registered')) {
        return {
            status: ResponseStatus.WARNING,
            message: 'Email already in use. Please use a different email or login.',
            code: CustomSuccessCode.BUSINESS_RULE_WARNING
        };
    }
    
    // Rest of the conditions remain the same...
        
        // Handle invalid password format
        if (message.includes('password') || message.includes('Password')) {
            return {
                status: ResponseStatus.WARNING,
                message: 'Password must contain uppercase, lowercase, numbers and special characters',
                code: CustomSuccessCode.VALIDATION_WARNING
            };
        }
        
        // Handle user not found (login)
        if (message.includes('not found') || message.includes('does not exist')) {
            return {
                status: ResponseStatus.WARNING,
                message: 'User not found. Please check your credentials or sign up.',
                code: CustomSuccessCode.BUSINESS_RULE_WARNING
            };
        }
        
        // Handle incorrect password (login)
        if (message.includes('Invalid password') || message.includes('incorrect password')) {
            return {
                status: ResponseStatus.WARNING,
                message: 'Incorrect password. Please try again.',
                code: CustomSuccessCode.BUSINESS_RULE_WARNING
            };
        }

        // Default case
        return {
            status: ResponseStatus.WARNING,
            message: message,
            code: CustomSuccessCode.PARTIAL_SUCCESS
        };
    }

    public async signUp(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.authService.signUp(req.body);

            if (response.status === ResponseStatus.SUCCESS && response.data) {
                const token = jwt.sign(
                    { userId: response.data.id, username: response.data.username },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                
                res.header('Authorization', `Bearer ${token}`)
                   .status(201)
                   .json({
                       status: ResponseStatus.SUCCESS,
                       message: 'Account created successfully',
                       data: {
                           id: response.data.id,
                           username: response.data.username,
                           email: response.data.email
                       }
                   });
            } else {
                const warningResponse = this.formatWarningResponse(response.message);
                res.status(warningResponse.code).json(warningResponse);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const warningResponse = this.formatWarningResponse(errorMessage);
            res.status(warningResponse.code).json(warningResponse);
        }
    }

    public async signIn(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.authService.signIn(req.body);

            if (response.status === ResponseStatus.SUCCESS && response.data) {
                const token = jwt.sign(
                    { userId: response.data.id, email: response.data.email },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                
                res.header('Authorization', `Bearer ${token}`)
                   .status(200)
                   .json({
                       status: ResponseStatus.SUCCESS,
                       message: 'Login successful',
                       data: {
                           id: response.data.id,
                           email: response.data.email
                       }
                   });
            } else {
                const warningResponse = this.formatWarningResponse(response.message);
                res.status(warningResponse.code).json(warningResponse);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const warningResponse = this.formatWarningResponse(errorMessage);
            res.status(warningResponse.code).json(warningResponse);
        }
    }
}