import { useState, FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
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

  const saveName = (n: string) => { setName(n); localStorage.setItem('skribl-name', n); };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    setLoading(true);
    socket.emit('room:create', { playerName: name.trim(), settings: { rounds, drawTime, maxPlayers, customWords: [] } });
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

  const selectClass = 'w-full px-3 py-2.5 rounded-xl bg-white font-ui font-bold text-ink border-2 border-ink focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer';

  return (
    <div className="game-bg min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-auto">

      {/* Rainbow logo */}
      <div className="mb-8 text-center">
        <h1 className="font-display leading-none select-none" style={{ fontSize: 'clamp(4rem, 12vw, 7rem)' }}>
          <span className="logo-r" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #9E1A3A' }}>S</span>
          <span className="logo-k" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #7a3200' }}>k</span>
          <span className="logo-i" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #7a5c00' }}>r</span>
          <span className="logo-b" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #027a5a' }}>i</span>
          <span className="logo-b2" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #1D3BB3', color: '#00BBF9' }}>b</span>
          <span className="logo-l" style={{ WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #5a1a9e' }}>l</span>
          <span style={{ color: '#EF476F', WebkitTextStroke: '2px #1A1A2E', textShadow: '4px 4px 0 #9E1A3A' }}>!</span>
        </h1>
        <p className="font-ui font-black text-white text-lg mt-1" style={{ textShadow: '2px 2px 0 #1D3BB3' }}>
          Draw it. Guess it. Win it! 🎨
        </p>
      </div>

      <div className="w-full max-w-sm">
        {/* Error */}
        {state.error && (
          <div className="mb-4 px-4 py-3 card-sm text-brand-red font-bold font-ui text-sm animate-popIn border-brand-red" style={{ boxShadow: '3px 3px 0 #9E1A3A' }}>
            ⚠️ {state.error}
          </div>
        )}

        <div className="card p-6">
          {/* Tabs */}
          <div className="flex rounded-xl border-2 border-ink overflow-hidden mb-5" style={{ boxShadow: '3px 3px 0 #1A1A2E' }}>
            {(['create', 'join'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 font-ui font-black text-sm transition-all duration-150 ${tab === t ? 'tab-active' : 'tab-inactive bg-white'}`}
              >
                {t === 'create' ? '✨ Create Room' : '🚪 Join Room'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input label="Your Name" placeholder="Enter your name..." value={name} onChange={e => saveName(e.target.value)} maxLength={20} required />

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Rounds', value: rounds, set: setRounds, opts: [1,2,3,4,5], fmt: (n: number) => String(n) },
                  { label: 'Draw Time', value: drawTime, set: setDrawTime, opts: [30,45,60,80,120], fmt: (n: number) => `${n}s` },
                  { label: 'Players', value: maxPlayers, set: setMaxPlayers, opts: [2,4,6,8,10,12], fmt: (n: number) => String(n) },
                ].map(({ label, value, set, opts, fmt }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs font-black text-ink font-ui">{label}</label>
                    <select value={value} onChange={e => set(Number(e.target.value))} className={selectClass} style={{ boxShadow: '2px 2px 0 #1A1A2E' }}>
                      {opts.map(n => <option key={n} value={n}>{fmt(n)}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading || !name.trim()} className="btn btn-green w-full py-4 text-lg mt-1">
                {loading ? '⏳ Creating...' : '🎨 Create Room'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <Input label="Your Name" placeholder="Enter your name..." value={name} onChange={e => saveName(e.target.value)} maxLength={20} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-black text-ink font-ui">Room Code</label>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXX"
                  maxLength={4}
                  required
                  className="w-full px-4 py-4 rounded-xl bg-white font-mono font-bold text-ink text-3xl text-center tracking-[0.5em] border-2 border-ink uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  style={{ boxShadow: '3px 3px 0 #1A1A2E' }}
                />
              </div>
              <button type="submit" disabled={loading || !name.trim() || roomCode.length !== 4} className="btn btn-blue w-full py-4 text-lg mt-1">
                {loading ? '⏳ Joining...' : '🚀 Join Game'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/60 font-ui font-bold text-sm mt-5" style={{ textShadow: '1px 1px 0 #1D3BB3' }}>
          Share the room code with friends to play! 🎉
        </p>
      </div>
    </div>
  );
}
