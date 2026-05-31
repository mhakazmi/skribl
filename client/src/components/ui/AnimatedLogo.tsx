import { useState } from 'react';
import React from 'react';

const LETTERS = [
  { char: 'S', color: '#EF476F' },
  { char: 'k', color: '#FF9500' },
  { char: 'r', color: '#06D6A0' },
  { char: 'i', color: '#00BBF9' },
  { char: 'b', color: '#9B5DE5' },
  { char: 'l', color: '#FFD166' },
  { char: '!', color: '#EF476F' },
];

function Letter({ char, color, delay }: { char: string; color: string; delay: number }) {
  const [popping, setPopping] = useState(false);

  const handleHover = () => {
    if (popping) return;
    setPopping(true);
    setTimeout(() => setPopping(false), 540);
  };

  return (
    <span
      className={`logo-letter${popping ? ' popping' : ''}`}
      style={{
        color,
        animationDelay: popping ? '0s' : `${delay}s`,
      }}
      onMouseEnter={handleHover}
    >
      {char}
    </span>
  );
}

export default function AnimatedLogo({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`leading-none ${className}`} style={style} aria-label="Skribl!">
      {LETTERS.map((l, i) => (
        <Letter key={i} char={l.char} color={l.color} delay={i * 0.1} />
      ))}
    </div>
  );
}
