import { Tool } from './useDrawing';
import { IconEraser, IconBucket, IconUndo, IconTrash } from '../ui/Icons';

const COLORS = [
  '#000000', '#7F7F7F', '#C0C0C0', '#FFFFFF', '#FF0000', '#FF7F00', '#FFFF00', '#00CC00', '#00CCCC',
  '#0000FF', '#8B00FF', '#FF00FF', '#A0522D', '#FF6347', '#FFD700', '#ADFF2F', '#40E0D0', '#1E90FF',
];

const SIZES = [
  { label: 'S', value: 4 },
  { label: 'M', value: 8 },
  { label: 'L', value: 16 },
  { label: 'XL', value: 28 },
];

interface ToolBarProps {
  color: string;
  size: number;
  tool: Tool;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
  onToolChange: (t: Tool) => void;
  onClear: () => void;
  onUndo: () => void;
}

export default function ToolBar({ color, size, tool, onColorChange, onSizeChange, onToolChange, onClear, onUndo }: ToolBarProps) {
  const toolBtn = (active: boolean) =>
    `w-9 h-9 rounded-xl border-2 border-ink flex items-center justify-center transition-all cursor-pointer ${
      active
        ? 'bg-brand-yellow scale-105'
        : 'bg-white hover:bg-brand-yellow/30'
    }`;

  return (
    <div className="overflow-x-auto">
      <div
        className="flex items-center gap-2 px-3 py-2 card-sm flex-nowrap w-max min-w-full"
        style={{ borderRadius: '12px' }}
      >
        {/* Color palette */}
        <div className="grid grid-cols-9 gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { onColorChange(c); onToolChange('brush'); }}
              className={`color-swatch w-5 h-5 border-2 cursor-pointer ${
                color === c && tool !== 'eraser' ? 'active border-ink' : 'border-ink/40'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="w-px h-7 bg-ink/20 shrink-0" />

        {/* Brush sizes */}
        <div className="flex gap-1">
          {SIZES.map(s => (
            <button
              key={s.value}
              onClick={() => { onSizeChange(s.value); if (tool === 'fill') onToolChange('brush'); }}
              className={`w-9 h-9 rounded-xl border-2 border-ink flex items-center justify-center transition-all cursor-pointer ${
                size === s.value && tool !== 'fill' ? 'bg-brand-blue' : 'bg-white hover:bg-brand-blue/10'
              }`}
              style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
              title={s.label}
            >
              <div
                className="rounded-full"
                style={{
                  width: Math.min(s.value, 18),
                  height: Math.min(s.value, 18),
                  backgroundColor: tool === 'eraser' ? '#aaa' : color,
                  border: '1px solid rgba(0,0,0,0.3)',
                }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-7 bg-ink/20 shrink-0" />

        {/* Tool buttons */}
        <button
          onClick={() => onToolChange('eraser')}
          className={toolBtn(tool === 'eraser')}
          style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
          title="Eraser"
        >
          <IconEraser size={17} className="text-ink" />
        </button>

        <button
          onClick={() => onToolChange('fill')}
          className={toolBtn(tool === 'fill')}
          style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
          title="Fill"
        >
          <IconBucket size={17} className="text-ink" />
        </button>

        <div className="w-px h-7 bg-ink/20 shrink-0" />

        <button
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="w-9 h-9 rounded-xl border-2 border-ink bg-white hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
        >
          <IconUndo size={17} className="text-ink" />
        </button>

        <button
          onClick={onClear}
          title="Clear canvas"
          className="w-9 h-9 rounded-xl border-2 border-ink bg-brand-red/20 hover:bg-brand-red/40 flex items-center justify-center transition-all cursor-pointer"
          style={{ boxShadow: '2px 2px 0 #1A1A2E' }}
        >
          <IconTrash size={17} className="text-brand-red" />
        </button>
      </div>
    </div>
  );
}
