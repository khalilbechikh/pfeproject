import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { AuthService } from "../services/auth.service";
import jwt from 'jsonwebtoken';
import { ResponseStatus } from "../DTO/apiResponse.DTO";
import {TYPES} from "../di/types";

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

@injectable()
export class AuthenticationController {
    constructor(@inject(TYPES.AuthService) private authService: AuthService) {}

    public async signUp(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== SIGNUP CONTROLLER START ==========");
            
            // Forward request directly to service - validation happens there
            const response = await this.authService.signUp(req.body);
            console.log("Service response status:", response.status);
            
            // Check response status and return appropriate HTTP status
            if (response.status === ResponseStatus.SUCCESS && response.data) {
                // Generate JWT token on success - including userId, username, and is_admin
                const token = jwt.sign(
                    { 
                        userId: response.data.id, 
                        username: response.data.username,
                        is_admin: response.data.is_admin 
                    },
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
                // Generate JWT token on success - including userId, username, and is_admin
                const token = jwt.sign(
                    { 
                        userId: response.data.id, 
                        username: response.data.username,
                        is_admin: response.data.is_admin 
                    },
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

    public async requestPasswordReset(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== REQUEST PASSWORD RESET CONTROLLER START ==========");
            const response = await this.authService.requestPasswordReset(req.body);
            console.log("Service response status:", response.status);

            // Use 200 OK regardless of whether the user was found, as per service logic
            res.status(200).json(response);
            console.log("Password reset request processed, response sent with status 200");
            console.log("========== REQUEST PASSWORD RESET CONTROLLER END ==========");
        } catch (error) {
            console.log("========== REQUEST PASSWORD RESET CONTROLLER ERROR ==========");
            console.error("Error in requestPasswordReset controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: "Internal server error during password reset request",
                error: `${error}`
            });
        }
    }

    public async setPassword(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== SET PASSWORD CONTROLLER START ==========");
            // Note: No token validation here as per requirement
            const response = await this.authService.setPassword(req.body);
            console.log("Service response status:", response.status);

            if (response.status === ResponseStatus.SUCCESS) {
                res.status(200).json(response); // 200 OK
                console.log("Password set successfully, response sent with status 200");
            } else {
                 // Handle different error scenarios with appropriate status codes
                 if (response.message?.toLowerCase().includes('not found')) {
                    res.status(404).json(response); // 404 Not Found
                } else if (response.message?.toLowerCase().includes('validation')) {
                    res.status(400).json(response); // 400 Bad Request
                } else {
                    res.status(422).json(response); // 422 Unprocessable Entity (or 500 if update failed)
                }
                console.log(`Set password failed: ${response.message}`);
            }
            console.log("========== SET PASSWORD CONTROLLER END ==========");
        } catch (error) {
            console.log("========== SET PASSWORD CONTROLLER ERROR ==========");
            console.error("Error in setPassword controller:", error);
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: "Internal server error while setting password",
                error: `${error}`
            });
        }
    }
}
