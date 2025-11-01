import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 3003;

// Load environment variables from .env file
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'fail', db: 'not_connected' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error: ', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Make sure to close Prisma on process exit for clean shutdown
process.on('SIGINT', async () => {
  process.exit();
});
process.on('SIGTERM', async () => {
  process.exit();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});