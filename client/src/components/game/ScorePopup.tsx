import { useGame } from '../../context/GameContext';

export default function ScorePopups() {
  const { state } = useGame();
  const { scorePopups, room } = state;

  if (!room) return null;

  return (
    <>
      {scorePopups.map(popup => {
        const player = room.players.find(p => p.id === popup.playerId);
        return (
          <div
            key={popup.id}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 animate-floatUp"
          >
            <span className="font-display text-4xl text-brand-yellow drop-shadow-lg">
              +{popup.delta}
            </span>
          </div>
        );
      })}
    </>
  );
}
