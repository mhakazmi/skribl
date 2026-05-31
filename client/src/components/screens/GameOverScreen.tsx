import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOverScreen() {
  const socket = useSocket();
  const { state, dispatch } = useGame();
  const { finalScores, room, playerId, winnerId } = state;

  if (!finalScores || !room) return null;

  const me = room.players.find(p => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const winner = room.players.find(p => p.id === winnerId);

  const handlePlayAgain = () => {
    socket.emit('game:restart');
    dispatch({ type: 'RESET' });
  };

  const handleLeave = () => {
    socket.emit('room:leave');
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 lobby-bg overflow-auto">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="font-display text-5xl text-white mb-2">Game Over!</h1>
          {winner && (
            <p className="font-ui text-xl text-brand-yellow font-bold">
              {winner.id === playerId ? 'You won! 🎉' : `${winner.name} wins!`}
            </p>
          )}
        </div>

        {/* Podium (top 3) */}
        {finalScores.length >= 2 && (
          <div className="flex items-end justify-center gap-2 mb-6">
            {[finalScores[1], finalScores[0], finalScores[2]].map((entry, podiumPos) => {
              if (!entry) return <div key={podiumPos} className="w-24" />;
              const player = room.players.find(p => p.id === entry.playerId);
              const heights = ['h-20', 'h-28', 'h-16'];
              const medals = ['🥈', '🥇', '🥉'];
              return (
                <div key={entry.playerId} className="flex flex-col items-center gap-2 w-28">
                  <Avatar
                    name={entry.playerName}
                    color={player?.avatarColor ?? '#4F86F7'}
                    size="lg"
                  />
                  <p className="font-ui font-bold text-sm text-white text-center truncate w-full">{entry.playerName}</p>
                  <p className="font-ui text-xs text-brand-yellow">{entry.score} pts</p>
                  <div className={`${heights[podiumPos]} w-full bg-navy-700 rounded-t-xl flex items-center justify-center border border-white/10`}>
                    <span className="text-3xl">{medals[podiumPos]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-navy-800 rounded-2xl border border-white/10 overflow-hidden mb-6">
          {finalScores.map((entry, i) => {
            const player = room.players.find(p => p.id === entry.playerId);
            const isMe = entry.playerId === playerId;
            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0
                  ${isMe ? 'bg-brand-blue/20' : i % 2 === 0 ? 'bg-navy-800' : 'bg-navy-700/30'}`}
              >
                <span className="text-xl w-8 text-center shrink-0">
                  {MEDALS[i] ?? `${i + 1}`}
                </span>
                <Avatar name={entry.playerName} color={player?.avatarColor ?? '#888'} size="sm" />
                <span className={`flex-1 font-ui font-bold ${isMe ? 'text-brand-blue' : 'text-white/90'}`}>
                  {entry.playerName} {isMe && '(You)'}
                </span>
                <span className="font-display text-xl text-brand-yellow">{entry.score}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isHost && (
            <Button onClick={handlePlayAgain} size="lg" className="flex-1">
              🎮 Play Again
            </Button>
          )}
          <Button onClick={handleLeave} variant="secondary" size="lg" className={isHost ? '' : 'flex-1'}>
            🚪 Leave
          </Button>
        </div>

        {!isHost && (
          <p className="text-center text-white/30 font-ui text-sm mt-3">
            Waiting for host to start a new game...
          </p>
        )}
      </div>
    </div>
  );
}
