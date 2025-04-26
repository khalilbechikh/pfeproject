export const authPaths = {
  '/auth/signup': {
    post: {
      summary: 'Register a new user',
      description: 'API endpoint is accessible at /v1/api/auth/signup',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'username', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  maxLength: 100,
                  description: 'Valid email address (max 100 characters)',
                  example: 'user@example.com'
                },
                username: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 50,
                  pattern: '^[a-zA-Z0-9_]+$',
                  description: 'Username (3-50 chars, only letters, numbers and underscores)',
                  example: 'john_doe'
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  maxLength: 64,
                  format: 'password',
                  description: 'Password must:\n- Be 8-64 characters long\n- Contain at least one uppercase letter\n- Contain at least one lowercase letter\n- Contain at least one digit\n- Contain at least one special character',
                  example: 'StrongPass123!'
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User created successfully',
          headers: {
            Authorization: {
              schema: {
                type: 'string'
              },
              description: 'JWT token for authentication'
            }
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              }
            }
          }
        },
        '400': {
          description: 'Validation error or user already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              },
              examples: {
                validationError: {
                  value: {
                    status: 'FAILED',
                    message: 'Validation failed',
                    error: 'Password must be at least 8 characters long.'
                  }
                },
                userExists: {
                  value: {
                    status: 'FAILED',
                    message: 'User already exists',
                    error: 'User already exists'
                  }
                }
              }
            }
          }
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/auth/signin': {
    post: {
      summary: 'Authenticate a user and get a token',
      description: 'API endpoint is accessible at /v1/api/auth/signin',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User\'s email address',
                  example: 'user@example.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'User\'s password (min 8 characters)',
                  example: 'StrongPass123!'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Authentication successful',
          headers: {
            Authorization: {
              schema: {
                type: 'string'
              },
              description: 'JWT token for authentication'
            }
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              },
              example: {
                status: 'SUCCESS',
                message: 'User logged in successfully',
                data: {
                  id: 'd5fE_asz',
                  email: 'user@example.com',
                  username: 'johndoe'
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              },
              example: {
                status: 'FAILED',
                message: 'Validation failed',
                error: 'Email is invalid'
              }
            }
          }
        },
        '401': {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse'
              },
              examples: {
                userNotFound: {
                  value: {
                    status: 'FAILED',
                    message: 'User not found',
                    error: 'User not found'
                  }
                },
                invalidPassword: {
                  value: {
                    status: 'FAILED',
                    message: 'Invalid password',
                    error: 'Invalid password'
                  }
                }
              }
            }
          }
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};