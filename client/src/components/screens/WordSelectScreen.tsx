import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';

const WORD_COLORS = ['btn-green', 'btn-yellow', 'btn-blue'] as const;

export default function WordSelectScreen() {
  const socket = useSocket();
  const { state } = useGame();
  const { wordOptions, room, playerId } = state;

  if (!room) return null;

  const drawer = room.players.find(p => p.id === room.currentDrawerId);
  const isDrawer = room.currentDrawerId === playerId;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-40 animate-popIn">
      <div className="card p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-5xl mb-3">{isDrawer ? '✏️' : '🤔'}</div>
        <h2 className="font-display text-3xl text-ink mb-1">
          {isDrawer ? 'Pick your word!' : `${drawer?.name ?? 'Someone'} is choosing...`}
        </h2>
        <p className="text-ink/60 font-ui font-bold text-sm mb-6">
          {isDrawer ? 'Choose wisely!' : 'Get ready to guess!'}
        </p>

        {isDrawer && wordOptions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {wordOptions.map((word, i) => (
              <button
                key={word}
                onClick={() => socket.emit('game:word-chosen', { word })}
                className={`btn ${WORD_COLORS[i % 3]} w-full py-4 text-xl font-display tracking-wide`}
              >
                {word}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-4 h-4 rounded-full bg-brand-blue border-2 border-ink animate-bounce2"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        <p className="text-ink/40 font-ui font-bold text-xs mt-5">
          Round {room.currentRound} of {room.totalRounds}
        </p>
      </div>
    </div>
  );
}
