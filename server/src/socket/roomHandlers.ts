import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom.js';
import { RoomSettings } from '../types/game.js';
import {
  validateCreate,
  validateJoin,
  hashPassword,
  rateLimiter,
} from './validate.js';

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

  socket.on('room:create', async (raw: unknown) => {
    // Rate-limit: burst of 3, refill 1 per 60 s — prevents rapid room spam
    if (!rateLimiter.allow(socket.id, 'room', 3, 1 / 60)) return;

    const payload = validateCreate(raw);
    if (!payload) return;

    const { playerName, password, settings: s } = payload;
    const code = generateRoomCode();

    const roomSettings: RoomSettings = {
      maxPlayers: s.maxPlayers,
      rounds: s.rounds,
      drawTime: s.drawTime,
      customWords: s.customWords,
      hasPassword: password.length > 0,
    };

    try {
      let pwHash: Buffer | null = null;
      let pwSalt: Buffer | null = null;
      if (password) {
        const result = await hashPassword(password);
        pwHash = result.hash;
        pwSalt = result.salt;
      }

      const room = new GameRoom(code, io, roomSettings, pwHash, pwSalt);
      rooms.set(code, room);

      const player = room.addPlayer(socket, playerName);
      if (!player) {
        socket.emit('room:error', { code: 'CREATE_FAILED', message: 'Could not create room.' });
        return;
      }

      socketToRoom.set(socket.id, code);
      socket.join(code);
      socket.emit('room:created', { roomCode: code, room: room.getRoomState(), playerId: socket.id });
    } catch (err) {
      console.error('[room:create] error:', err);
      socket.emit('room:error', { code: 'CREATE_FAILED', message: 'Could not create room.' });
    }
  });

  socket.on('room:join', async (raw: unknown) => {
    const payload = validateJoin(raw);
    if (!payload) return;

    const { roomCode, playerName, password } = payload;
    const room = rooms.get(roomCode);

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

    // Password check
    if (room.settings.hasPassword) {
      if (!password) {
        socket.emit('room:error', { code: 'PASSWORD_REQUIRED', message: 'This room requires a password.' });
        return;
      }
      try {
        const ok = await room.verifyPassword(password);
        if (!ok) {
          socket.emit('room:error', { code: 'WRONG_PASSWORD', message: 'Incorrect room password.' });
          return;
        }
      } catch (err) {
        console.error('[room:join] password verify error:', err);
        socket.emit('room:error', { code: 'WRONG_PASSWORD', message: 'Incorrect room password.' });
        return;
      }
    }

    const nameTaken = Array.from(room.players.values()).some(
      p => p.name.toLowerCase() === playerName.toLowerCase(),
    );
    if (nameTaken) {
      socket.emit('room:error', { code: 'NAME_TAKEN', message: 'Name already taken in this room.' });
      return;
    }

    const player = room.addPlayer(socket, playerName);
    if (!player) {
      socket.emit('room:error', { code: 'FULL', message: 'Room is full.' });
      return;
    }

    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);
    socket.emit('room:joined', { room: room.getRoomState(), playerId: socket.id });
    socket.to(roomCode).emit('room:updated', { room: room.getRoomState() });
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
  rateLimiter.clear(socket.id); // clean up per-socket rate-limit state

  const code = socketToRoom.get(socket.id);
  if (!code) return;
  socketToRoom.delete(socket.id);

  const room = rooms.get(code);
  if (!room) return;

  room.removePlayer(socket.id);
  socket.leave(code);

  if (room.isEmpty()) {
    setTimeout(() => {
      if (rooms.get(code)?.isEmpty()) rooms.delete(code);
    }, 30000);
    return;
  }

  io.to(code).emit('room:updated', { room: room.getRoomState() });
}

export { rooms, socketToRoom };
