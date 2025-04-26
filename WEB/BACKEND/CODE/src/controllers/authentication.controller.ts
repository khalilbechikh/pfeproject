import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { AuthService } from "../services/auth.service";
import jwt from 'jsonwebtoken';
import { ResponseStatus } from "../DTO/apiResponse.DTO";

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

@injectable()
export class AuthenticationController {
    constructor(@inject(AuthService) private authService: AuthService) {}

    public async signUp(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== SIGNUP CONTROLLER START ==========");
            console.log("Request body:", JSON.stringify(req.body));
            
            const response = await this.authService.signUp(req.body);
            console.log("Service response:", JSON.stringify(response));

            if (response.status === ResponseStatus.SUCCESS && response.data) {
                console.log("Registration successful, generating token");
                const token = jwt.sign(
                    { userId: response.data.id, username: response.data.username },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                res.header('Authorization', `Bearer ${token}`);
                res.status(201).json(response);
                console.log("Response sent with status 201");
            } else {
                console.log("Registration failed:", response.message);
                // Handle specific error cases
                if (response.message.includes('already exists')) {
                    res.status(409).json(response); // Conflict - resource already exists
                    console.log("Response sent with status 409 (Conflict)");
                } else if (response.message.includes('validation')) {
                    res.status(400).json(response); // Bad Request - validation error
                    console.log("Response sent with status 400 (Bad Request)");
                } else {
                    // Generic failure case
                    res.status(422).json(response); // Unprocessable Entity
                    console.log("Response sent with status 422 (Unprocessable Entity)");
                }
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
            console.log("Error response sent with status 500");
        }
    }

    public async signIn(req: Request, res: Response): Promise<void> {
        try {
            console.log("========== SIGNIN CONTROLLER START ==========");
            console.log("Request body:", JSON.stringify(req.body));
            
            const response = await this.authService.signIn(req.body);
            console.log("Service response:", JSON.stringify(response));

            if (response.status === ResponseStatus.SUCCESS && response.data) {
                console.log("Authentication successful, generating token");
                const token = jwt.sign(
                    { userId: response.data.id, email: response.data.email },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                res.header('Authorization', `Bearer ${token}`);
                res.status(200).json(response);
                console.log("Token generated and added to header");
            } else {
                console.log("Authentication failed:", response.message);
                
                // Handle specific error cases
                if (response.message.includes('not found')) {
                    res.status(404).json(response); // Not Found
                    console.log("Response sent with status 404 (Not Found)");
                } else if (response.message.includes('Invalid password')) {
                    res.status(401).json(response); // Unauthorized
                    console.log("Response sent with status 401 (Unauthorized)");
                } else if (response.message.includes('validation')) {
                    res.status(400).json(response); // Bad Request - validation error
                    console.log("Response sent with status 400 (Bad Request)");
                } else {
                    // Generic failure case
                    res.status(422).json(response); // Unprocessable Entity
                    console.log("Response sent with status 422 (Unprocessable Entity)");
                }
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
            console.log("Error response sent with status 500");
        }
    }
}
