import { useState, FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function LobbyScreen() {
  const socket = useSocket();
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState(() => localStorage.getItem('skribl-name') ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);

  const saveName = (n: string) => {
    setName(n);
    localStorage.setItem('skribl-name', n);
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    setLoading(true);
    socket.emit('room:create', {
      playerName: name.trim(),
      settings: { rounds, drawTime, maxPlayers, customWords: [] },
    });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    setLoading(true);
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName: name.trim() });
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="lobby-bg min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-auto">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-7xl text-white drop-shadow-lg" style={{ textShadow: '3px 3px 0 #4F86F7, 6px 6px 0 rgba(79,134,247,0.3)' }}>
          Skribl
        </h1>
        <p className="font-ui text-white/60 mt-2 text-lg">Draw. Guess. Win!</p>
      </div>

      <div className="w-full max-w-md">
        {/* Tabs */}
        <div className="flex rounded-2xl bg-navy-800 p-1 mb-6 border border-white/10">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-ui font-bold text-sm transition-all duration-200 ${
                tab === t
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t === 'create' ? '✨ Create Room' : '🚪 Join Room'}
            </button>
          ))}
        </div>

        {/* Error */}
        {state.error && (
          <div className="mb-4 px-4 py-3 bg-brand-red/20 border border-brand-red/40 rounded-xl text-brand-red font-ui text-sm animate-popIn">
            {state.error}
          </div>
        )}

        <div className="bg-navy-800 rounded-2xl p-6 border border-white/10 shadow-2xl">
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input
                label="Your Name"
                placeholder="Enter your name..."
                value={name}
                onChange={e => saveName(e.target.value)}
                maxLength={20}
                required
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-white/60 font-ui">Rounds</label>
                  <select
                    value={rounds}
                    onChange={e => setRounds(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-navy-700 border border-white/10 text-white font-ui text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-white/60 font-ui">Draw Time</label>
                  <select
                    value={drawTime}
                    onChange={e => setDrawTime(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-navy-700 border border-white/10 text-white font-ui text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {[30, 45, 60, 80, 120].map(n => <option key={n} value={n}>{n}s</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-white/60 font-ui">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-navy-700 border border-white/10 text-white font-ui text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={loading || !name.trim()} className="mt-2 w-full">
                {loading ? '...' : '🎨 Create Room'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <Input
                label="Your Name"
                placeholder="Enter your name..."
                value={name}
                onChange={e => saveName(e.target.value)}
                maxLength={20}
                required
              />
              <Input
                label="Room Code"
                placeholder="Enter 4-letter code..."
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="uppercase tracking-widest text-center text-xl"
                required
              />
              <Button type="submit" size="lg" disabled={loading || !name.trim() || roomCode.length !== 4} className="mt-2 w-full">
                {loading ? '...' : '🚀 Join Game'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs font-ui mt-6">
          Share your room code with friends to play together!
        </p>
      </div>
    </div>
  );
}
