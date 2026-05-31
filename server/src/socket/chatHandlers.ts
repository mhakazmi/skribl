import { Server, Socket } from 'socket.io';
import { rooms, socketToRoom } from './roomHandlers.js';
import { ChatMessageData } from '../types/game.js';

let msgCounter = 0;

export function registerChatHandlers(io: Server, socket: Socket): void {
  socket.on('chat:message', ({ text }: { text: string }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const trimmed = text.trim().slice(0, 100);
    if (!trimmed) return;

    // Drawers can only chat if not in DRAWING state
    if (room.state === 'DRAWING' && socket.id === room.currentDrawerId) return;

    const guessResult = room.evaluateGuess(socket.id, trimmed);

    const msg: ChatMessageData = {
      id: String(++msgCounter),
      playerId: socket.id,
      playerName: player.name,
      text: guessResult === 'correct' ? trimmed : trimmed,
      type: guessResult,
      timestamp: Date.now(),
    };

    if (guessResult === 'correct') {
      // Only visible to the guesser themselves and as a system message for others
      socket.emit('chat:message', { ...msg, text: `You guessed the word!` });
      socket.to(code).emit('chat:system', {
        id: String(++msgCounter),
        text: `${player.name} guessed the word!`,
        timestamp: Date.now(),
      });
    } else {
      // Normal message — but if it's "close", mark it as such for the sender only
      if (guessResult === 'close') {
        socket.emit('chat:message', { ...msg, type: 'close' });
        // Send to others as normal so they don't see the word
        const normalMsg: ChatMessageData = { ...msg, type: 'normal' };
        socket.to(code).emit('chat:message', normalMsg);
      } else {
        io.to(code).emit('chat:message', msg);
      }
    }
  });
}
