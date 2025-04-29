import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

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
    constructor(@inject(UserRepository) private userRepository: UserRepository) {
        console.log("auth service constructor called ");
    }

    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    async signUp(userData: CreateUserDto): Promise<ApiResponse<users>> {
        try {
            console.log("signup called in service");
            
            // Step 1: Validate input using Zod first
            let validatedData: z.infer<typeof CreateUserDto>;
            try {
                validatedData = CreateUserDto.parse(userData);
            } catch (validationError) {
                // Return immediately if validation fails
                if (validationError instanceof z.ZodError) {
                    const errorMessages = validationError.errors.map(e => 
                        `${e.path.join('.')}: ${e.message}`).join('; ');
                    return {
                        status: ResponseStatus.FAILED,
                        message: 'Validation error',
                        error: errorMessages,
                    };
                }
                throw validationError;
            }

            // Step 2: Check if user already exists
            const existedUser = await this.userRepository.prisma.users.findUnique({
                where: { email: validatedData.email },
            });

            if (existedUser) {
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User already exists',
                    error: 'User already exists',
                };
            }

            // Step 3: Hash password
            const hashedPassword = await this.hashPassword(validatedData.password);

            // Step 4: Use repository method for user creation
            const response = await this.userRepository.createUser({
                username: validatedData.username,
                email: validatedData.email,
                password_hash: hashedPassword,
            });

            // Step 5: Check response from repository and return appropriate response
            if (response.status === ResponseStatus.SUCCESS) {
                return {
                    status: ResponseStatus.SUCCESS,
                    message: 'User created successfully',
                    data: response.data,
                };
            } else {
                return {
                    status: ResponseStatus.FAILED,
                    message: response.message || 'Failed to create user',
                    error: response.error || 'Unknown error occurred',
                };
            }
        } catch (error) {
            console.error('Error in AuthService.signUp:', error);
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to create user',
                error: `${error}`,
            };
        }
    }

    async signIn(userData: LoginUserDto): Promise<ApiResponse<users>> {
        try {
            console.log("========== AUTH SERVICE SIGNIN START ==========");
            console.log("Login data received:", JSON.stringify(userData));
            
            // Step 1: Validate input using Zod first
            let validatedData: z.infer<typeof LoginUserDto>;
            try {
                validatedData = LoginUserDto.parse(userData);
            } catch (validationError) {
                // Return immediately if validation fails
                if (validationError instanceof z.ZodError) {
                    const errorMessages = validationError.errors.map(e => 
                        `${e.path.join('.')}: ${e.message}`).join('; ');
                    console.log("Validation error:", errorMessages);
                    return {
                        status: ResponseStatus.FAILED,
                        message: 'Validation error',
                        error: errorMessages,
                    };
                }
                throw validationError;
            }
            
            console.log("Data validation successful");

            // Step 2: Find the user
            const user = await this.userRepository.prisma.users.findUnique({
                where: { email: validatedData.email },
            });
            
            console.log("User lookup complete. User found:", user ? "Yes" : "No");

            if (!user) {
                console.log("User not found for email:", validatedData.email);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'User not found',
                    error: 'User not found',
                };
            }

            // Step 3: Validate password
            const isPasswordValid = await this.comparePassword(validatedData.password, user.password_hash);
            console.log("Password validation result:", isPasswordValid ? "Valid" : "Invalid");

            if (!isPasswordValid) {
                console.log("Invalid password provided for user:", validatedData.email);
                return {
                    status: ResponseStatus.FAILED,
                    message: 'Invalid password',
                    error: 'Invalid password',
                };
            }

            // Step 4: Return successful response
            console.log("Login successful for user:", validatedData.email);
            console.log("========== AUTH SERVICE SIGNIN END ==========");
            
            return {
                status: ResponseStatus.SUCCESS,
                message: 'User logged in successfully',
                data: user,
            };
        } catch (error) {
            console.log("========== AUTH SERVICE SIGNIN ERROR ==========");
            console.error("Error in auth service signin:", error);
            
            return {
                status: ResponseStatus.FAILED,
                message: 'Failed to login user',
                error: `${error}`,
            };
        }
    }
}
