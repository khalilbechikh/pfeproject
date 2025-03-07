import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { configureRoutes } from './routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req: Request, res: Response) => {
  res.send('Welcome to User Management API! Use /api routes to access the API.');
});

// Configure and mount API routes
app.use('/v1/api', configureRoutes());

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;