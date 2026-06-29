import { useState, FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import Input from '../ui/Input';
import AnimatedLogo from '../ui/AnimatedLogo';
import { IconSparkle, IconLogin, IconPlay, IconAlert, IconLoader } from '../ui/Icons';

export default function LobbyScreen() {
  const socket = useSocket();
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState(() => localStorage.getItem('skribl-name') ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const saveName = (n: string) => { setName(n); localStorage.setItem('skribl-name', n); };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    setLoading(true);
    socket.emit('room:create', { playerName: name.trim(), password: roomPassword, settings: { rounds, drawTime, maxPlayers, customWords: [] } });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    setLoading(true);
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName: name.trim(), password: joinPassword });
    setTimeout(() => setLoading(false), 3000);
  };

  const selectClass = 'w-full px-3 py-2.5 rounded-xl bg-white font-ui font-bold text-ink border-2 border-ink focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer transition-colors hover:border-brand-blue/60';

  return (
    <div className="game-bg min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-auto">

      {/* Logo */}
      <div className="mb-8 text-center">
        <AnimatedLogo style={{ fontSize: 'clamp(3.5rem, 14vw, 6rem)' }} />
        <p className="font-ui font-bold text-white/80 text-base mt-2">
          Draw it. Guess it. Win it.
        </p>
      </div>

      <div className="w-full max-w-sm">
        {/* Error banner */}
        {state.error && (
          <div
            className="mb-4 px-4 py-3 card-sm flex items-center gap-2.5 text-brand-red font-bold font-ui text-sm animate-popIn border-brand-red"
            style={{ boxShadow: '3px 3px 0 #9E1A3A' }}
          >
            <IconAlert size={16} className="shrink-0 text-brand-red" />
            {state.error}
          </div>
        )}

        <div className="card p-6">
          {/* Tab switcher */}
          <div
            className="flex rounded-xl border-2 border-ink overflow-hidden mb-5"
            style={{ boxShadow: '3px 3px 0 #1A1A2E' }}
          >
            {(['create', 'join'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 font-ui font-black text-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === t ? 'tab-active' : 'tab-inactive bg-white'
                }`}
              >
                {t === 'create'
                  ? <><IconSparkle size={14} /> Create Room</>
                  : <><IconLogin size={14} /> Join Room</>
                }
              </button>
            ))}
          </div>

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

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Rounds', value: rounds, set: setRounds, opts: [1, 2, 3, 4, 5], fmt: (n: number) => String(n) },
                  { label: 'Draw Time', value: drawTime, set: setDrawTime, opts: [30, 45, 60, 80, 120], fmt: (n: number) => `${n}s` },
                  { label: 'Players', value: maxPlayers, set: setMaxPlayers, opts: [2, 4, 6, 8, 10, 12], fmt: (n: number) => String(n) },
                ].map(({ label, value, set, opts, fmt }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs font-black text-ink font-ui">{label}</label>
                    <select
                      value={value}
                      onChange={e => set(Number(e.target.value))}
                      className={selectClass}
                      style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
                    >
                      {opts.map(n => <option key={n} value={n}>{fmt(n)}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <Input
                label="Room Password"
                type="password"
                placeholder="Leave blank for open room"
                value={roomPassword}
                onChange={e => setRoomPassword(e.target.value)}
                maxLength={100}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn btn-green w-full py-4 text-lg mt-1 gap-2"
              >
                {loading
                  ? <><IconLoader size={18} className="text-ink" /> Creating…</>
                  : <><IconPlay size={16} className="text-ink" /> Create Room</>
                }
              </button>
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-black text-ink font-ui">Room Code</label>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXX"
                  maxLength={4}
                  required
                  className="w-full px-4 py-4 rounded-xl bg-white font-mono font-bold text-ink text-3xl text-center tracking-[0.5em] border-2 border-ink uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                  style={{ boxShadow: '3px 3px 0 #1A1A2E' }}
                />
              </div>
              <Input
                label="Room Password"
                type="password"
                placeholder="Leave blank if no password"
                value={joinPassword}
                onChange={e => setJoinPassword(e.target.value)}
                maxLength={100}
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={loading || !name.trim() || roomCode.length !== 4}
                className="btn btn-blue w-full py-4 text-lg mt-1 gap-2"
              >
                {loading
                  ? <><IconLoader size={18} className="text-white" /> Joining…</>
                  : <><IconLogin size={16} className="text-white" /> Join Game</>
                }
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
