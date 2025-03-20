import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { UserService, CreateUserDto, UpdateUserDto } from '../services/user.service';

@injectable()
export class UserController {

    constructor(
        @inject(UserService) private userService: UserService
    ) {}

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
            const userData: CreateUserDto = req.body;

            // Basic validation
            if (!userData.username || !userData.email || !userData.password) {
                res.status(400).json({ error: 'Username, email, and password are required' });
                return;
            }

            const newUser = await this.userService.createUser(userData);
            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error in UserController.createUser:', error);
            res.status(500).json({ error: 'Failed to create user' });
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

            const userData: UpdateUserDto = req.body;

            // Check if there is any data to update
            if (Object.keys(userData).length === 0) {
                res.status(400).json({ error: 'No update data provided' });
                return;
            }

            const updatedUser= await this.userService.updateUser(userId, userData);

            if (!updatedUser) {
                res.status(404).json({ error: 'User not found or update failed' });
                return;
            }

            res.status(200).json(updatedUser);
        } catch (error) {
            console.error('Error in UserController.updateUser:', error);
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
