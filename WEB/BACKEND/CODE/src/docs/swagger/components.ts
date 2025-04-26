export const components = {
  schemas: {
    User: {
      type: 'object',
      required: ['email', 'username', 'password'],
      properties: {
        id: {
          type: 'string',
          description: 'The auto-generated ID of the user'
        },
        email: {
          type: 'string',
          description: 'User\'s email address (max 100 characters)'
        },
        username: {
          type: 'string',
          description: 'User\'s username (3-50 characters, alphanumeric with underscores)'
        },
        password_hash: {
          type: 'string',
          description: 'User\'s password (hashed)'
        }
      },
      example: {
        id: 'd5fE_asz',
        email: 'user@example.com',
        username: 'johndoe',
        password_hash: '$2b$10$dGhpcyBpcyBhIHNlY3VyZSBoYXNo'
      }
    },
    ApiResponse: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['SUCCESS', 'FAILED'],
          description: 'Response status (SUCCESS or FAILED)'
        },
        message: {
          type: 'string',
          description: 'Human-readable message describing the result'
        },
        data: {
          type: 'object',
          description: 'Response data (present only on successful operations)'
        },
        error: {
          type: 'string',
          description: 'Error message (present only on failed operations)'
        }
      }
    }
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
};