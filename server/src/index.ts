/**
 * PRODUCTION NOTE: This app must be served over HTTPS/WSS so all traffic
 * (Socket.IO messages, draw events, chat) is encrypted in transit.
 * On Render, TLS is terminated at the edge automatically.
 * Set CLIENT_ORIGIN to the comma-separated list of allowed frontend origins, e.g.:
 *   CLIENT_ORIGIN=https://skribl.onrender.com
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { registerRoomHandlers } from './socket/roomHandlers.js';
import { registerGameHandlers } from './socket/gameHandlers.js';
import { registerChatHandlers } from './socket/chatHandlers.js';

const isProd = process.env.NODE_ENV === 'production';

// Build origin allow-list: comma-separated CLIENT_ORIGIN env var in production,
// localhost in development. An empty allow-list blocks all cross-origin connections
// (correct for same-origin deployments where the client is served by this process).
const allowedOrigins: string[] = isProd
  ? (process.env.CLIENT_ORIGIN ?? '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ['GET', 'POST'],
};

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, { cors: corsOptions });

app.use(cors({ origin: corsOptions.origin || false }));
app.use(express.json());

// Serve React build in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', socket => {
  console.log(`[socket] connected: ${socket.id}`);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Skribl server running on http://localhost:${PORT}`);
});
