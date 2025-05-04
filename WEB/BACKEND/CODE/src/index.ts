import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import cors from 'cors';

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Explicit origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));




const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', async (req: Request, res: Response) => {
  res.send('Welcome User Managementfff API! Use /api routes to access the API.');
});
app.use('/uploads/avatars', express.static('uploads/avatars'));

// Configure and mount API routes
app.use('/v1/api', configureRoutes());

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});

export default app;
