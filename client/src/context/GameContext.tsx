import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from 'react';
import { RoomState, ChatMessageData, ScoreDelta, GameState } from '../types/game';
import { useSocket } from './SocketContext';

interface ScorePopupEntry {
  id: string;
  playerId: string;
  delta: number;
}

export interface GameContextState {
  playerId: string | null;
  room: RoomState | null;
  messages: ChatMessageData[];
  wordOptions: string[];
  currentHint: string | null;
  timeLeft: number | null;
  roundWord: string | null; // revealed at round end
  preRoundScores: Record<string, number>; // player scores snapshot at round start, for delta display
  finalScores: Array<{ playerId: string; playerName: string; score: number }> | null;
  winnerId: string | null;
  scorePopups: ScorePopupEntry[];
  guessedPlayers: Set<string>;
  error: string | null;
}

type Action =
  | { type: 'SET_PLAYER_ID'; payload: string }
  | { type: 'SET_ROOM'; payload: RoomState }
  | { type: 'ADD_MESSAGE'; payload: ChatMessageData }
  | { type: 'SET_WORD_OPTIONS'; payload: string[] }
  | { type: 'SET_HINT'; payload: string }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_ROUND_WORD'; payload: string }
  | { type: 'SET_FINAL_SCORES'; payload: { scores: Array<{ playerId: string; playerName: string; score: number }>; winnerId: string } }
  | { type: 'ADD_SCORE_POPUP'; payload: ScorePopupEntry }
  | { type: 'REMOVE_SCORE_POPUP'; payload: string }
  | { type: 'PLAYER_GUESSED'; payload: string }
  | { type: 'CLEAR_GUESSED' }
  | { type: 'ROUND_START' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PLAYER_SCORE'; payload: { playerId: string; newTotal: number } }
  | { type: 'SET_ROOM_STATE'; payload: GameState }
  | { type: 'UPDATE_ROUND_INFO'; payload: { round: number; drawerId: string; state: GameState } }
  | { type: 'RESET' };

const initialState: GameContextState = {
  playerId: null,
  room: null,
  messages: [],
  wordOptions: [],
  currentHint: null,
  timeLeft: null,
  roundWord: null,
  preRoundScores: {},
  finalScores: null,
  winnerId: null,
  scorePopups: [],
  guessedPlayers: new Set(),
  error: null,
};

function reducer(state: GameContextState, action: Action): GameContextState {
  switch (action.type) {
    case 'SET_PLAYER_ID':
      return { ...state, playerId: action.payload };
    case 'SET_ROOM':
      return { ...state, room: action.payload, error: null };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages.slice(-200), action.payload] };
    case 'SET_WORD_OPTIONS':
      return { ...state, wordOptions: action.payload };
    case 'SET_HINT':
      return { ...state, currentHint: action.payload };
    case 'SET_TIME':
      return { ...state, timeLeft: action.payload };
    case 'SET_ROUND_WORD':
      return { ...state, roundWord: action.payload };
    case 'SET_FINAL_SCORES':
      return { ...state, finalScores: action.payload.scores, winnerId: action.payload.winnerId };
    case 'ADD_SCORE_POPUP':
      return { ...state, scorePopups: [...state.scorePopups, action.payload] };
    case 'REMOVE_SCORE_POPUP':
      return { ...state, scorePopups: state.scorePopups.filter(p => p.id !== action.payload) };
    case 'PLAYER_GUESSED': {
      const next = new Set(state.guessedPlayers);
      next.add(action.payload);
      return { ...state, guessedPlayers: next };
    }
    case 'CLEAR_GUESSED':
      return { ...state, guessedPlayers: new Set() };
    case 'ROUND_START':
      return {
        ...state,
        currentHint: null,
        timeLeft: null,
        roundWord: null,
        wordOptions: [],
        guessedPlayers: new Set(),
        messages: [],
        preRoundScores: state.room
          ? Object.fromEntries(state.room.players.map(p => [p.id, p.score]))
          : {},
      };
    case 'UPDATE_PLAYER_SCORE': {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.map(p =>
            p.id === action.payload.playerId ? { ...p, score: action.payload.newTotal } : p,
          ),
        },
      };
    }
    case 'SET_ROOM_STATE': {
      if (!state.room) return state;
      return { ...state, room: { ...state.room, state: action.payload } };
    }
    case 'UPDATE_ROUND_INFO': {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          state: action.payload.state,
          currentRound: action.payload.round,
          currentDrawerId: action.payload.drawerId,
        },
      };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...initialState, playerId: state.playerId };
    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameContextState; dispatch: Dispatch<Action> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    socket.on('room:created', ({ room, playerId }: { room: RoomState; playerId: string }) => {
      dispatch({ type: 'SET_PLAYER_ID', payload: playerId });
      dispatch({ type: 'SET_ROOM', payload: room });
    });

    socket.on('room:joined', ({ room, playerId }: { room: RoomState; playerId: string }) => {
      dispatch({ type: 'SET_PLAYER_ID', payload: playerId });
      dispatch({ type: 'SET_ROOM', payload: room });
    });

    socket.on('room:updated', ({ room }: { room: RoomState }) => {
      dispatch({ type: 'SET_ROOM', payload: room });
    });

    socket.on('room:error', ({ message }: { message: string }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
    });

    socket.on('game:started', ({ room }: { room: RoomState }) => {
      if (room) dispatch({ type: 'SET_ROOM', payload: room });
      dispatch({ type: 'ROUND_START' });
    });

    socket.on('game:round-start', ({ round, drawerId }: { round: number; totalRounds: number; drawerId: string }) => {
      dispatch({ type: 'ROUND_START' });
      dispatch({ type: 'UPDATE_ROUND_INFO', payload: { round, drawerId, state: 'WORD_SELECT' } });
    });

    socket.on('game:word-options', ({ words }: { words: string[] }) => {
      dispatch({ type: 'SET_WORD_OPTIONS', payload: words });
    });

    socket.on('game:word-chosen', ({ hint }: { hint: string; wordLength: number; drawerId: string }) => {
      dispatch({ type: 'SET_HINT', payload: hint });
      dispatch({ type: 'SET_ROOM_STATE', payload: 'DRAWING' });
    });

    socket.on('game:hint-reveal', ({ hint }: { hint: string }) => {
      dispatch({ type: 'SET_HINT', payload: hint });
    });

    socket.on('game:timer', ({ secondsLeft }: { secondsLeft: number }) => {
      dispatch({ type: 'SET_TIME', payload: secondsLeft });
    });

    socket.on('game:round-end', ({ word, scores }: { word: string; scores: ScoreDelta[] }) => {
      dispatch({ type: 'SET_ROUND_WORD', payload: word });
      dispatch({ type: 'SET_ROOM_STATE', payload: 'ROUND_END' });
      scores.forEach(s => {
        dispatch({ type: 'UPDATE_PLAYER_SCORE', payload: { playerId: s.playerId, newTotal: s.newTotal } });
      });
    });

    socket.on('game:over', ({ finalScores, winnerId }: { finalScores: Array<{ playerId: string; playerName: string; score: number }>; winnerId: string }) => {
      dispatch({ type: 'SET_FINAL_SCORES', payload: { scores: finalScores, winnerId } });
    });

    socket.on('player:score-update', ({ playerId, delta, newTotal }: { playerId: string; delta: number; newTotal: number }) => {
      const id = `popup-${Date.now()}-${Math.random()}`;
      dispatch({ type: 'ADD_SCORE_POPUP', payload: { id, playerId, delta } });
      dispatch({ type: 'UPDATE_PLAYER_SCORE', payload: { playerId, newTotal } });
      setTimeout(() => dispatch({ type: 'REMOVE_SCORE_POPUP', payload: id }), 1500);
    });

    socket.on('player:guessed', ({ playerId }: { playerId: string }) => {
      dispatch({ type: 'PLAYER_GUESSED', payload: playerId });
    });

    socket.on('chat:message', (msg: ChatMessageData) => {
      dispatch({ type: 'ADD_MESSAGE', payload: msg });
    });

    socket.on('chat:system', (msg: Omit<ChatMessageData, 'playerId' | 'playerName' | 'type'>) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { ...msg, playerId: 'system', playerName: 'system', type: 'system' } as ChatMessageData,
      });
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('game:started');
      socket.off('game:round-start');
      socket.off('game:word-options');
      socket.off('game:word-chosen');
      socket.off('game:hint-reveal');
      socket.off('game:timer');
      socket.off('game:round-end');
      socket.off('game:over');
      socket.off('player:score-update');
      socket.off('player:guessed');
      socket.off('chat:message');
      socket.off('chat:system');
    };
  }, [socket]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
