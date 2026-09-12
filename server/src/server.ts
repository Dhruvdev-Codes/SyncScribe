import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

// Static client hosting (if client is built)
const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];

const foundClientDist = clientDistCandidates.find((p) =>
  fs.existsSync(path.join(p, 'index.html'))
);

if (foundClientDist) {
  console.log(`📦 Serving static client from: ${foundClientDist}`);
  app.use(express.static(foundClientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(foundClientDist, 'index.html'));
  });
} else {
  // Root route fallback if client is not packaged
  app.get('/', (_req, res) => {
    res.json({
      name: 'SyncScribe Collaboration & AI Server',
      version: '1.0.0',
      endpoints: '/api',
      status: 'online',
    });
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SyncScribe Server running on port ${PORT}`);
  console.log(`📡 WebSocket Gateway ready for live sync`);
  console.log(`🔌 Client URL configured: ${CLIENT_URL}`);
  console.log(`=========================================`);
});
