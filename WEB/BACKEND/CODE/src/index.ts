import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', async (req: Request, res: Response) => {
  res.send('Welcome User Managsdgfgdement API! Use /api routes to access the API.');
});

// Configure and mount API routes
app.use('/v1/api', configureRoutes());

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});

export default app;