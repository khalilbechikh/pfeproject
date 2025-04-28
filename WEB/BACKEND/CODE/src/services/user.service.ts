import { injectable, inject } from 'inversify';
import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import {} from 'zod';

// update-user.dto.ts
import { z } from 'zod';
import * as bcrypt from 'bcrypt';


/**
 * ## UpdateUserDto Schema
 *
 * Validates the incoming data for updating a user. All fields are optional.
 *
 * | Field       | Type   | Validation Rules                                      |
 * |-------------|--------|-------------------------------------------------------|
 * | username    | string | 3-50 chars, alphanumeric & underscores only (optional) |
 * | email       | string | Valid email format, max 100 chars (optional)           |
 * | password    | string | 8-64 chars, 1+ uppercase, lowercase, digit, symbol (optional) |
 * | bio         | string | Optional, max 500 chars                                |
 * | avatar_path | string | Optional, max 255 chars                                |
 */
export const UpdateUserDto = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters.')
        .max(50, 'Username cannot exceed 50 characters.')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.')
        .optional(),
    email: z
        .string()
        .email('Invalid email address.')
        .max(100, 'Email cannot exceed 100 characters.')
        .optional(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long.')
        .max(64, 'Password cannot exceed 64 characters.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one digit.')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.')
        .optional(),
    bio: z
        .string()
        .max(500, 'Bio cannot exceed 500 characters.')
        .nullable()
        .optional(),
    avatar_path: z
        .string()
        .regex(/^[a-zA-Z0-9_\-./]+$/, 'Avatar path must be a valid relative path')
        .max(255, 'Avatar path cannot exceed 255 characters.')
        .nullable()
        .optional()
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

// Define a DTO(Data Transfer Object) for user creation
export interface CreateUserDto {
    username: string;
    email: string;
    password: string; // Plain password before hashing
}


@injectable()
export class UserService {
    constructor(@inject(UserRepository) private userRepository: UserRepository) { }

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
            if (userData.username) {
                const existingUser = await this.userRepository.findByUsername(userData.username);
                if (existingUser && existingUser.id !== id) {
                    throw new Error('Username already exists');
                }
            }
    
            if (userData.email) {
                const existingUser = await this.userRepository.findByEmail(userData.email);
                if (existingUser && existingUser.id !== id) {
                    throw new Error('Email already in use');
                }
            }
    
            const updateData: Prisma.usersUpdateInput = {};
    
            if (userData.username) updateData.username = userData.username;
            if (userData.email) updateData.email = userData.email;
            if (userData.password) updateData.password_hash = await this.hashPassword(userData.password);
            if (userData.bio !== undefined) updateData.bio = userData.bio;
            if (userData.avatar_path !== undefined) updateData.avatar_path = userData.avatar_path;
    
            const updatedUser = await this.userRepository.updateUser(id, updateData);
            
            if (!updatedUser) {
                throw new Error('User not found or update failed');
            }
    
            return updatedUser;
        } catch (error) {
            console.error('Error in UserService.updateUser:', error);
            // Don't modify the error message - throw it as-is
            if (error instanceof Error) {
                throw error;
            }
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
        return await bcrypt.hash(password, 10);
    }
    public async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) throw new Error('User not found');
    
            // Use bcrypt.compare to validate current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }
    
            // Hash new password using bcrypt
            const newPasswordHash = await this.hashPassword(newPassword);
            await this.userRepository.updateUser(userId, { password_hash: newPasswordHash });
        } catch (error) {
            console.error('Error in UserService.changePassword:', error);
            throw error;
        }
    }
    
}