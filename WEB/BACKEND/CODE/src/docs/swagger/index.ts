import swaggerJsDoc from 'swagger-jsdoc';
import { components } from './components';
import { authPaths } from './paths/auth';

// Swagger configuration options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'User Management API Documentation',
    },
    servers: [
      {
        url: '/v1/api',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'User authentication API'
      },
      // Add more tags as needed for other controllers
    ],
    components,
    paths: {
      ...authPaths,
      // Add more paths as you develop other API endpoints
    }
  },
  apis: [], // We're not using file scanning as we're defining everything explicitly
};

// Generate the Swagger specification
const swaggerSpec = swaggerJsDoc(swaggerOptions);

export default swaggerSpec;