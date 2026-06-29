/**
 * Centralised validation, sanitisation, rate-limiting and password helpers.
 * Uses Node's built-in `crypto` and `util` only — no external dependencies.
 */
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// ── Sanitisation ──────────────────────────────────────────────────────────────

/** Strip ASCII control characters and HTML angle brackets from user-supplied text. */
export function sanitise(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, '').replace(/[<>]/g, '');
}

// ── Type guards ───────────────────────────────────────────────────────────────

export const isStr = (v: unknown): v is string => typeof v === 'string';
export const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v);
export const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

// ── Payload validators ────────────────────────────────────────────────────────

export interface ValidCreatePayload {
  playerName: string;
  password: string; // empty string → no password
  settings: { maxPlayers: number; rounds: number; drawTime: number; customWords: string[] };
}

export function validateCreate(raw: unknown): ValidCreatePayload | null {
  if (!isObj(raw)) return null;
  const playerName =
    sanitise(isStr(raw.playerName) ? raw.playerName : '').trim().slice(0, 20) || 'Anonymous';
  const password = isStr(raw.password) ? raw.password.slice(0, 100) : '';
  const s = isObj(raw.settings) ? raw.settings : {};
  return {
    playerName,
    password,
    settings: {
      maxPlayers:
        isNum(s.maxPlayers) && s.maxPlayers >= 2 && s.maxPlayers <= 12 ? s.maxPlayers : 8,
      rounds:
        isNum(s.rounds) && s.rounds >= 1 && s.rounds <= 10 ? s.rounds : 3,
      drawTime:
        isNum(s.drawTime) && s.drawTime >= 15 && s.drawTime <= 180 ? s.drawTime : 80,
      customWords: Array.isArray(s.customWords)
        ? (s.customWords as unknown[])
            .filter(isStr)
            .map(w => sanitise(w).slice(0, 30))
            .slice(0, 50)
        : [],
    },
  };
}

export interface ValidJoinPayload { roomCode: string; playerName: string; password: string; }

export function validateJoin(raw: unknown): ValidJoinPayload | null {
  if (!isObj(raw)) return null;
  if (!isStr(raw.roomCode)) return null;
  const roomCode = raw.roomCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
  if (roomCode.length !== 4) return null;
  const playerName =
    sanitise(isStr(raw.playerName) ? raw.playerName : '').trim().slice(0, 20) || 'Anonymous';
  const password = isStr(raw.password) ? raw.password.slice(0, 100) : '';
  return { roomCode, playerName, password };
}

export function validateChat(raw: unknown): { text: string } | null {
  if (!isObj(raw) || !isStr(raw.text)) return null;
  const text = sanitise(raw.text).trim().slice(0, 100);
  return text ? { text } : null;
}

export function validateWordChosen(raw: unknown): { word: string } | null {
  if (!isObj(raw) || !isStr(raw.word)) return null;
  const word = raw.word.trim().slice(0, 50);
  return word ? { word } : null;
}

export function validateStrokeStart(raw: unknown): boolean {
  if (!isObj(raw)) return false;
  return (
    isNum(raw.x) && raw.x >= 0 && raw.x <= 1 &&
    isNum(raw.y) && raw.y >= 0 && raw.y <= 1 &&
    isStr(raw.color) && raw.color.length <= 20 &&
    isNum(raw.size) && raw.size > 0 && raw.size <= 100
  );
}

export function validateStrokeMove(raw: unknown): boolean {
  if (!isObj(raw) || !Array.isArray(raw.points) || raw.points.length > 500) return false;
  return (raw.points as unknown[]).every(
    p => isObj(p) && isNum(p.x) && p.x >= 0 && p.x <= 1 &&
               isNum(p.y) && p.y >= 0 && p.y <= 1,
  );
}

export function validateFill(raw: unknown): boolean {
  if (!isObj(raw)) return false;
  return (
    isNum(raw.x) && raw.x >= 0 && raw.x <= 1 &&
    isNum(raw.y) && raw.y >= 0 && raw.y <= 1 &&
    isStr(raw.color) && raw.color.length <= 20
  );
}

// ── Token-bucket rate limiter ─────────────────────────────────────────────────

interface Bucket { tokens: number; lastMs: number; capacity: number; refillPerMs: number; }

class RateLimiter {
  private buckets = new Map<string, Map<string, Bucket>>();

  /**
   * Returns true if the event should be allowed, false if it should be dropped.
   * @param socketId  - the socket to track
   * @param group     - logical event group (e.g. 'chat', 'draw', 'room')
   * @param capacity  - maximum burst size (tokens)
   * @param refillPerSecond - steady-state refill rate (tokens / second)
   */
  allow(socketId: string, group: string, capacity: number, refillPerSecond: number): boolean {
    let groups = this.buckets.get(socketId);
    if (!groups) { groups = new Map(); this.buckets.set(socketId, groups); }

    const now = Date.now();
    let b = groups.get(group);
    if (!b) {
      b = { tokens: capacity, lastMs: now, capacity, refillPerMs: refillPerSecond / 1000 };
      groups.set(group, b);
    }

    b.tokens = Math.min(b.capacity, b.tokens + (now - b.lastMs) * b.refillPerMs);
    b.lastMs = now;

    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  }

  clear(socketId: string): void { this.buckets.delete(socketId); }
}

export const rateLimiter = new RateLimiter();

// ── Password helpers ──────────────────────────────────────────────────────────

const scryptAsync = promisify(scrypt);

export async function hashPassword(plain: string): Promise<{ hash: Buffer; salt: Buffer }> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(plain, salt, 64)) as Buffer;
  return { hash, salt };
}

export async function verifyPassword(
  plain: string,
  hash: Buffer,
  salt: Buffer,
): Promise<boolean> {
  try {
    const derived = (await scryptAsync(plain, salt, 64)) as Buffer;
    return timingSafeEqual(hash, derived);
  } catch {
    return false;
  }
}
