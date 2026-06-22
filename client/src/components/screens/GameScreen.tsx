import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import DrawingCanvas from '../canvas/DrawingCanvas';
import ChatBox from '../chat/ChatBox';
import PlayerList from '../game/PlayerList';
import RoundTimer from '../game/RoundTimer';
import WordHint from '../game/WordHint';
import RoundBanner from '../game/RoundBanner';
import ScorePopups from '../game/ScorePopup';
import WordSelectScreen from './WordSelectScreen';
import { IconChat, IconUsers } from '../ui/Icons';

export default function GameScreen() {
  const { state } = useGame();
  const { room, playerId } = state;
  const [mobileTab, setMobileTab] = useState<'chat' | 'players'>('chat');

  if (!room) return null;

  const showWordSelect = room.state === 'WORD_SELECT';
  const isDrawer = room.currentDrawerId === playerId;
  const drawer = room.players.find(p => p.id === room.currentDrawerId);

  return (
    <div className="game-bg h-[100dvh] flex flex-col overflow-hidden p-2 gap-2">

      {/* ── Top bar ── */}
      <div className="card-sm flex items-center justify-between px-3 py-2 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-logo text-xl text-brand-blue">Skribl!</span>
          <span className="text-ink/30">·</span>
          <span className="font-ui font-bold text-xs text-ink/60">
            Round {room.currentRound}/{room.totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {room.state === 'DRAWING' && <RoundTimer />}
          {room.state === 'DRAWING' && (
            <span className="font-ui font-bold text-xs text-ink/60 hidden sm:inline">
              {isDrawer ? 'You are drawing' : `${drawer?.name ?? '?'} is drawing`}
            </span>
          )}
        </div>

        <div className="flex justify-end">
          {room.state === 'DRAWING' && <WordHint />}
        </div>
      </div>

      {/* ── Desktop: 3-column | Mobile: canvas only ── */}
      <div className="flex gap-2 flex-1 min-h-0">

        {/* Players — desktop only */}
        <div className="hidden md:flex w-44 shrink-0 card-sm p-2 overflow-y-auto flex-col">
          <PlayerList />
        </div>

        {/* Canvas — always visible */}
        <div className="flex-1 relative min-w-0">
          <DrawingCanvas />
          <RoundBanner />
          {showWordSelect && <WordSelectScreen />}
        </div>

        {/* Chat — desktop only */}
        <div className="hidden md:block w-60 shrink-0">
          <ChatBox />
        </div>
      </div>

      {/* ── Mobile bottom panel ── */}
      <div className="md:hidden card-sm overflow-hidden flex flex-col shrink-0" style={{ height: '220px' }}>
        {/* Tabs */}
        <div className="flex shrink-0 border-b-2 border-ink/8">
          {(['chat', 'players'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2 font-ui font-bold text-sm capitalize transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === tab
                  ? 'text-brand-blue border-b-2 border-brand-blue'
                  : 'text-ink/40'
              }`}
            >
              {tab === 'chat'
                ? <><IconChat size={13} /> Chat</>
                : <><IconUsers size={13} /> Players</>
              }
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          {mobileTab === 'chat' ? (
            <ChatBox bare />
          ) : (
            <div className="h-full overflow-y-auto p-2">
              <PlayerList />
            </div>
          )}
        </div>
      </div>

      <ScorePopups />
    </div>
  );
}
