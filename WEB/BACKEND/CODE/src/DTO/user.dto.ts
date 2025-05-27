import { z } from 'zod';

// ...existing code...

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

export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;