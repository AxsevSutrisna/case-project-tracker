import express, { Request, Response } from 'express';
import cors from 'cors';
import projectRouter from './routes/project.routes';
import taskRouter from './routes/task.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Project Tracker Backend API is running' });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Project Tracker Backend API is running' });
});

app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);

// Error Middleware (Must be registered last)
app.use(errorMiddleware);

export default app;
