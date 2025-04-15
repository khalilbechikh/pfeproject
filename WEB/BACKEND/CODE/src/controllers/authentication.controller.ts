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
            console.log("singup called");
            const response = await this.authService.signUp(req.body);
            if (response.status === ResponseStatus.SUCCESS && response.data) {
                const token = jwt.sign(
                    { userId: response.data.id, username: response.data.username },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );
                res.header('Authorization', `Bearer ${token}`);
            }

            res.status(201).json(response);
        } catch (error) {
            res.status(500).json({ error: "Failed to create user c " });
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
                console.log("Token generated and added to header");
            } else {
                console.log("Authentication failed:", response.message);
            }

            res.status(200).json(response);
            console.log("Response sent successfully");
            console.log("========== SIGNIN CONTROLLER END ==========");
        } catch (error) {
            console.log("========== SIGNIN CONTROLLER ERROR ==========");
            console.error("Error in signin controller:", error);
            res.status(500).json({ error: "Failed to login user" });
            console.log("Error response sent");
        }
    }
}
