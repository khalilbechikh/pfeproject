import { z } from 'zod';

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

// Zod schema for user login
export const LoginUserSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Invalid email address.'),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, 'Password must be at least 8 characters long.')
});
