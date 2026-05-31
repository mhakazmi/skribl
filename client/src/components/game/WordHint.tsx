import { useGame } from '../../context/GameContext';

export default function WordHint() {
  const { state } = useGame();
  const { currentHint, room, playerId } = state;
  const isDrawer = room?.currentDrawerId === playerId;

  if (!room || room.state !== 'DRAWING') return null;

  if (isDrawer && room) {
    // Drawer sees the actual word — we don't have it in state, only the hint
    // The hint for drawer would be the full word, but server sends hint to all
    // Show "You are drawing!" text
  }

  const hint = currentHint;
  if (!hint) return null;

  const letters = hint.split(' ');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {letters.map((char, i) => {
          if (char === '') return <span key={i} className="w-3" />;
          const isRevealed = char !== '_';
          return (
            <span
              key={i}
              className={`
                hint-letter font-mono text-2xl font-bold
                ${isRevealed ? 'text-white animate-flipIn' : 'text-white/70'}
                border-b-2 ${isRevealed ? 'border-brand-yellow' : 'border-white/40'}
                min-w-[1.5rem] text-center
              `}
            >
              {char === '_' ? ' ' : char.toUpperCase()}
            </span>
          );
        })}
      </div>
      <p className="text-white/30 font-ui text-xs">
        {letters.filter(c => c !== '' && c !== '  ').length} letters
      </p>
    </div>
  );
}
