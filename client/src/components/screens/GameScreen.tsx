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
    <div className="h-screen flex flex-col overflow-hidden bg-navy-900 p-2 gap-2">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-navy-800 rounded-2xl border border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl text-white">Skribl</span>
          <span className="text-white/30">·</span>
          <span className="font-ui text-sm text-white/60">
            Round {room.currentRound}/{room.totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {room.state === 'DRAWING' && <RoundTimer />}
          {room.state === 'DRAWING' && (
            <div className="text-center">
              {isDrawer ? (
                <span className="font-ui text-sm text-brand-yellow font-bold">✏️ You're drawing!</span>
              ) : (
                <span className="font-ui text-sm text-white/60">
                  {drawer?.name ?? '?'} is drawing
                </span>
              )}
            </div>
          )}
        </div>

        <div className="min-w-[120px] flex justify-end">
          {room.state === 'DRAWING' && <WordHint />}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Left — Player list */}
        <div className="w-48 shrink-0 overflow-y-auto">
          <PlayerList />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 relative min-w-0">
          <DrawingCanvas />
          <RoundBanner />
          {showWordSelect && <WordSelectScreen />}
        </div>

        {/* Right — Chat */}
        <div className="w-64 shrink-0">
          <ChatBox />
        </div>
      </div>

      <ScorePopups />
    </div>
  );
}
