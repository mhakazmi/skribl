import { useGame } from './context/GameContext';
import LobbyScreen from './components/screens/LobbyScreen';
import WaitingRoomScreen from './components/screens/WaitingRoomScreen';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';

export default function App() {
  const { state } = useGame();
  const { room, finalScores } = state;

  if (!room) return <LobbyScreen />;
  if (finalScores) return <GameOverScreen />;
  if (room.state === 'WAITING_ROOM') return <WaitingRoomScreen />;
  return <GameScreen />;
}
