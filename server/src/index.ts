import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import boardRoutes from './routes/boardRoutes';
import taskRoutes from './routes/taskRoutes';
import activityRoutes from './routes/activityRoutes';
import { initSocketServer } from './sockets/boardSocket';
import { publicRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// CORS configuration supporting preview URLs and localhost
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Initialize Socket.io Server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

initSocketServer(io);

// Public health check with rate limiting
app.get('/api/health', publicRateLimiter, (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CollabFlow Enterprise Backend',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler without internal path leakage
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Production Global Error Handler: Never leak stack traces, DB details, or file paths
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[UnhandledServerError]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Always return generic error message to client
  res.status(err.status || 500).json({
    error: 'An unexpected server error occurred. Please try again later.',
  });
});

server.listen(PORT, () => {
  console.log(`🚀 CollabFlow Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
