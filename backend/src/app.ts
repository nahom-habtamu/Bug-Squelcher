import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import bugRouter from './bugs/bug.routes';
import { openApiSpec } from './openapi';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

// API routes
app.use('/api/bugs', bugRouter);

// API docs
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Global error handler — must be last
app.use(errorMiddleware);

export default app;
