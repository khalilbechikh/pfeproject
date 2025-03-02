import 'reflect-metadata'; // (1) Ensure reflect-metadata is imported
import express, { Request, Response } from 'express'; // (2) Import Express
import container from './di/inversify.config'; // (3) Import InversifyJS container
import { UserService } from './services/user.service'; // (4) Import UserService
import { UserController } from './controllers/user.controller'; // (5) Import UserController
import { configureRoutes } from './routes'; // (6) Import routes configuration

const app = express(); // (7) Initialize Express app
const port = process.env.PORT || 5000; // (8) Define port

// Middleware for parsing JSON payloads
app.use(express.json());

// Middleware for parsing URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', async (req: Request, res: Response) => {
  res.send('Welcome to User Management API! Use /api routes to access the API.');
});

// Configure and mount API routes
app.use('/api', configureRoutes());

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;