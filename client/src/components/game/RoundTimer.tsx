import { useGame } from '../../context/GameContext';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RoundTimer() {
  const { state } = useGame();
  const { timeLeft, room } = state;

  if (timeLeft === null || !room) return null;

  const fraction = Math.max(0, Math.min(1, timeLeft / room.settings.drawTime));
  const dashOffset = CIRCUMFERENCE * (1 - fraction);
  const danger = timeLeft <= 10;
  const warning = timeLeft <= Math.floor(room.settings.drawTime * 0.25);
  const color = danger ? '#EF476F' : warning ? '#FFD166' : '#06D6A0';

  return (
    <div className={`flex items-center justify-center ${danger ? 'animate-shake' : ''}`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={RADIUS} fill="white" stroke="#1A1A2E" strokeWidth="2.5" />
        <circle
          cx="32" cy="32" r={RADIUS}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
        <text x="32" y="32" textAnchor="middle" dominantBaseline="central"
          fill="#1A1A2E" fontSize="16" fontWeight="900" fontFamily="Nunito, sans-serif">
          {timeLeft}
        </text>
      </svg>
    </div>
  );
}
