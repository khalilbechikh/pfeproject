import { injectable, inject } from 'inversify';
import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { TYPES } from '../di/types';
import * as bcrypt from 'bcrypt';
import { sendEmail } from '../utils/email.util';

// Zod schema for user creation
export const CreateUserSchema = z.object({
    username: z
        .string({ required_error: 'Username is required.' })
        .min(3, 'Username must be at least 3 characters.')
        .max(50, 'Username cannot exceed 50 characters.')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Invalid email address.')
        .max(100, 'Email cannot exceed 100 characters.'),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, 'Password must be at least 8 characters long.')
        .max(64, 'Password cannot exceed 64 characters.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one digit.')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.')
    // bio, gitCliPassword, avatar_path removed from creation
});

// Zod schema for user update
export const UpdateUserSchema = z.object({
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
    bio: z.string().optional().nullable(),
    gitCliPassword: z.string().optional().nullable(),
    avatar_path: z.string().optional().nullable(),
    // is_admin is intentionally omitted
});

@injectable()
export class UserService {
    constructor(
        @inject(TYPES.PrismaClient) private prismaClient: PrismaClient,
        @inject(UserRepository) private userRepository: UserRepository
    ) {}

    /**
     * Get a user by ID with optional related data
     * @param id User ID
     * @param relations Optional array of related tables to include
     * @returns ApiResponse with user object or error
     */
    async getUserById(id: number, relations?: string[]): Promise<ApiResponse<users | null>> {
        try {
            const response = await this.userRepository.findById(id, relations);
            
            // Check response status from repository
            if (response.status === ResponseStatus.SUCCESS) {
                return response;
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to retrieve user',
                    error: response.error,
                };
            }
        } catch (error) {
            console.error('Error in UserService.getUserById:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve user',
                error: (error as Error).message,
            };
        }
    }

    /**
     * Get all users with optional related data
     * @param relations Optional array of related tables to include
     * @returns ApiResponse with array of user objects or error
     */
    async getAllUsers(relations?: string[]): Promise<ApiResponse<users[]>> {
        try {
            const response = await this.userRepository.getAllUsers(relations);

            // Check response status from repository
            if (response.status === ResponseStatus.SUCCESS) {
                return response;
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to retrieve users',
                    error: response.error,
                };
            }
        } catch (error) {
            console.error('Error in UserService.getAllUsers:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve users',
                error: (error as Error).message,
            };
        }
    }

    /**
     * Create a new user
     * @param userData User creation data
     * @returns ApiResponse with created user object or error
     */
    async createUser(userData: Prisma.usersCreateInput & { password: string }): Promise<ApiResponse<users>> {
        try {
            // Validate input using Zod
            const validatedData = CreateUserSchema.parse(userData);

            const passwordHash = await this.hashPassword(validatedData.password);

            const userCreateInput: Prisma.usersCreateInput = {
                ...validatedData,
                password_hash: passwordHash,
            };
            // Remove plain password property if present
            delete (userCreateInput as any).password;

            const response = await this.userRepository.createUser(userCreateInput);
            
            // Check response status from repository
            if (response.status === ResponseStatus.SUCCESS) {
                return response;
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to create user',
                    error: response.error,
                };
            }
        } catch (error: any) {
            console.error('Error in UserService.createUser:', error);
            if (error instanceof z.ZodError) {
                // Format Zod errors into a single string
                const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation error',
                    error: errorMessages,
                };
            }
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create user',
                error: error.message,
            };
        }
    }

    /**
     * Update a user by ID
     * @param id User ID
     * @param userData User update data
     * @returns ApiResponse with updated user object or error
     */
    async updateUser(id: number, userData: Prisma.usersUpdateInput & { password?: string }): Promise<ApiResponse<users | null>> {
        try {
            // Validate input using Zod
            const validatedData = UpdateUserSchema.parse(userData);
    
            // Check for username conflict
            if (validatedData.username) {
                const existingUser = await this.userRepository.findByUsername(validatedData.username.toString());
                if (existingUser && existingUser.id !== id) {
                    return {
                        status: ResponseStatus.FAILED,
                        message: 'Username already exists',
                        error: 'Username already exists'
                    };
                }
            }
    
            // Check for email conflict
            if (validatedData.email) {
                const existingUser = await this.userRepository.findByEmail(validatedData.email.toString());
                if (existingUser && existingUser.id !== id) {
                    return {
                        status: ResponseStatus.FAILED,
                        message: 'Email already in use',
                        error: 'Email already in use'
                    };
                }
            }
    
            const updateData: Prisma.usersUpdateInput = { ...validatedData };
    
            // Never update is_admin, even if present in userData
            if ('is_admin' in updateData) {
                delete (updateData as any).is_admin;
            }
    
            if (validatedData.password !== undefined) {
                updateData.password_hash = await this.hashPassword(validatedData.password);
                delete (updateData as any).password;
            }
    
            const response = await this.userRepository.updateUser(id, updateData);
            
            // Check response status from repository
            if (response.status === ResponseStatus.SUCCESS) {
                return response;
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to update user',
                    error: response.error,
                };
            }
        } catch (error: any) {
            console.error('Error in UserService.updateUser:', error);
            if (error instanceof z.ZodError) {
                // Format Zod errors into a single string
                const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Validation error',
                    error: errorMessages,
                    // details: error.errors // Include full validation errors
                };
            }
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update user',
                error: error.message,
            };
        }
    }
    /**
     * Delete a user by ID
     * @param id User ID
     * @returns ApiResponse with deleted user object or error
     */
    async deleteUser(id: number): Promise<ApiResponse<users | null>> {
        try {
            const response = await this.userRepository.deleteUser(id);
            
            // Check response status from repository
            if (response.status === ResponseStatus.SUCCESS) {
                return response;
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to delete user',
                    error: response.error,
                };
            }
        } catch (error) {
            console.error('Error in UserService.deleteUser:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to delete user',
                error: (error as Error).message,
            };
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
            if (user.data){
    
            // Use bcrypt.compare to validate current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.data.password_hash);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }
        }
            // Hash new password using bcrypt
            const newPasswordHash = await this.hashPassword(newPassword);
            await this.userRepository.updateUser(userId, { password_hash: newPasswordHash });
        } catch (error) {
            console.error('Error in UserService.changePassword:', error);
            throw error;
        }
    }
    

    /**
     * Updates a user's two-factor authentication secret
     * @param userId The ID of the user
     * @param secret The generated 2FA secret
     */
    public async updateUserTwoFactorSecret(userId: string, secret: string): Promise<void> {
        const userIdNum = parseInt(userId);
        await this.prismaClient.users.update({
            where: { id: userIdNum },
            data: { 
                twoFactorSecret: secret,
            }
        });
    }

    /**
     * Enables two-factor authentication for a user
     * @param userId The ID of the user
     */
    public async enableTwoFactor(userId: string): Promise<void> {
        const userIdNum = parseInt(userId);
        await this.prismaClient.users.update({
            where: { id: userIdNum },
            data: { 
                twoFactorEnabled: true 
            }
        });
    }

    /**
     * Disables two-factor authentication for a user
     * @param userId The ID of the user
     */
    public async disableTwoFactor(userId: string): Promise<void> {
        const userIdNum = parseInt(userId);
        await this.prismaClient.users.update({
            where: { id: userIdNum },
            data: { 
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });
    }

    /**
     * Find a user by their ID
     * @param userId The ID of the user
     */
    public async findUserById(userId: string) {
        const userIdNum = parseInt(userId);
        return this.prismaClient.users.findUnique({
            where: { id: userIdNum }
        });
    }

    /**
     * Get a user by email
     * @param email User email
     * @returns ApiResponse with user object or error
     */
    async getUserByEmail(email: string) {
        try {
            const user = await this.userRepository.getUserByEmail(email);
            if (user) {
                return {
                    status: ResponseStatus.SUCCESS,
                    message: 'User found',
                    data: user
                };
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User not found',
                    data: null
                };
            }
        } catch (error) {
            console.error('Error in UserService.getUserByEmail:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to retrieve user by email',
                error: (error as Error).message
            };
        }
    }

    /**
     * Suspend or unsuspend a user by ID
     * @param id User ID
     * @param suspend true to suspend, false to unsuspend
     * @returns ApiResponse with updated user object or error
     */
    async suspendUnsuspendUser(id: number, suspend: boolean): Promise<ApiResponse<users | null>> {
        try {
            // Check if user exists
            const user = await this.userRepository.findById(id);
            if (!user.data) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User not found',
                    error: 'User not found'
                };
            }
            // If already in desired state
            if (user.data.suspended === suspend) {
                return {
                    status: ResponseStatus.FAILED,
                    message: suspend
                        ? 'User is already suspended'
                        : 'User is not suspended',
                    data: user.data
                };
            }
            // Update suspension status
            const response = await this.userRepository.suspendUnsuspendUser(id, suspend);

            // Send email notification if update succeeded and user has email
            if (response.status === ResponseStatus.SUCCESS && user.data.email) {
                if (suspend) {
                    await sendEmail(
                        user.data.email,
                        "Account Suspended",
                        `Hello, your account has been suspended by the administrator. You will not be able to access your account until it is restored.`
                    );
                } else {
                    await sendEmail(
                        user.data.email,
                        "Account Restored",
                        `Hello, your account has been restored by the administrator. You can now access your account.`
                    );
                }
            }

            return response;
        } catch (error) {
            console.error('Error in UserService.suspendUnsuspendUser:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to update user suspension status',
                error: (error as Error).message
            };
        }
    }
}