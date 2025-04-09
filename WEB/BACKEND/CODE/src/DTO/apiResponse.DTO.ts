// Defines possible response statuses
export enum ResponseStatus {
    SUCCESS = 'success',
    FAILED = 'failed'
}
//test
// Generic interface for API responses
export interface ApiResponse<T = any> {
    status: ResponseStatus;     // Will be either 'success' or 'failed'
    message: string;           // A descriptive message about the operation
    data?: T;                  // Optional generic data field, can hold any type
    error?: string;            // Optional error message, typically used when status is FAILED
}