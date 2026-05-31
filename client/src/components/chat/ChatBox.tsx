import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { ChatMessageData } from '../../types/game';

function ChatMessage({ msg, myId }: { msg: ChatMessageData; myId: string | null }) {
  const isSystem = msg.type === 'system';
  const isCorrect = msg.type === 'correct';
  const isClose = msg.type === 'close';
  const isMe = msg.playerId === myId;

  if (isSystem) {
    return (
      <div className="text-center py-1">
        <span className="text-white/40 text-xs font-ui italic">{msg.text}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 px-2 py-1 rounded-lg text-sm font-ui ${
      isCorrect ? 'bg-brand-green/20 animate-correctFlash' :
      isClose ? 'bg-brand-yellow/10' : ''
    }`}>
      <span
        className={`font-bold shrink-0 ${isMe ? 'text-brand-blue' : 'text-white/70'}`}
        style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {msg.playerName}:
      </span>
      <span className={`break-words ${
        isCorrect ? 'text-brand-green font-bold' :
        isClose ? 'text-brand-yellow' : 'text-white/90'
      }`}>
        {isCorrect ? '🎉 Correct!' : isClose ? `🔥 ${msg.text} (so close!)` : msg.text}
      </span>
    </div>
  );
}

export default function ChatBox() {
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

  const placeholder = isDrawer
    ? "You're drawing!"
    : hasGuessed
    ? "You guessed it! 🎉"
    : room?.state !== 'DRAWING'
    ? "Waiting..."
    : "Type your guess...";

  return (
    <div className="flex flex-col h-full bg-navy-800 rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-lg">💬</span>
        <span className="font-ui font-bold text-white/80 text-sm">Chat & Guesses</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/20 font-ui text-sm text-center">
              Guesses and chat will appear here!
            </p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} myId={playerId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-3 py-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isInputDisabled}
            maxLength={100}
            className="
              flex-1 px-3 py-2 rounded-xl bg-navy-700 border border-white/10
              text-white placeholder-white/30 font-ui text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-blue
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all
            "
          />
          <button
            type="submit"
            disabled={isInputDisabled || !input.trim()}
            className="
              px-3 py-2 bg-brand-blue hover:bg-blue-500 rounded-xl
              text-white font-bold transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-95
            "
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}
