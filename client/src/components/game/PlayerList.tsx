import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';

export default function PlayerList() {
  const { state } = useGame();
  const { room, playerId, guessedPlayers, scorePopups } = state;

  if (!room) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-1.5 h-full overflow-y-auto">
      <p className="text-xs font-black text-ink/50 font-ui uppercase tracking-wider px-1 mb-0.5">
        Players · {room.currentRound}/{room.totalRounds}
      </p>
      {sorted.map((player, rank) => {
        const isMe = player.id === playerId;
        const isDrawer = player.id === room.currentDrawerId;
        const hasGuessed = guessedPlayers.has(player.id);
        const popup = scorePopups.find(p => p.playerId === player.id);

        return (
          <div
            key={player.id}
            className={`relative flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 border-ink transition-all ${
              isDrawer ? 'bg-brand-yellow/30' : isMe ? 'bg-brand-blue/15' : 'bg-white/70'
            }`}
            style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
          >
            <span className="text-sm w-5 text-center shrink-0">
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
              <p className={`font-ui font-black text-xs truncate ${isMe ? 'text-brand-blue' : 'text-ink'}`}>
                {player.name}
              </p>
              <p className="font-ui text-xs text-ink/50 font-bold">{player.score} pts</p>
            </div>

            {popup && (
              <div className="absolute -top-7 right-1 pointer-events-none animate-floatUp">
                <span className="font-display text-brand-green text-xl font-black" style={{ WebkitTextStroke: '1px #1A1A2E' }}>+{popup.delta}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
