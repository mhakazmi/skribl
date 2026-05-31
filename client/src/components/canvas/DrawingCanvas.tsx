import { useRef, useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGame } from '../../context/GameContext';
import { useDrawing, Tool } from './useDrawing';
import ToolBar from './ToolBar';

export default function DrawingCanvas() {
  const socket = useSocket();
  const { state } = useGame();
  const { room, playerId } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isDrawer = room?.currentDrawerId === playerId;

  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(6);
  const [tool, setTool] = useState<Tool>('brush');

  const drawing = useDrawing(canvasRef, isDrawer, socket);

  // Clear canvas on new round
  useEffect(() => {
    if (room?.state === 'WORD_SELECT' || room?.state === 'WAITING_ROOM') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawing.clearHistory();
      }
    }
  }, [room?.state]);

  // Remote draw events
  useEffect(() => {
    socket.on('draw:stroke-start', drawing.onRemoteStrokeStart);
    socket.on('draw:stroke-move', drawing.onRemoteStrokeMove);
    socket.on('draw:stroke-end', drawing.onRemoteStrokeEnd);
    socket.on('draw:fill', drawing.onRemoteFill);
    socket.on('draw:clear', drawing.onRemoteClear);
    socket.on('draw:undo', drawing.onRemoteUndo);

    return () => {
      socket.off('draw:stroke-start', drawing.onRemoteStrokeStart);
      socket.off('draw:stroke-move', drawing.onRemoteStrokeMove);
      socket.off('draw:stroke-end', drawing.onRemoteStrokeEnd);
      socket.off('draw:fill', drawing.onRemoteFill);
      socket.off('draw:clear', drawing.onRemoteClear);
      socket.off('draw:undo', drawing.onRemoteUndo);
    };
  }, [socket, drawing]);

  // Keyboard shortcut
  useEffect(() => {
    if (!isDrawer) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        drawing.undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDrawer, drawing]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'fill') {
      drawing.doFill(e.nativeEvent, color);
    } else {
      drawing.startStroke(e.nativeEvent, tool === 'eraser' ? '#FFFFFF' : color, size);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || tool === 'fill') return;
    drawing.continueStroke(e.nativeEvent);
  };

  const handlePointerUp = () => {
    if (!isDrawer) return;
    drawing.endStroke();
  };

  const cursorClass = !isDrawer
    ? 'cursor-default'
    : tool === 'fill'
    ? 'canvas-fill'
    : tool === 'eraser'
    ? 'canvas-erase'
    : 'canvas-draw';

  return (
    <div className="flex flex-col gap-2 h-full">
      {isDrawer && (
        <ToolBar
          color={color}
          size={size}
          tool={tool}
          onColorChange={setColor}
          onSizeChange={setSize}
          onToolChange={setTool}
          onClear={drawing.clearCanvas}
          onUndo={drawing.undo}
        />
      )}
      <div className="relative flex-1 bg-white rounded-2xl overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${cursorClass} touch-none`}
          style={{ pointerEvents: isDrawer ? 'auto' : 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {!isDrawer && room?.state === 'WORD_SELECT' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 font-ui text-lg">Waiting for drawer...</p>
          </div>
        )}
      </div>
    </div>
  );
}
