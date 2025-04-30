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
            console.log("========== SIGNUP CONTROLLER START ==========");
            
            // Forward request directly to service - validation happens there
            const response = await this.authService.signUp(req.body);
            console.log("Service response status:", response.status);
            
            // Check response status and return appropriate HTTP status
            if (response.status === ResponseStatus.SUCCESS && response.data) {
                // Generate JWT token on success
                const token = jwt.sign(
                    { userId: response.data.id, username: response.data.username },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );
                
                res.header('Authorization', `Bearer ${token}`);
                res.status(201).json(response); // 201 Created
                console.log("Registration successful, response sent with status 201");
            } else {
                // Handle different error scenarios with appropriate status codes
                if (response.message?.toLowerCase().includes('already exists')) {
                    res.status(409).json(response); // 409 Conflict
                } else if (response.message?.toLowerCase().includes('validation')) {
                    res.status(400).json(response); // 400 Bad Request
                } else {
                    res.status(422).json(response); // 422 Unprocessable Entity
                }
                console.log(`Registration failed: ${response.message}`);
            }
            
            console.log("========== SIGNUP CONTROLLER END ==========");
        } catch (error) {
            console.log("========== SIGNUP CONTROLLER ERROR ==========");
            console.error("Error in signup controller:", error);
            
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: "Internal server error during user registration",
                error: `${error}`
            });
        }
    }

    public async signIn(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== SIGNIN CONTROLLER START ==========");
            
            // Forward request directly to service - validation happens there
            const response = await this.authService.signIn(req.body);
            console.log("Service response status:", response.status);
            
            // Check response status and return appropriate HTTP status
            if (response.status === ResponseStatus.SUCCESS && response.data) {
                // Generate JWT token on success - using userId and username
                const token = jwt.sign(
                    { userId: response.data.id, username: response.data.username },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );
                
                res.header('Authorization', `Bearer ${token}`);
                res.status(200).json(response); // 200 OK
                console.log("Authentication successful, response sent with status 200");
            } else {
                // Handle different error scenarios with appropriate status codes
                if (response.message?.toLowerCase().includes('not found')) {
                    res.status(404).json(response); // 404 Not Found
                } else if (response.message?.toLowerCase().includes('invalid password')) {
                    res.status(401).json(response); // 401 Unauthorized
                } else if (response.message?.toLowerCase().includes('validation')) {
                    res.status(400).json(response); // 400 Bad Request
                } else {
                    res.status(422).json(response); // 422 Unprocessable Entity
                }
                console.log(`Authentication failed: ${response.message}`);
            }
            
            console.log("========== SIGNIN CONTROLLER END ==========");
        } catch (error) {
            console.log("========== SIGNIN CONTROLLER ERROR ==========");
            console.error("Error in signin controller:", error);
            
            res.status(500).json({ 
                status: ResponseStatus.FAILED,
                message: "Internal server error during authentication",
                error: `${error}`
            });
        }
    }
}