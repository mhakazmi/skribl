import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Avatar from '../ui/Avatar';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['bg-brand-yellow', 'bg-brand-green', 'bg-brand-orange'];
const PODIUM_HEIGHTS = ['h-20', 'h-28', 'h-16'];

export default function GameOverScreen() {
  const socket = useSocket();
  const { state, dispatch } = useGame();
  const { finalScores, room, playerId, winnerId } = state;

  if (!finalScores || !room) return null;

  const me = room.players.find(p => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const winner = room.players.find(p => p.id === winnerId);
  const iWon = winnerId === playerId;

  const handlePlayAgain = () => { socket.emit('game:restart'); dispatch({ type: 'RESET' }); };
  const handleLeave = () => { socket.emit('room:leave'); dispatch({ type: 'RESET' }); };

  // Podium order: 2nd, 1st, 3rd
  const podium = [finalScores[1], finalScores[0], finalScores[2]];
  const podiumMedals = ['🥈', '🥇', '🥉'];

  return (
    <div className="game-bg min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-auto">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-2 animate-bounce2">🏆</div>
          <h1 className="font-display text-5xl text-white" style={{ textShadow: '5px 5px 0 #1D3BB3', WebkitTextStroke: '1px #1A1A2E' }}>
            Game Over!
          </h1>
          {winner && (
            <p className="font-ui font-black text-xl mt-2" style={{ color: iWon ? '#FFD166' : '#fff', textShadow: '2px 2px 0 #1A1A2E' }}>
              {iWon ? '🎉 You won!' : `🎉 ${winner.name} wins!`}
            </p>
          )}
        </div>

        {/* Podium */}
        {finalScores.length >= 2 && (
          <div className="card p-5">
            <div className="flex items-end justify-center gap-2">
              {podium.map((entry, pos) => {
                if (!entry) return <div key={pos} className="w-24" />;
                const player = room.players.find(p => p.id === entry.playerId);
                return (
                  <div key={entry.playerId} className="flex flex-col items-center gap-1.5 w-28">
                    <Avatar name={entry.playerName} color={player?.avatarColor ?? '#4361EE'} size="lg" />
                    <p className="font-ui font-black text-xs text-ink text-center truncate w-full">{entry.playerName}</p>
                    <p className="font-display text-sm text-ink/60">{entry.score} pts</p>
                    <div
                      className={`${PODIUM_HEIGHTS[pos]} ${PODIUM_COLORS[pos]} w-full rounded-t-xl border-2 border-ink flex items-center justify-center text-2xl`}
                      style={{ boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)' }}
                    >
                      {podiumMedals[pos]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="card overflow-hidden p-0">
          {finalScores.map((entry, i) => {
            const player = room.players.find(p => p.id === entry.playerId);
            const isMe = entry.playerId === playerId;
            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 px-4 py-3 border-b-2 border-ink/10 last:border-b-0 ${isMe ? 'bg-brand-blue/10' : i % 2 === 0 ? 'bg-white' : 'bg-paper'}`}
              >
                <span className="text-xl w-7 text-center shrink-0">{MEDALS[i] ?? `${i + 1}`}</span>
                <Avatar name={entry.playerName} color={player?.avatarColor ?? '#888'} size="sm" />
                <span className={`flex-1 font-ui font-black ${isMe ? 'text-brand-blue' : 'text-ink'}`}>
                  {entry.playerName}{isMe && ' (You)'}
                </span>
                <span className="font-display text-xl text-ink">{entry.score}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isHost && (
            <button onClick={handlePlayAgain} className="btn btn-green flex-1 py-4 text-lg">
              🎮 Play Again
            </button>
          )}
          <button onClick={handleLeave} className={`btn btn-white py-4 text-lg ${isHost ? '' : 'flex-1'}`}>
            🚪 Leave
          </button>
        </div>

        {!isHost && (
          <p className="text-center text-white/60 font-ui font-bold text-sm">
            Waiting for host to start a new game...
          </p>
        )}
      </div>
    </div>
  );
}
