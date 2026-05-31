import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';
import AnimatedLogo from '../ui/AnimatedLogo';

export default function WaitingRoomScreen() {
  const socket = useSocket();
  const { state } = useGame();
  const { room, playerId } = state;
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const me = room.players.find(p => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const canStart = isHost && room.players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="game-bg min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-auto">
      <div className="w-full max-w-md flex flex-col gap-4">

        {/* Title */}
        <div className="text-center mb-2">
          <AnimatedLogo style={{ fontSize: 'clamp(2.8rem, 10vw, 4.5rem)' }} />
          <p className="text-white/70 font-ui font-semibold text-sm mt-2">
            {room.settings.rounds} rounds · {room.settings.drawTime}s · up to {room.settings.maxPlayers} players
          </p>
        </div>

        {/* Room code */}
        <div className="card p-5 text-center">
          <p className="text-ink/60 font-ui font-black text-xs uppercase tracking-widest mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-bold text-brand-blue tracking-[0.3em]">{room.code}</span>
            <button
              onClick={copyCode}
              className="btn btn-yellow px-3 py-2 text-sm"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-ui font-black text-ink">
              Players ({room.players.length}/{room.settings.maxPlayers})
            </h2>
            <div className="flex gap-1">
              {Array.from({ length: room.settings.maxPlayers }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full border border-ink ${i < room.players.length ? 'bg-brand-green' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {room.players.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-ink transition-all ${player.id === playerId ? 'bg-brand-blue/10' : 'bg-white/50'}`}
                style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
              >
                <Avatar name={player.name} color={player.avatarColor} size="sm" isHost={player.isHost} />
                <span className="font-ui font-bold text-sm text-ink truncate">{player.name}</span>
                {player.id === playerId && <span className="ml-auto text-xs font-black text-brand-blue">You</span>}
              </div>
            ))}
            {room.players.length < 2 && Array.from({ length: 2 - room.players.length }).map((_, i) => (
              <div key={`e${i}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-ink/30 bg-white/20">
                <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-ink/30 text-sm font-bold">?</div>
                <span className="font-ui text-sm text-ink/40 font-bold">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start / Waiting */}
        {isHost ? (
          <div>
            <button
              onClick={() => socket.emit('game:start')}
              disabled={!canStart}
              className="btn btn-green w-full py-4 text-xl"
            >
              {canStart ? '🎮 Start Game!' : `Need ${2 - room.players.length} more player${2 - room.players.length !== 1 ? 's' : ''}...`}
            </button>
          </div>
        ) : (
          <div className="card p-4 flex items-center justify-center gap-3">
            <span className="text-2xl animate-bounce2">⏳</span>
            <span className="font-ui font-black text-ink">Waiting for host to start...</span>
          </div>
        )}
      </div>
    </div>
  );
}
