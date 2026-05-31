interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isDrawing?: boolean;
  isHost?: boolean;
  hasGuessed?: boolean;
}

const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' };

export default function Avatar({ name, color, size = 'md', isDrawing, isHost, hasGuessed }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-display font-bold text-white select-none`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {isDrawing && (
        <span className="absolute -top-1 -right-1 text-xs">✏️</span>
      )}
      {isHost && !isDrawing && (
        <span className="absolute -top-1 -right-1 text-xs">👑</span>
      )}
      {hasGuessed && (
        <span className="absolute -bottom-1 -right-1 bg-brand-green rounded-full w-4 h-4 flex items-center justify-center text-xs">✓</span>
      )}
    </div>
  );
}
