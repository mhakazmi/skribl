import { Server, Socket } from 'socket.io';
import { rooms, socketToRoom } from './roomHandlers.js';
import { ChatMessageData } from '../types/game.js';
import { validateChat, rateLimiter } from './validate.js';

let msgCounter = 0;

export function registerChatHandlers(io: Server, socket: Socket): void {
  socket.on('chat:message', (raw: unknown) => {
    // Rate-limit: burst of 6, refill 1 per second
    if (!rateLimiter.allow(socket.id, 'chat', 6, 1)) return;

    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const payload = validateChat(raw);
    if (!payload) return;

    // Drawers cannot chat during DRAWING state
    if (room.state === 'DRAWING' && socket.id === room.currentDrawerId) return;

    const guessResult = room.evaluateGuess(socket.id, payload.text);

    const msg: ChatMessageData = {
      id: String(++msgCounter),
      playerId: socket.id,
      playerName: player.name,
      text: payload.text,
      type: guessResult,
      timestamp: Date.now(),
    };

    if (guessResult === 'correct') {
      socket.emit('chat:message', { ...msg, text: 'You guessed the word!' });
      socket.to(code).emit('chat:system', {
        id: String(++msgCounter),
        text: `${player.name} guessed the word!`,
        timestamp: Date.now(),
      });
    } else if (guessResult === 'close') {
      socket.emit('chat:message', { ...msg, type: 'close' });
      socket.to(code).emit('chat:message', { ...msg, type: 'normal' });
    } else {
      io.to(code).emit('chat:message', msg);
    }
  });
}
