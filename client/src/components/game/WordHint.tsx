import { useGame } from '../../context/GameContext';

export default function WordHint() {
  const { state } = useGame();
  const { currentHint, room } = state;

  if (!room || room.state !== 'DRAWING' || !currentHint) return null;

  const letters = currentHint.split(' ');

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-end gap-1 flex-wrap justify-center">
        {letters.map((char, i) => {
          if (char === '' || char === '  ') return <span key={i} className="w-2 inline-block" />;
          const isRevealed = char !== '_';
          return (
            <span
              key={i}
              className={`hint-letter font-mono font-black text-xl border-b-[3px] border-ink min-w-[1.4rem] text-center pb-0.5 ${
                isRevealed ? 'text-ink animate-flipIn' : 'text-transparent'
              }`}
            >
              {isRevealed ? char.toUpperCase() : '_'}
            </span>
          );
        })}
      </div>
    </div>
  );
}
