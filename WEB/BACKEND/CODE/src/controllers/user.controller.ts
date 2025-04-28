import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { UserService } from '../services/user.service'; // Keep UserService import
import { Prisma } from '@prisma/client'; // Import Prisma
import { ResponseStatus } from '../DTO/apiResponse.DTO'; // Import ResponseStatus

@injectable()
export class UserController {

    constructor(
        @inject(UserService) private userService: UserService
    ) {}

    /**
     * Get all users
     * @param req Express request object
     * @param res Express response object
     */
    getAllUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract optional relations from query parameters
            let relations: string[] | undefined;
            if (req.query.relations && typeof req.query.relations === 'string') {
                relations = req.query.relations.split(',');
            }

            const usersResponse = await this.userService.getAllUsers(relations);

            // Check the status from the service response
            if (usersResponse.status === ResponseStatus.SUCCESS) {
                res.status(200).json(usersResponse);
            } else {
                // Use the message and error from the service response
                res.status(500).json({
                    status: usersResponse.status,
                    message: usersResponse.message,
                    error: usersResponse.error
                });
            }
        } catch (error) {
            console.error('Error in UserController.getAllUsers:', error);
            // Generic fallback error
            res.status(500).json({
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve users',
                error: (error instanceof Error) ? error.message : 'Unknown error'
            });
        }
    };

    /**
     * Get a user by ID
     * @param req Express request object
     * @param res Express response object
     */
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id, 10);

            // Check if ID is a valid number
            if (isNaN(userId)) {
                res.status(400).json({ error: 'Invalid user ID' });
                return;
            }

            // Extract optional relations from query parameters
            let relations: string[] | undefined;
            if (req.query.relations && typeof req.query.relations === 'string') {
                relations = req.query.relations.split(',');
            }

            const user = await this.userService.getUserById(userId, relations);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.status(200).json(user);
        } catch (error) {
            console.error('Error in UserController.getUserById:', error);
            res.status(500).json({ error: 'Failed to retrieve user' });
        }
    };

    /**
     * Create a new user
     * @param req Express request object
     * @param res Express response object
     */
    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            // Expect username, email, password in the body
            // The type here reflects the expected input structure, not necessarily the final DB structure
            const userData = req.body;

            // Basic validation for required fields including raw password
            if (!userData.username || !userData.email || !userData.password) { // Check for raw password
                res.status(400).json({ error: 'Username, email, and password are required' });
                return;
            }

            // Pass the raw userData (containing password) to the service.
            // The service is responsible for validation (e.g., with Zod) and hashing.
            const newUser = await this.userService.createUser(userData);
            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error in UserController.createUser:', error);
            // Check if the error is from the service (e.g., validation) and return appropriate status
            // This part depends on how userService.createUser signals errors
            if (error instanceof Error && error.message.includes('Validation failed')) { // Example check
                 res.status(400).json({ error: error.message });
            } else if (error instanceof Error && error.message.includes('already exists')) { // Example check
                 res.status(409).json({ error: error.message });
            }
             else {
                res.status(500).json({ error: 'Failed to create user' });
            }
        }
    };

    /**
     * Update a user by ID
     * @param req Express request object
     * @param res Express response object
     */
    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id, 10);

            // Check if ID is a valid number
            if (isNaN(userId)) {
                res.status(400).json({ error: 'Invalid user ID' });
                return;
            }

            // Use Prisma.usersUpdateInput type - this is likely correct for updates
            // as we usually don't update the password directly here or expect raw password for updates
            const userData: Prisma.usersUpdateInput = req.body;

            // Check if there is any data to update
            if (Object.keys(userData).length === 0) {
                res.status(400).json({ error: 'No update data provided' });
                return;
            }

            // Service call remains the same, assuming service handles validation
            const updatedUser= await this.userService.updateUser(userId, userData);

            if (!updatedUser) {
                res.status(404).json({ error: 'User not found or update failed' });
                return;
            }

            res.status(200).json(updatedUser);
        } catch (error) {
            console.error('Error in UserController.updateUser:', error);
             // Add more specific error handling based on service responses if needed
            res.status(500).json({ error: 'Failed to update user' });
        }
    };

    /**
     * Delete a user by ID
     * @param req Express request object
     * @param res Express response object
     */
    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id, 10);

            // Check if ID is a valid number
            if (isNaN(userId)) {
                res.status(400).json({ error: 'Invalid user ID' });
                return;
            }

            const deletedUser = await this.userService.deleteUser(userId);

            if (!deletedUser) {
                res.status(404).json({ error: 'User not found or deletion failed' });
                return;
            }

            res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
        } catch (error) {
            console.error('Error in UserController.deleteUser:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    };
}
