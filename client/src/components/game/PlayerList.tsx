import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';

export default function PlayerList() {
  const { state } = useGame();
  const { room, playerId, guessedPlayers, scorePopups } = state;

  if (!room) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full">
      <div className="px-2 py-1 text-xs font-ui font-bold text-white/40 uppercase tracking-wider">
        Players · Round {room.currentRound}/{room.totalRounds}
      </div>
      {sorted.map((player, rank) => {
        const isMe = player.id === playerId;
        const isDrawer = player.id === room.currentDrawerId;
        const hasGuessed = guessedPlayers.has(player.id);
        const popup = scorePopups.find(p => p.playerId === player.id);

        return (
          <div
            key={player.id}
            className={`
              relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all
              ${isMe ? 'bg-brand-blue/20 border border-brand-blue/30' : 'bg-navy-800/60 border border-white/5'}
              ${isDrawer ? 'ring-1 ring-brand-yellow/40' : ''}
            `}
          >
            {/* Rank */}
            <span className="text-xs font-ui text-white/30 w-4 text-center shrink-0">
              {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}`}
            </span>

            <Avatar
              name={player.name}
              color={player.avatarColor}
              size="sm"
              isDrawing={isDrawer}
              isHost={player.isHost && !isDrawer}
              hasGuessed={hasGuessed}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className={`font-ui font-bold text-sm truncate ${isMe ? 'text-brand-blue' : 'text-white/90'}`}>
                  {player.name}
                </p>
                {!player.isConnected && <span className="text-xs text-white/30">👻</span>}
              </div>
              <p className="font-ui text-xs text-white/40">{player.score} pts</p>
            </div>

            {/* Score popup */}
            {popup && (
              <div className="absolute -top-6 right-2 pointer-events-none animate-floatUp">
                <span className="font-display text-brand-yellow font-bold text-lg">+{popup.delta}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
