import { injectable, inject } from 'inversify';
import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';

// Define a DTO (Data Transfer Object) for user creation
export interface CreateUserDto {
    username: string;
    email: string;
    password: string; // Plain password before hashing
}

// Define a DTO for user updates
export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string; // Plain password before hashing
}

@injectable()
export class UserService {
    constructor(
        @inject(UserRepository) private userRepository: UserRepository
    ) {}

    /**
     * Get a user by ID with optional related data
     * @param id User ID
     * @param relations Optional array of related tables to include
     * @returns User object or null if not found
     */
    async getUserById(id: number, relations?: string[]): Promise<users | null> {
        try {
            return await this.userRepository.findById(id, relations);
        } catch (error) {
            console.error('Error in UserService.getUserById:', error);
            throw new Error('Failed to retrieve user');
        }
    }

    /**
     * Create a new user
     * @param userData User creation data
     * @returns Created user object
     */
    async createUser(userData: CreateUserDto): Promise<users> {
        try {
            // In a real application, you would hash the password here
            const passwordHash = await this.hashPassword(userData.password);

            const userCreateInput: Prisma.usersCreateInput = {
                username: userData.username,
                email: userData.email,
                password_hash: passwordHash,
            };

            return await this.userRepository.createUser(userCreateInput);
        } catch (error) {
            console.error('Error in UserService.createUser:', error);
            throw new Error('Failed to create user');
        }
    }

    /**
     * Update a user by ID
     * @param id User ID
     * @param userData User update data
     * @returns Updated user object or null if update failed
     */
    async updateUser(id: number, userData: UpdateUserDto): Promise<users | null> {
        try {
            const updateData: Prisma.usersUpdateInput = {};

            if (userData.username) {
                updateData.username = userData.username;
            }

            if (userData.email) {
                updateData.email = userData.email;
            }

            if (userData.password) {
                updateData.password_hash = await this.hashPassword(userData.password);
            }

            return await this.userRepository.updateUser(id, updateData);
        } catch (error) {
            console.error('Error in UserService.updateUser:', error);
            throw new Error('Failed to update user');
        }
    }

    /**
     * Delete a user by ID
     * @param id User ID
     * @returns Deleted user object or null if deletion failed
     */
    async deleteUser(id: number): Promise<users | null> {
        try {
            return await this.userRepository.deleteUser(id);
        } catch (error) {
            console.error('Error in UserService.deleteUser:', error);
            throw new Error('Failed to delete user');
        }
    }

    /**
     * Dummy password hashing function (in a real app, use bcrypt or similar)
     * @param password Plain text password
     * @returns Hashed password
     */
    private async hashPassword(password: string): Promise<string> {
        // In a real application, use a proper password hashing library like bcrypt
        // This is just a placeholder for demonstration purposes
        return `hashed_${password}_${Date.now()}`;
    }
}