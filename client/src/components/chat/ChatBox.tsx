import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { ChatMessageData } from '../../types/game';
import { IconSend } from '../ui/Icons';

function ChatMessage({ msg, myId }: { msg: ChatMessageData; myId: string | null }) {
  const isSystem = msg.type === 'system';
  const isCorrect = msg.type === 'correct';
  const isClose = msg.type === 'close';
  const isMe = msg.playerId === myId;

  if (isSystem) {
    return (
      <div className="text-center py-1">
        <span className="text-ink/40 text-xs font-ui font-bold italic">{msg.text}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 px-2 py-1.5 rounded-lg text-sm font-ui ${
      isCorrect ? 'bg-brand-green/25 animate-correctFlash border border-brand-green/40' :
      isClose ? 'bg-brand-yellow/25 border border-brand-yellow/40' : ''
    }`}>
      <span
        className={`font-black shrink-0 ${isMe ? 'text-brand-blue' : 'text-ink/70'}`}
        style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {msg.playerName}:
      </span>
      <span className={`break-words font-semibold ${
        isCorrect ? 'text-brand-green' : isClose ? 'text-brand-orange' : 'text-ink/90'
      }`}>
        {isCorrect ? '🎉 Correct!' : isClose ? '🔥 So close!' : msg.text}
      </span>
    </div>
  );
}

export default function ChatBox({ bare = false }: { bare?: boolean }) {
  const socket = useSocket();
  const { state } = useGame();
  const { messages, room, playerId, guessedPlayers } = state;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const isDrawer = room?.currentDrawerId === playerId;
  const hasGuessed = playerId ? guessedPlayers.has(playerId) : false;
  const isInputDisabled = isDrawer || hasGuessed || room?.state !== 'DRAWING';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isInputDisabled) return;
    socket.emit('chat:message', { text });
    setInput('');
  };

  const placeholder = isDrawer ? "You're drawing! 🎨"
    : hasGuessed ? "You got it! 🎉"
    : room?.state !== 'DRAWING' ? "Waiting..."
    : "Type your guess...";

  return (
    <div className={`flex flex-col h-full overflow-hidden ${bare ? '' : 'card'}`}>
      {!bare && (
        <div className="px-4 py-3 border-b-2 border-ink/10 flex items-center gap-2 shrink-0 bg-brand-blue/5">
          <span className="font-ui font-black text-ink text-sm">Chat &amp; Guesses</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 min-h-0 bg-paper">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-ink/25 font-ui font-bold text-sm text-center px-4">
              Guesses appear here! 👀
            </p>
          </div>
        )}
        {messages.map(msg => <ChatMessage key={msg.id} msg={msg} myId={playerId} />)}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="px-2 py-2 border-t-2 border-ink/10 shrink-0 bg-paper">
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isInputDisabled}
            maxLength={100}
            className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-ink text-ink placeholder-ink/30 font-ui font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
          />
          <button
            type="submit"
            disabled={isInputDisabled || !input.trim()}
            className="btn btn-blue px-3 py-2"
            aria-label="Send message"
          >
            <IconSend size={15} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
