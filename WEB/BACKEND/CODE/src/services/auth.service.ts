import { Prisma, users } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { inject, injectable } from 'inversify';
import { ApiResponse, ResponseStatus } from '../DTO/apiResponse.DTO';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken'; // Import jwt
import * as nodemailer from 'nodemailer'; // Import nodemailer

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

export const RequestPasswordResetDto = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Invalid email address.'),
});

export type RequestPasswordResetDto = z.infer<typeof RequestPasswordResetDto>;

const passwordValidation = CreateUserDto.shape.password;

export const SetPasswordDto = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Invalid email address.'),
    newPassword: passwordValidation,
});

export type SetPasswordDto = z.infer<typeof SetPasswordDto>;

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';
const EMAIL_USER = 'jobran628@gmail.com';
const EMAIL_APP_PASSWORD = 'dmlg kzwu chts pbra';
const FRONTEND_URL = 'http://localhost:5173';

@injectable()
export class AuthService {
    private mailerTransporter;

    constructor(@inject(UserRepository) private userRepository: UserRepository) {
        console.log("auth service constructor called ");
        this.mailerTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_APP_PASSWORD,
            },
        });
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
            
            let validatedData: z.infer<typeof CreateUserDto>;
            try {
                validatedData = CreateUserDto.parse(userData);
            } catch (validationError) {
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

            const hashedPassword = await this.hashPassword(validatedData.password);

            const response = await this.userRepository.createUser({
                username: validatedData.username,
                email: validatedData.email,
                password_hash: hashedPassword,
            });

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
            
            let validatedData: z.infer<typeof LoginUserDto>;
            try {
                validatedData = LoginUserDto.parse(userData);
            } catch (validationError) {
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

    async requestPasswordReset(data: RequestPasswordResetDto): Promise<ApiResponse<null>> {
        try {
            console.log("========== AUTH SERVICE REQUEST PASSWORD RESET START ==========");
            let validatedData: RequestPasswordResetDto;
            try {
                validatedData = RequestPasswordResetDto.parse(data);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                    const errorMessages = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                    return { status: ResponseStatus.FAILED, message: 'Validation error', error: errorMessages };
                }
                throw validationError;
            }

            const user = await this.userRepository.prisma.users.findUnique({
                where: { email: validatedData.email },
            });

            if (!user) {
                console.log("Password reset requested for non-existent email:", validatedData.email);
                return { status: ResponseStatus.SUCCESS, message: 'If an account with that email exists, a password reset link has been sent.' };
            }

            const resetToken = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '10m' }
            );

            const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

            const mailOptions = {
                from: EMAIL_USER,
                to: user.email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes:

${resetLink}`,
                html: `<p>You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
            };

            await this.mailerTransporter.sendMail(mailOptions);
            console.log("Password reset email sent to:", user.email);
            console.log("========== AUTH SERVICE REQUEST PASSWORD RESET END ==========");

            return { status: ResponseStatus.SUCCESS, message: 'If an account with that email exists, a password reset link has been sent.' };

        } catch (error) {
            console.error("Error in requestPasswordReset service:", error);
            return { status: ResponseStatus.FAILED, message: 'Failed to process password reset request.', error: `${error}` };
        }
    }

    async setPassword(data: SetPasswordDto): Promise<ApiResponse<null>> {
        try {
            console.log("========== AUTH SERVICE SET PASSWORD START ==========");
            let validatedData: SetPasswordDto;
            try {
                validatedData = SetPasswordDto.parse(data);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                    const errorMessages = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                    return { status: ResponseStatus.FAILED, message: 'Validation error', error: errorMessages };
                }
                throw validationError;
            }

            const user = await this.userRepository.prisma.users.findUnique({
                where: { email: validatedData.email },
            });

            if (!user) {
                console.log("Attempt to set password for non-existent email:", validatedData.email);
                return { status: ResponseStatus.FAILED, message: 'User not found', error: 'User with this email does not exist.' };
            }

            const hashedPassword = await this.hashPassword(validatedData.newPassword);

            const updateResponse = await this.userRepository.updateUser(user.id, {
                password_hash: hashedPassword,
            });

            if (updateResponse.status !== ResponseStatus.SUCCESS) {
                console.error("Failed to update password for user:", user.email, updateResponse.error);
                return { status: ResponseStatus.FAILED, message: 'Failed to update password.', error: updateResponse.error };
            }

            console.log("Password successfully updated for user:", user.email);
            console.log("========== AUTH SERVICE SET PASSWORD END ==========");
            return { status: ResponseStatus.SUCCESS, message: 'Password updated successfully.' };

        } catch (error) {
            console.error("Error in setPassword service:", error);
            return { status: ResponseStatus.FAILED, message: 'Failed to set new password.', error: `${error}` };
        }
    }
}
