import { Server, Socket } from 'socket.io';
import { rooms, socketToRoom } from './roomHandlers.js';

export function registerGameHandlers(io: Server, socket: Socket): void {
  // Drawer selects a word
  socket.on('game:word-chosen', ({ word }: { word: string }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'WORD_SELECT') return;
    if (room.currentDrawerId !== socket.id) return;
    room.selectWord(word);
  });

  // Proxy draw events — only relay if sender is the current drawer
  const drawEvents = [
    'draw:stroke-start',
    'draw:stroke-move',
    'draw:stroke-end',
    'draw:fill',
    'draw:clear',
    'draw:undo',
  ] as const;

  for (const event of drawEvents) {
    socket.on(event, (data: unknown) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.state !== 'DRAWING') return;
      if (room.currentDrawerId !== socket.id) return;
      socket.to(code).emit(event, data);
    });
  }
}
