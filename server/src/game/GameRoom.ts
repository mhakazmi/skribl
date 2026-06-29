import { Server, Socket } from 'socket.io';
import { Player, RoomSettings, RoomState, GameState, ScoreDelta } from '../types/game.js';
import { RoundManager } from './RoundManager.js';
import { calculateGuesserScore, calculateDrawerBonus } from './ScoreManager.js';
import { pickWords, resetUsed } from './WordBank.js';
import { verifyPassword as _verifyPassword } from '../socket/validate.js';

const AVATAR_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4F86F7',
  '#C77DFF', '#FF9F43', '#48DBFB', '#FF6EB4',
];

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function buildHint(word: string, revealed: Set<number>): string {
  return word
    .split('')
    .map((c, i) => (c === ' ' ? '  ' : revealed.has(i) ? c : '_'))
    .join(' ');
}

export class GameRoom {
  readonly code: string;
  private io: Server;
  players: Map<string, Player> = new Map();
  settings: RoomSettings;
  state: GameState = 'WAITING_ROOM';
  currentRound = 0;
  drawOrder: string[] = [];
  currentDrawerIndex = -1;
  currentWord: string | null = null;
  revealedIndices: Set<number> = new Set();
  scores: Map<string, number> = new Map();
  guessedPlayers: Set<string> = new Set();
  turnStartTime = 0;
  private roundManager: RoundManager = new RoundManager();
  private wordSelectTimeout: ReturnType<typeof setTimeout> | null = null;
  private roundEndTimeout: ReturnType<typeof setTimeout> | null = null;
  private colorIndex = 0;

  constructor(
    code: string,
    io: Server,
    settings: RoomSettings,
    private passwordHash: Buffer | null = null,
    private passwordSalt: Buffer | null = null,
  ) {
    this.code = code;
    this.io = io;
    this.settings = settings;
  }

  /** Returns true if the supplied plaintext matches the room password (timing-safe). */
  async verifyPassword(plain: string): Promise<boolean> {
    if (!this.passwordHash || !this.passwordSalt) return true;
    return _verifyPassword(plain, this.passwordHash, this.passwordSalt);
  }

  addPlayer(socket: Socket, name: string): Player | null {
    if (this.players.size >= this.settings.maxPlayers) return null;
    const isHost = this.players.size === 0;
    const player: Player = {
      id: socket.id,
      name,
      avatarColor: AVATAR_COLORS[this.colorIndex % AVATAR_COLORS.length],
      score: 0,
      isHost,
      isConnected: true,
    };
    this.colorIndex++;
    this.players.set(socket.id, player);
    this.scores.set(socket.id, 0);
    return player;
  }

  removePlayer(socketId: string): void {
    const player = this.players.get(socketId);
    if (!player) return;
    this.players.delete(socketId);
    this.scores.delete(socketId);

    // Migrate host
    if (player.isHost && this.players.size > 0) {
      const next = this.players.values().next().value as Player;
      next.isHost = true;
    }

    // If drawer disconnects during drawing, end turn
    if (
      (this.state === 'DRAWING' || this.state === 'WORD_SELECT') &&
      this.currentDrawerId === socketId
    ) {
      this.endTurn('drawer-disconnected');
    }

    // Check if all remaining non-drawers have guessed
    if (this.state === 'DRAWING') {
      this.checkAllGuessed();
    }
  }

  get currentDrawerId(): string | null {
    if (this.drawOrder.length === 0 || this.currentDrawerIndex < 0) return null;
    return this.drawOrder[this.currentDrawerIndex] ?? null;
  }

  get currentDrawer(): Player | null {
    const id = this.currentDrawerId;
    return id ? (this.players.get(id) ?? null) : null;
  }

  getRoomState(): RoomState {
    return {
      code: this.code,
      players: Array.from(this.players.values()),
      settings: this.settings,
      state: this.state,
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds,
      currentDrawerId: this.currentDrawerId,
      hint: this.currentWord
        ? buildHint(this.currentWord, this.revealedIndices)
        : null,
      timeLeft: null,
    };
  }

  startGame(): void {
    this.state = 'WAITING_ROOM';
    // Reset scores
    this.players.forEach(p => {
      p.score = 0;
      this.scores.set(p.id, 0);
    });
    this.currentRound = 1;

    // Shuffle draw order
    const ids = Array.from(this.players.keys());
    this.drawOrder = ids.sort(() => Math.random() - 0.5);
    this.currentDrawerIndex = -1;

    resetUsed();
    this.io.to(this.code).emit('game:started', {
      round: this.currentRound,
      totalRounds: this.settings.rounds,
      room: this.getRoomState(),
    });
    this.nextTurn();
  }

  nextTurn(): void {
    this.currentDrawerIndex++;

    // Wrapped around — new round
    if (this.currentDrawerIndex >= this.drawOrder.length) {
      this.currentRound++;
      this.currentDrawerIndex = 0;
    }

    if (this.currentRound > this.settings.rounds) {
      this.endGame();
      return;
    }

    // Skip disconnected players
    let skips = 0;
    while (
      skips < this.drawOrder.length &&
      !this.players.has(this.drawOrder[this.currentDrawerIndex])
    ) {
      this.currentDrawerIndex =
        (this.currentDrawerIndex + 1) % this.drawOrder.length;
      skips++;
    }

    if (skips >= this.drawOrder.length) {
      this.endGame();
      return;
    }

    this.state = 'WORD_SELECT';
    this.currentWord = null;
    this.revealedIndices = new Set();
    this.guessedPlayers = new Set();

    const drawerId = this.currentDrawerId!;
    const wordChoices =
      this.settings.customWords.length >= 3
        ? this.settings.customWords.sort(() => Math.random() - 0.5).slice(0, 3)
        : pickWords(3);

    this.io.to(this.code).emit('game:round-start', {
      round: this.currentRound,
      totalRounds: this.settings.rounds,
      drawerId,
    });

    // Send word choices only to drawer
    this.io.to(drawerId).emit('game:word-options', { words: wordChoices });

    // Auto-select after 15 seconds
    this.wordSelectTimeout = setTimeout(() => {
      if (this.state === 'WORD_SELECT') {
        this.selectWord(wordChoices[0]);
      }
    }, 15000);
  }

  selectWord(word: string): void {
    if (this.wordSelectTimeout) {
      clearTimeout(this.wordSelectTimeout);
      this.wordSelectTimeout = null;
    }

    this.currentWord = word.toLowerCase().trim();
    this.state = 'DRAWING';
    this.turnStartTime = Date.now();

    const hint = buildHint(this.currentWord, this.revealedIndices);
    const drawerId = this.currentDrawerId!;

    // Tell drawer the full word; tell others the masked hint
    this.io.to(drawerId).emit('game:word-chosen', {
      wordLength: this.currentWord.replace(/ /g, '').length,
      drawerId,
      hint: this.currentWord.toUpperCase(), // drawer sees full word
    });
    this.io.to(drawerId).except(drawerId); // reset — actually use separate emits
    // Broadcast hint to non-drawers
    this.players.forEach((_, socketId) => {
      if (socketId !== drawerId) {
        this.io.to(socketId).emit('game:word-chosen', {
          wordLength: this.currentWord!.replace(/ /g, '').length,
          drawerId,
          hint,
        });
      }
    });

    this.roundManager.startTimer(
      this.settings.drawTime,
      secondsLeft => {
        this.io.to(this.code).emit('game:timer', { secondsLeft });
      },
      () => this.endTurn('timeout'),
    );

    this.roundManager.scheduleHints(
      this.currentWord,
      this.settings.drawTime,
      revealed => {
        this.revealedIndices = revealed;
        const newHint = buildHint(this.currentWord!, revealed);
        this.io.to(this.code).emit('game:hint-reveal', { hint: newHint });
      },
    );
  }

  evaluateGuess(socketId: string, text: string): 'correct' | 'close' | 'normal' {
    if (!this.currentWord || this.state !== 'DRAWING') return 'normal';
    if (socketId === this.currentDrawerId) return 'normal';
    if (this.guessedPlayers.has(socketId)) return 'normal';

    const normalised = text.toLowerCase().trim();
    const target = this.currentWord;

    if (normalised === target) {
      this.recordCorrectGuess(socketId);
      return 'correct';
    }

    if (levenshtein(normalised, target) <= 1) {
      return 'close';
    }

    return 'normal';
  }

  private recordCorrectGuess(socketId: string): void {
    const elapsed = (Date.now() - this.turnStartTime) / 1000;
    const guessPosition = this.guessedPlayers.size + 1;
    const points = calculateGuesserScore(elapsed, this.settings.drawTime, guessPosition);

    this.guessedPlayers.add(socketId);

    const player = this.players.get(socketId);
    if (player) {
      player.score += points;
      this.scores.set(socketId, player.score);
    }

    this.io.to(this.code).emit('player:score-update', {
      playerId: socketId,
      delta: points,
      newTotal: player?.score ?? 0,
    });

    this.io.to(this.code).emit('player:guessed', { playerId: socketId });

    this.checkAllGuessed();
  }

  private checkAllGuessed(): void {
    const nonDrawers = Array.from(this.players.keys()).filter(
      id => id !== this.currentDrawerId,
    );
    if (nonDrawers.length > 0 && nonDrawers.every(id => this.guessedPlayers.has(id))) {
      this.roundManager.cancelAll();
      this.endTurn('all-guessed');
    }
  }

  endTurn(reason: string): void {
    this.roundManager.cancelAll();
    if (this.wordSelectTimeout) {
      clearTimeout(this.wordSelectTimeout);
      this.wordSelectTimeout = null;
    }

    // Drawer bonus
    if (reason !== 'drawer-disconnected' && this.currentDrawerId) {
      const bonus = calculateDrawerBonus(this.guessedPlayers.size);
      if (bonus > 0) {
        const drawer = this.players.get(this.currentDrawerId);
        if (drawer) {
          drawer.score += bonus;
          this.scores.set(this.currentDrawerId, drawer.score);
          this.io.to(this.code).emit('player:score-update', {
            playerId: this.currentDrawerId,
            delta: bonus,
            newTotal: drawer.score,
          });
        }
      }
    }

    this.state = 'ROUND_END';

    const scores: ScoreDelta[] = Array.from(this.players.values()).map(p => ({
      playerId: p.id,
      delta: 0,
      newTotal: p.score,
    }));

    this.io.to(this.code).emit('game:round-end', {
      word: this.currentWord ?? '???',
      scores,
      reason,
    });

    this.roundEndTimeout = setTimeout(() => {
      this.nextTurn();
    }, 5000);
  }

  endGame(): void {
    this.state = 'GAME_OVER';
    this.roundManager.cancelAll();

    const finalScores = Array.from(this.players.values())
      .map(p => ({ playerId: p.id, playerName: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    const winnerId = finalScores[0]?.playerId ?? null;

    this.io.to(this.code).emit('game:over', { finalScores, winnerId });
  }

  restartGame(): void {
    this.roundManager.cancelAll();
    if (this.wordSelectTimeout) clearTimeout(this.wordSelectTimeout);
    if (this.roundEndTimeout) clearTimeout(this.roundEndTimeout);
    this.state = 'WAITING_ROOM';
    this.currentRound = 0;
    this.currentDrawerIndex = -1;
    this.drawOrder = [];
    this.currentWord = null;
    this.revealedIndices = new Set();
    this.guessedPlayers = new Set();
    this.players.forEach(p => { p.score = 0; });
    this.scores.clear();
    this.players.forEach(p => this.scores.set(p.id, 0));
    this.io.to(this.code).emit('room:updated', { room: this.getRoomState() });
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }
}
