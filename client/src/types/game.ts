export type GameState =
  | 'WAITING_ROOM'
  | 'WORD_SELECT'
  | 'DRAWING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  customWords: string[];
  hasPassword: boolean;
}

export interface RoomState {
  code: string;
  players: Player[];
  settings: RoomSettings;
  state: GameState;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  hint: string | null;
  timeLeft: number | null;
}

export interface ChatMessageData {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'normal' | 'correct' | 'close' | 'system';
  timestamp: number;
}

export interface ScoreDelta {
  playerId: string;
  delta: number;
  newTotal: number;
}
