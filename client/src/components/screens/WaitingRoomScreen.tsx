import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

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

  const handleStart = () => {
    socket.emit('game:start');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 lobby-bg">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-white mb-1">Waiting Room</h1>
          <p className="text-white/50 font-ui">
            {room.settings.rounds} rounds · {room.settings.drawTime}s draw time · up to {room.settings.maxPlayers} players
          </p>
        </div>

        {/* Room code */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-white/10 mb-4 text-center">
          <p className="text-white/50 font-ui text-sm mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-bold text-brand-yellow tracking-widest">
              {room.code}
            </span>
            <button
              onClick={copyCode}
              className="px-3 py-1.5 bg-brand-yellow/20 hover:bg-brand-yellow/30 text-brand-yellow rounded-lg font-ui text-sm transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="text-white/30 font-ui text-xs mt-2">Share this code with friends</p>
        </div>

        {/* Players */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-ui font-bold text-white/80">
              Players ({room.players.length}/{room.settings.maxPlayers})
            </h2>
            <div className="flex gap-1">
              {Array.from({ length: room.settings.maxPlayers }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < room.players.length ? 'bg-brand-green' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {room.players.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                  ${player.id === playerId ? 'bg-brand-blue/20 border border-brand-blue/30' : 'bg-navy-700/50'}`}
              >
                <Avatar name={player.name} color={player.avatarColor} size="sm" isHost={player.isHost} />
                <span className="font-ui font-semibold text-sm text-white truncate">{player.name}</span>
                {player.id === playerId && (
                  <span className="ml-auto text-xs text-brand-blue font-ui">You</span>
                )}
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-navy-700/20 border border-dashed border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/20 text-xs">?</div>
                <span className="font-ui text-sm text-white/20">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start / waiting */}
        {isHost ? (
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              className="w-full"
            >
              {canStart ? '🎮 Start Game!' : `Waiting for players (${room.players.length}/2 min)`}
            </Button>
            {!canStart && (
              <p className="text-center text-white/40 text-sm font-ui">
                Need at least 2 players to start
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-navy-800 rounded-full border border-white/10">
              <span className="animate-pulse2 text-brand-yellow">●</span>
              <span className="font-ui text-white/60">Waiting for host to start...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
