import { Tool } from './useDrawing';

const COLORS = [
  '#000000', '#7F7F7F', '#C0C0C0', '#FFFFFF', '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF',
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

export default function ToolBar({
  color, size, tool,
  onColorChange, onSizeChange, onToolChange,
  onClear, onUndo,
}: ToolBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-navy-800 rounded-2xl border border-white/10 flex-wrap">
      {/* Color palette */}
      <div className="grid grid-cols-9 gap-1">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => { onColorChange(c); onToolChange('brush'); }}
            className={`color-swatch w-5 h-5 rounded-sm border ${color === c && tool !== 'eraser' ? 'active border-white' : 'border-black/30'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-white/10" />

      {/* Brush sizes */}
      <div className="flex gap-1">
        {SIZES.map(s => (
          <button
            key={s.value}
            onClick={() => { onSizeChange(s.value); if (tool === 'fill') onToolChange('brush'); }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
              ${size === s.value && tool !== 'fill' ? 'bg-brand-blue' : 'bg-navy-700 hover:bg-navy-600'}`}
            title={`Size ${s.label}`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(s.value, 20), height: Math.min(s.value, 20), color: tool === 'eraser' ? '#fff' : color }}
            />
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-white/10" />

      {/* Tools */}
      <button
        onClick={() => onToolChange('eraser')}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all
          ${tool === 'eraser' ? 'bg-brand-yellow' : 'bg-navy-700 hover:bg-navy-600'}`}
        title="Eraser"
      >
        🧹
      </button>
      <button
        onClick={() => onToolChange('fill')}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all
          ${tool === 'fill' ? 'bg-brand-yellow' : 'bg-navy-700 hover:bg-navy-600'}`}
        title="Fill (bucket)"
      >
        🪣
      </button>

      <div className="w-px h-8 bg-white/10" />

      {/* Undo / Clear */}
      <button
        onClick={onUndo}
        className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-lg transition-all"
        title="Undo (Ctrl+Z)"
      >
        ↩️
      </button>
      <button
        onClick={onClear}
        className="w-8 h-8 rounded-lg bg-brand-red/30 hover:bg-brand-red/50 flex items-center justify-center text-lg transition-all"
        title="Clear canvas"
      >
        🗑️
      </button>
    </div>
  );
}
