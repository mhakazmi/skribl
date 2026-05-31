import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function RoundBanner() {
  const { state } = useGame();
  const { room, roundWord } = state;
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (roundWord && room?.state === 'ROUND_END') {
      setBanner(roundWord.toUpperCase());
      const t = setTimeout(() => setBanner(null), 4500);
      return () => clearTimeout(t);
    }
  }, [roundWord, room?.state]);

  if (!banner) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <div className="card px-8 py-5 text-center animate-slideDown">
        <p className="font-ui font-black text-ink/50 text-sm uppercase tracking-widest mb-1">The word was</p>
        <p className="font-display text-4xl text-brand-blue" style={{ WebkitTextStroke: '1px #1A1A2E' }}>{banner}</p>
      </div>
    </div>
  );
}
