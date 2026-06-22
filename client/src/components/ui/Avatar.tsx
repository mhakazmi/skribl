import { IconCrown, IconPencil } from './Icons';

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
        className={`${sizes[size]} rounded-full flex items-center justify-center font-display font-bold text-white select-none border-2 border-ink`}
        style={{ backgroundColor: color, boxShadow: '2px 2px 0 #1A1A2E' }}
      >
        {initials}
      </div>

      {isDrawing && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-blue border-2 border-white flex items-center justify-center">
          <IconPencil size={9} className="text-white" />
        </div>
      )}
      {isHost && !isDrawing && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-yellow border-2 border-ink flex items-center justify-center">
          <IconCrown size={9} className="text-ink" />
        </div>
      )}
      {hasGuessed && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-green border-2 border-ink flex items-center justify-center">
          <span className="text-ink font-black leading-none" style={{ fontSize: '9px' }}>✓</span>
        </div>
      )}
    </div>
  );
}
