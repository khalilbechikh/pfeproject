
/**
 * Interface for authenticated user data stored in JWT token
 * This interface represents the structure of the user object
 * that is available in req.user after JWT authentication
 */
export interface AuthenticatedUser {
    userId: string;
    username: string;
    is_admin: boolean | null;
    iat: number;  // Token issued at time
    exp: number;  // Token expiration time
}

/**
 * Type alias for better readability in function signatures
 * Use this when accepting authenticated user data as a parameter
 */
export type AuthUser = AuthenticatedUser;
