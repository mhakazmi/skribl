import { useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

export type Tool = 'brush' | 'eraser' | 'fill';

interface StrokePoint { x: number; y: number }
interface Stroke {
  type: 'stroke';
  color: string;
  size: number;
  points: StrokePoint[];
}
interface FillOp {
  type: 'fill';
  x: number;
  y: number;
  color: string;
}
type DrawOp = Stroke | FillOp;

export function useDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isDrawer: boolean,
  socket: Socket,
) {
  const history = useRef<DrawOp[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const pendingPoints = useRef<StrokePoint[]>([]);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPointerDown = useRef(false);

  // Normalise canvas coordinates to 0–1 range
  const norm = useCallback((canvas: HTMLCanvasElement, x: number, y: number): StrokePoint => {
    const r = canvas.getBoundingClientRect();
    return { x: (x - r.left) / r.width, y: (y - r.top) / r.height };
  }, []);

  const getCtx = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return null;
    return c.getContext('2d');
  }, [canvasRef]);

  // Redraw everything from history
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const op of history.current) {
      if (op.type === 'stroke') {
        renderStroke(ctx, canvas, op);
      } else {
        floodFill(ctx, canvas, op.x, op.y, op.color);
      }
    }
  }, [canvasRef, getCtx]);

  function renderStroke(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, stroke: Stroke) {
    if (stroke.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = stroke.color === '#FFFFFF' ? 'source-over' : 'source-over';
    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * canvas.width, p0.y * canvas.height);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
    }
    ctx.stroke();
    ctx.restore();
  }

  function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function floodFill(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, nx: number, ny: number, color: string) {
    const x = Math.round(nx * canvas.width);
    const y = Math.round(ny * canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;
    const idx = (y * w + x) * 4;
    const [tr, tg, tb] = [data[idx], data[idx + 1], data[idx + 2]];
    const [fr, fg, fb] = hexToRgb(color);
    if (tr === fr && tg === fg && tb === fb) return;

    const stack = [idx];
    const visited = new Uint8Array(data.length / 4);

    while (stack.length) {
      const i = stack.pop()!;
      if (visited[i / 4]) continue;
      visited[i / 4] = 1;
      if (data[i] !== tr || data[i + 1] !== tg || data[i + 2] !== tb) continue;
      data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
      const px = (i / 4) % w;
      const py = Math.floor(i / 4 / w);
      if (px > 0) stack.push(i - 4);
      if (px < w - 1) stack.push(i + 4);
      if (py > 0) stack.push(i - w * 4);
      if (py < h - 1) stack.push(i + w * 4);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // ---- Drawing actions ----

  const startStroke = useCallback((e: PointerEvent, color: string, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isPointerDown.current = true;
    const pt = norm(canvas, e.clientX, e.clientY);
    currentStroke.current = { type: 'stroke', color, size, points: [pt] };

    if (isDrawer) {
      socket.emit('draw:stroke-start', { x: pt.x, y: pt.y, color, size });
      flushRef.current = setInterval(() => {
        if (pendingPoints.current.length > 0) {
          socket.emit('draw:stroke-move', { points: [...pendingPoints.current] });
          pendingPoints.current = [];
        }
      }, 30);
    }

    // Draw dot for click
    const ctx = getCtx();
    if (ctx) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [canvasRef, isDrawer, socket, norm, getCtx]);

  const continueStroke = useCallback((e: PointerEvent) => {
    if (!isPointerDown.current || !currentStroke.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = norm(canvas, e.clientX, e.clientY);
    const stroke = currentStroke.current;
    stroke.points.push(pt);

    if (isDrawer) pendingPoints.current.push(pt);

    // Incremental draw
    const ctx = getCtx();
    if (ctx && stroke.points.length >= 2) {
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const prev = stroke.points[stroke.points.length - 2];
      ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
      ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      ctx.stroke();
      ctx.restore();
    }
  }, [canvasRef, isDrawer, norm, getCtx]);

  const endStroke = useCallback(() => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    if (currentStroke.current) {
      history.current.push(currentStroke.current);
    }
    currentStroke.current = null;

    if (isDrawer) {
      if (flushRef.current) { clearInterval(flushRef.current); flushRef.current = null; }
      if (pendingPoints.current.length > 0) {
        socket.emit('draw:stroke-move', { points: [...pendingPoints.current] });
        pendingPoints.current = [];
      }
      socket.emit('draw:stroke-end', {});
    }
  }, [isDrawer, socket]);

  const doFill = useCallback((e: PointerEvent, color: string) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const pt = norm(canvas, e.clientX, e.clientY);
    const op: FillOp = { type: 'fill', x: pt.x, y: pt.y, color };
    history.current.push(op);
    floodFill(ctx, canvas, pt.x, pt.y, color);
    if (isDrawer) socket.emit('draw:fill', { x: pt.x, y: pt.y, color });
  }, [canvasRef, isDrawer, socket, norm, getCtx]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    history.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isDrawer) socket.emit('draw:clear', {});
  }, [canvasRef, isDrawer, socket, getCtx]);

  const undo = useCallback(() => {
    if (!isDrawer) return;
    history.current.pop();
    redraw();
    socket.emit('draw:undo', {});
  }, [isDrawer, redraw, socket]);

  // ---- Remote event receivers ----
  const remoteStroke = useRef<Stroke | null>(null);

  const onRemoteStrokeStart = useCallback((data: { x: number; y: number; color: string; size: number }) => {
    remoteStroke.current = { type: 'stroke', color: data.color, size: data.size, points: [{ x: data.x, y: data.y }] };
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.arc(data.x * canvas.width, data.y * canvas.height, data.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [canvasRef, getCtx]);

  const onRemoteStrokeMove = useCallback((data: { points: StrokePoint[] }) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || !remoteStroke.current) return;
    const stroke = remoteStroke.current;
    const prevLast = stroke.points[stroke.points.length - 1];
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prevLast.x * canvas.width, prevLast.y * canvas.height);
    for (const p of data.points) {
      ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      stroke.points.push(p);
    }
    ctx.stroke();
    ctx.restore();
  }, [canvasRef, getCtx]);

  const onRemoteStrokeEnd = useCallback(() => {
    if (remoteStroke.current) {
      history.current.push(remoteStroke.current);
      remoteStroke.current = null;
    }
  }, []);

  const onRemoteFill = useCallback((data: { x: number; y: number; color: string }) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const op: FillOp = { type: 'fill', x: data.x, y: data.y, color: data.color };
    history.current.push(op);
    floodFill(ctx, canvas, data.x, data.y, data.color);
  }, [canvasRef, getCtx]);

  const onRemoteClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    history.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef, getCtx]);

  const onRemoteUndo = useCallback(() => {
    history.current.pop();
    redraw();
  }, [redraw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redraw();
    });
    observer.observe(canvas.parentElement ?? canvas);
    return () => observer.disconnect();
  }, [canvasRef, redraw]);

  return {
    startStroke,
    continueStroke,
    endStroke,
    doFill,
    clearCanvas,
    undo,
    onRemoteStrokeStart,
    onRemoteStrokeMove,
    onRemoteStrokeEnd,
    onRemoteFill,
    onRemoteClear,
    onRemoteUndo,
    clearHistory: () => { history.current = []; },
  };
}
