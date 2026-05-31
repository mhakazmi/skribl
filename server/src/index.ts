import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { registerRoomHandlers } from './socket/roomHandlers.js';
import { registerGameHandlers } from './socket/gameHandlers.js';
import { registerChatHandlers } from './socket/chatHandlers.js';

const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

const corsOptions = isProd
  ? { origin: '*' }
  : { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] };

const io = new Server(httpServer, {
  cors: { ...corsOptions, methods: ['GET', 'POST'] },
});

app.use(cors());
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
