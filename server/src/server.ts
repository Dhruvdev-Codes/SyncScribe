import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { initSocketManager } from './sockets/socketManager';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Collaboration Manager
initSocketManager(io);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'SyncScribe Collaboration & AI Server',
    version: '1.0.0',
    endpoints: '/api',
    status: 'online',
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SyncScribe Server running on port ${PORT}`);
  console.log(`📡 WebSocket Gateway ready for live sync`);
  console.log(`🔌 Client URL configured: ${CLIENT_URL}`);
  console.log(`=========================================`);
});
