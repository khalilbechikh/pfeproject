import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from src/index.ts!');
});

app.listen(port, () => {
  console.log(`Server running in src/index.ts at http://localhost:${port}`);
});

export default app; // Optional: Export the app instance if you need to use it elsewhere