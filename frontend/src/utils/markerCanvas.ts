// Reuse a single off-screen canvas for text measurement
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

export function createMarkerCanvas(label: string): string | null {
  if (!label) return null;

  const dpr = 2;
  const fontSize = 13 * dpr;
  const px = 8 * dpr;
  const py = 4 * dpr;

  measureCtx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const tw = measureCtx.measureText(label).width;

  const w = tw + px * 2;
  const h = fontSize + py * 2;
  const r = 5 * dpr;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
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
  ctx.fillText(label, w / 2, h / 2);

  // Return data URL so the canvas can be GC'd safely
  return canvas.toDataURL();
}
