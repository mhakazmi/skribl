import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function RoundBanner() {
  const { state } = useGame();
  const { room, roundWord, preRoundScores } = state;
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (roundWord && room?.state === 'ROUND_END') {
      setBanner(roundWord.toUpperCase());
      const t = setTimeout(() => setBanner(null), 4500);
      return () => clearTimeout(t);
    }
  }, [roundWord, room?.state]);

  if (!banner) return null;

  const roundDeltas = (room?.players ?? [])
    .map(p => ({
      id: p.id,
      name: p.name,
      delta: p.score - (preRoundScores[p.id] ?? p.score),
    }))
    .sort((a, b) => b.delta - a.delta);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <div className="card px-8 py-5 text-center animate-slideDown" style={{ minWidth: '260px' }}>
        <p className="font-ui font-black text-ink/50 text-sm uppercase tracking-widest mb-1">The word was</p>
        <p className="font-display text-4xl text-brand-blue" style={{ WebkitTextStroke: '1px #1A1A2E' }}>{banner}</p>

        {roundDeltas.length > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-ink/10 flex flex-col gap-1.5">
            {roundDeltas.map(({ id, name, delta }) => (
              <div key={id} className="flex items-center justify-between gap-6">
                <span className="font-ui font-bold text-ink text-sm truncate text-left">{name}</span>
                <span className={`font-display font-bold text-sm shrink-0 ${delta > 0 ? 'text-brand-green' : 'text-ink/30'}`}>
                  {delta > 0 ? `+${delta}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
