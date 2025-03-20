import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

/**
 * ## CreateUserDto Schema
 *
 * Validates the incoming data for creating a new user.
 *
 * | Field    | Type   | Validation Rules                                                    |
 * |----------|--------|---------------------------------------------------------------------|
 * | username | string | Required, 3-50 chars, alphanumeric & underscores only               |
 * | email    | string | Required, valid email format, max 100 chars                         |
 * | password | string | Required, 8-64 chars, min 1 uppercase, 1 lowercase, 1 digit, 1 symbol |
 *
 * ### Example:
 * ```json
 * {
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "password": "StrongPass123!"
 * }
 * ```
 */
export const CreateUserDto = z.object({
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
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;

/**
 * ## LoginUserDto Schema
 *
 * Validates the incoming data for user login.
 *
 * | Field    | Type   | Validation Rules                        |
 * |----------|--------|----------------------------------------|
 * | email    | string | Required, valid email format          |
 * | password | string | Required, at least 8 characters long  |
 *
 * ### Example:
 * ```json
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 * ```
 */
export const LoginUserDto = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Invalid email address.'),

    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, 'Password must be at least 8 characters long.')
});

export type LoginUserDto = z.infer<typeof LoginUserDto>;

@injectable()
export class AuthService {
    constructor(@inject(UserRepository) private userRepository: UserRepository) {}

    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    async signUp(userData: CreateUserDto): Promise<ApiResponse<users>> {
        try {
            const validatedData = CreateUserDto.parse(userData);

            const existedUser = await this.userRepository.prisma.users.findUnique({
                where: {
                    email: validatedData.email,
                },
            });

            if (existedUser) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User already exists',
                    error: 'User already exists',
                };
            }

            const hashedPassword = await this.hashPassword(validatedData.password);

            const user = await this.userRepository.prisma.users.create({
                data: {
                    username: validatedData.username,
                    email: validatedData.email,
                    password_hash: hashedPassword,
                },
            });

            return {
                status: ResponseStatus.SUCCESS,
                message: 'User created successfully',
                data: user,
            };
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create user',
                error: `${error}`,
            };
        }
    }

    async signIn(userData: LoginUserDto): Promise<ApiResponse<users>> {
        try {
            const validatedData = LoginUserDto.parse(userData);

            const user = await this.userRepository.prisma.users.findUnique({
                where: {
                    email: validatedData.email,
                },
            });

            if (!user) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User not found',
                    error: 'User not found',
                };
            }

            const isPasswordValid = await this.comparePassword(validatedData.password, user.password_hash);

            if (!isPasswordValid) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid password',
                    error: 'Invalid password',
                };
            }

            return {
                status: ResponseStatus.SUCCESS,
                message: 'User logged in successfully',
                data: user,
            };
        } catch (error) {
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to login user',
                error: `${error}`,
            };
        }
    }
}
