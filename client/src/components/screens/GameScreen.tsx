import { useGame } from '../../context/GameContext';
import DrawingCanvas from '../canvas/DrawingCanvas';
import ChatBox from '../chat/ChatBox';
import PlayerList from '../game/PlayerList';
import RoundTimer from '../game/RoundTimer';
import WordHint from '../game/WordHint';
import RoundBanner from '../game/RoundBanner';
import ScorePopups from '../game/ScorePopup';
import WordSelectScreen from './WordSelectScreen';

export default function GameScreen() {
  const { state } = useGame();
  const { room, playerId } = state;

  if (!room) return null;

  const showWordSelect = room.state === 'WORD_SELECT';
  const isDrawer = room.currentDrawerId === playerId;
  const drawer = room.players.find(p => p.id === room.currentDrawerId);

  return (
    <div className="game-bg h-screen flex flex-col overflow-hidden p-2 gap-2">
      {/* Top bar */}
      <div className="card-sm flex items-center justify-between px-4 py-2 shrink-0 flex-wrap gap-2"
           style={{ borderRadius: '12px' }}>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl text-brand-blue" style={{ WebkitTextStroke: '1px #1A1A2E' }}>Skribl!</span>
          <span className="text-ink/30 font-bold">·</span>
          <span className="font-ui font-black text-sm text-ink/70">
            Round {room.currentRound}/{room.totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {room.state === 'DRAWING' && <RoundTimer />}
          {room.state === 'DRAWING' && (
            <div className="card-sm px-3 py-1.5" style={{ borderRadius: '10px', boxShadow: '2px 2px 0 #1A1A2E' }}>
              {isDrawer ? (
                <span className="font-ui font-black text-sm text-brand-blue">✏️ You're drawing!</span>
              ) : (
                <span className="font-ui font-bold text-sm text-ink/70">
                  ✏️ {drawer?.name ?? '?'} is drawing
                </span>
              )}
            </div>
          )}
        </div>

        <div className="min-w-[100px] flex justify-end">
          {room.state === 'DRAWING' && <WordHint />}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Players */}
        <div className="w-44 shrink-0 overflow-y-auto card-sm p-2">
          <PlayerList />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative min-w-0">
          <DrawingCanvas />
          <RoundBanner />
          {showWordSelect && <WordSelectScreen />}
        </div>

        {/* Chat */}
        <div className="w-60 shrink-0">
          <ChatBox />
        </div>
      </div>

      <ScorePopups />
    </div>
  );
}
