// Reuse a single off-screen canvas for text measurement
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

// Cache generated data URLs to avoid duplicate canvas work and reduce memory
const markerCache = new Map<string, string>();

/** Clear the marker image cache (call after BRF recoloring etc.) */
export function clearMarkerCache(): void {
  markerCache.clear();
}

export function createMarkerCanvas(label: string | string[], bgColor?: string): string | null {
  const lines = Array.isArray(label) ? label : [label];
  if (lines.length === 0 || !lines[0]) return null;

  const cacheKey = lines.join('\n') + '|' + (bgColor || '');
  const cached = markerCache.get(cacheKey);
  if (cached) return cached;

  const dpr = 2;
  const fontSize = 13 * dpr;
  const lineHeight = fontSize * 1.35;
  const px = 8 * dpr;
  const py = 4 * dpr;

  measureCtx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const maxTw = Math.max(...lines.map((l) => measureCtx.measureText(l).width));

  const w = maxTw + px * 2;
  const h = py * 2 + lineHeight * (lines.length - 1) + fontSize;
  const r = 5 * dpr;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background pill
  ctx.fillStyle = bgColor || 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = dpr;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.stroke();

  // Text
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < lines.length; i++) {
    const y = py + fontSize / 2 + i * lineHeight;
    ctx.fillText(lines[i]!, w / 2, y);
  }

  // Return data URL so the canvas can be GC'd safely
  const dataUrl = canvas.toDataURL();
  markerCache.set(cacheKey, dataUrl);
  return dataUrl;
}
