import { useGame } from '../../context/GameContext';

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RoundTimer() {
  const { state } = useGame();
  const { timeLeft, room } = state;

  if (timeLeft === null || !room) return null;

  const drawTime = room.settings.drawTime;
  const fraction = Math.max(0, Math.min(1, timeLeft / drawTime));
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  const danger = timeLeft <= 10;
  const warning = timeLeft <= Math.floor(drawTime * 0.25);
  const color = danger ? '#FF6B6B' : warning ? '#FFD93D' : '#6BCB77';

  return (
    <div className={`flex items-center justify-center flex-col ${danger ? 'animate-shake' : ''}`}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        {/* Background ring */}
        <circle cx="35" cy="35" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        {/* Progress ring */}
        <circle
          cx="35"
          cy="35"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
        {/* Number */}
        <text
          x="35"
          y="35"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="18"
          fontWeight="bold"
          fontFamily="Nunito, sans-serif"
        >
          {timeLeft}
        </text>
      </svg>
    </div>
  );
}
