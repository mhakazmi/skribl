import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom.js';
import { RoomSettings } from '../types/game.js';

const rooms = new Map<string, GameRoom>();
const socketToRoom = new Map<string, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:create', ({ playerName, settings }: { playerName: string; settings: Partial<RoomSettings> }) => {
    const code = generateRoomCode();
    const roomSettings: RoomSettings = {
      maxPlayers: settings.maxPlayers ?? 8,
      rounds: settings.rounds ?? 3,
      drawTime: settings.drawTime ?? 80,
      customWords: settings.customWords ?? [],
    };

    const room = new GameRoom(code, io, roomSettings);
    rooms.set(code, room);

    const player = room.addPlayer(socket, playerName.trim().slice(0, 20) || 'Anonymous');
    if (!player) {
      socket.emit('room:error', { code: 'CREATE_FAILED', message: 'Could not create room.' });
      return;
    }

    socketToRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('room:created', { roomCode: code, room: room.getRoomState(), playerId: socket.id });
  });

  socket.on('room:join', ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room:error', { code: 'NOT_FOUND', message: 'Room not found.' });
      return;
    }
    if (room.players.size >= room.settings.maxPlayers) {
      socket.emit('room:error', { code: 'FULL', message: 'Room is full.' });
      return;
    }
    if (room.state !== 'WAITING_ROOM') {
      socket.emit('room:error', { code: 'IN_PROGRESS', message: 'Game already in progress.' });
      return;
    }

    const trimmedName = playerName.trim().slice(0, 20) || 'Anonymous';
    const nameTaken = Array.from(room.players.values()).some(
      p => p.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (nameTaken) {
      socket.emit('room:error', { code: 'NAME_TAKEN', message: 'Name already taken in this room.' });
      return;
    }

    const player = room.addPlayer(socket, trimmedName);
    if (!player) {
      socket.emit('room:error', { code: 'FULL', message: 'Room is full.' });
      return;
    }

    socketToRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('room:joined', { room: room.getRoomState(), playerId: socket.id });
    socket.to(code).emit('room:updated', { room: room.getRoomState() });
  });

  socket.on('room:leave', () => {
    handleDisconnect(socket, io, rooms, socketToRoom);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket, io, rooms, socketToRoom);
  });

  socket.on('game:start', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('room:error', { code: 'NOT_HOST', message: 'Only the host can start the game.' });
      return;
    }
    if (room.players.size < 2) {
      socket.emit('room:error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players.' });
      return;
    }
    if (room.state !== 'WAITING_ROOM') return;

    room.startGame();
  });

  socket.on('game:restart', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player?.isHost) return;
    room.restartGame();
  });
}

function handleDisconnect(
  socket: Socket,
  io: Server,
  rooms: Map<string, GameRoom>,
  socketToRoom: Map<string, string>,
): void {
  const code = socketToRoom.get(socket.id);
  if (!code) return;
  socketToRoom.delete(socket.id);

  const room = rooms.get(code);
  if (!room) return;

  room.removePlayer(socket.id);
  socket.leave(code);

  if (room.isEmpty()) {
    setTimeout(() => {
      if (rooms.get(code)?.isEmpty()) {
        rooms.delete(code);
      }
    }, 30000);
    return;
  }

  io.to(code).emit('room:updated', { room: room.getRoomState() });
}

export { rooms, socketToRoom };
