import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';

export default function WordSelectScreen() {
  const socket = useSocket();
  const { state } = useGame();
  const { wordOptions, room, playerId } = state;

  if (!room) return null;

  const drawer = room.players.find(p => p.id === room.currentDrawerId);
  const isDrawer = room.currentDrawerId === playerId;

  const chooseWord = (word: string) => {
    socket.emit('game:word-chosen', { word });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 animate-popIn">
      <div className="bg-navy-800 rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="text-4xl mb-3">{isDrawer ? '✏️' : '⏳'}</div>
          <h2 className="font-display text-3xl text-white mb-2">
            {isDrawer ? 'Choose a word!' : `${drawer?.name ?? 'Someone'} is choosing...`}
          </h2>
          <p className="text-white/50 font-ui text-sm">
            {isDrawer ? 'Pick the word you want to draw' : 'Get ready to guess!'}
          </p>
        </div>

        {isDrawer && wordOptions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {wordOptions.map(word => (
              <button
                key={word}
                onClick={() => chooseWord(word)}
                className="
                  w-full px-6 py-4 bg-navy-700 hover:bg-brand-blue
                  border border-white/10 hover:border-brand-blue
                  rounded-2xl font-display text-2xl text-white
                  transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20
                  active:scale-95
                "
              >
                {word}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="animate-pulse2 text-brand-yellow text-2xl">●</span>
            <span className="animate-pulse2 text-brand-yellow text-2xl" style={{ animationDelay: '0.2s' }}>●</span>
            <span className="animate-pulse2 text-brand-yellow text-2xl" style={{ animationDelay: '0.4s' }}>●</span>
          </div>
        )}

        <p className="text-white/30 font-ui text-xs mt-4">
          Round {room.currentRound} of {room.totalRounds}
        </p>
      </div>
    </div>
  );
}
