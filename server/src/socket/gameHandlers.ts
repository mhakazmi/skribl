import { Server, Socket } from 'socket.io';
import { rooms, socketToRoom } from './roomHandlers.js';
import {
  validateWordChosen,
  validateStrokeStart,
  validateStrokeMove,
  validateFill,
  rateLimiter,
} from './validate.js';

export function registerGameHandlers(io: Server, socket: Socket): void {

  socket.on('game:word-chosen', (raw: unknown) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'WORD_SELECT') return;
    if (room.currentDrawerId !== socket.id) return;

    const payload = validateWordChosen(raw);
    if (!payload) return;

    room.selectWord(payload.word);
  });

  // Draw events — only relayed when sender is the current drawer in DRAWING state.
  // Rate-limit: burst of 120, refill 60/s — generous for smooth drawing, blocks floods.

  socket.on('draw:stroke-start', (raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    if (!validateStrokeStart(raw)) return;
    socket.to(code).emit('draw:stroke-start', raw);
  });

  socket.on('draw:stroke-move', (raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    if (!validateStrokeMove(raw)) return;
    socket.to(code).emit('draw:stroke-move', raw);
  });

  socket.on('draw:stroke-end', (_raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    socket.to(code).emit('draw:stroke-end', {});
  });

  socket.on('draw:fill', (raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    if (!validateFill(raw)) return;
    socket.to(code).emit('draw:fill', raw);
  });

  socket.on('draw:clear', (_raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    socket.to(code).emit('draw:clear', {});
  });

  socket.on('draw:undo', (_raw: unknown) => {
    if (!rateLimiter.allow(socket.id, 'draw', 120, 60)) return;
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'DRAWING' || room.currentDrawerId !== socket.id) return;
    socket.to(code).emit('draw:undo', {});
  });
}
