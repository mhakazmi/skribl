import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function RoundBanner() {
  const { state } = useGame();
  const { room, roundWord } = state;
  const [visible, setVisible] = useState(false);
  const [bannerData, setBannerData] = useState<{ type: 'round-start' | 'round-end'; text: string } | null>(null);

  // Show round-end banner
  useEffect(() => {
    if (roundWord && room?.state === 'ROUND_END') {
      setBannerData({ type: 'round-end', text: `The word was: ${roundWord.toUpperCase()}` });
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [roundWord, room?.state]);

  if (!visible || !bannerData) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <div className={`
        px-8 py-5 rounded-3xl text-center shadow-2xl animate-slideDown
        ${bannerData.type === 'round-end' ? 'bg-navy-800 border-2 border-brand-yellow/50' : 'bg-brand-blue border-2 border-white/20'}
      `}>
        {bannerData.type === 'round-end' ? (
          <>
            <p className="font-ui text-white/60 text-sm mb-1">Round Over!</p>
            <p className="font-display text-3xl text-brand-yellow">{bannerData.text}</p>
          </>
        ) : (
          <p className="font-display text-3xl text-white">{bannerData.text}</p>
        )}
      </div>
    </div>
  );
}
