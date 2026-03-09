import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock canvas 2D context since happy-dom doesn't support it
const mockCtx = {
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  textAlign: '',
  textBaseline: '',
  measureText: vi.fn(() => ({ width: 100 })),
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
};

const mockToDataURL = vi.fn(() => 'data:image/png;base64,mockdata');

beforeEach(() => {
  vi.restoreAllMocks();
  mockToDataURL.mockReturnValue('data:image/png;base64,mockdata');

  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      const canvas = origCreateElement('canvas');
      // Override getContext to return our mock
      canvas.getContext = (() => mockCtx) as typeof canvas.getContext;
      canvas.toDataURL = mockToDataURL;
      return canvas;
    }
    return origCreateElement(tag);
  });
});

describe('createMarkerCanvas', () => {
  it('returns null for empty label', async () => {
    const { createMarkerCanvas } = await import('../markerCanvas');
    expect(createMarkerCanvas('')).toBeNull();
  });

  it('returns a data URL string for valid label', async () => {
    vi.resetModules();
    const { createMarkerCanvas } = await import('../markerCanvas');
    const result = createMarkerCanvas('BRF Sundet');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result!.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('returns a string (not HTMLCanvasElement) to prevent GC black-label bug', async () => {
    vi.resetModules();
    const { createMarkerCanvas } = await import('../markerCanvas');
    const result = createMarkerCanvas('Test Label');
    expect(result).toBeTypeOf('string');
    expect(result).not.toBeInstanceOf(HTMLCanvasElement);
  });

  it('calls toDataURL to produce a stable image reference', async () => {
    vi.resetModules();
    const { createMarkerCanvas } = await import('../markerCanvas');
    createMarkerCanvas('Test');
    expect(mockToDataURL).toHaveBeenCalled();
  });

  it('uses the label for text rendering', async () => {
    vi.resetModules();
    const { createMarkerCanvas } = await import('../markerCanvas');
    createMarkerCanvas('Sjöportalen 1');
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'Sjöportalen 1',
      expect.any(Number),
      expect.any(Number),
    );
  });
});

describe('markerCanvas cache', () => {
  it('returns cached result for same label', async () => {
    vi.resetModules();
    const { createMarkerCanvas, clearMarkerCache } = await import('../markerCanvas');
    clearMarkerCache();

    const first = createMarkerCanvas('Cached Label');
    mockToDataURL.mockClear();

    const second = createMarkerCanvas('Cached Label');
    expect(second).toBe(first);
    // Should NOT call toDataURL again — served from cache
    expect(mockToDataURL).not.toHaveBeenCalled();
  });

  it('returns cached result for same label + bgColor', async () => {
    vi.resetModules();
    const { createMarkerCanvas, clearMarkerCache } = await import('../markerCanvas');
    clearMarkerCache();

    const first = createMarkerCanvas('Test', 'red');
    mockToDataURL.mockClear();

    const second = createMarkerCanvas('Test', 'red');
    expect(second).toBe(first);
    expect(mockToDataURL).not.toHaveBeenCalled();
  });

  it('produces different results for different bgColor', async () => {
    vi.resetModules();
    mockToDataURL
      .mockReturnValueOnce('data:image/png;base64,color1')
      .mockReturnValueOnce('data:image/png;base64,color2');
    const { createMarkerCanvas, clearMarkerCache } = await import('../markerCanvas');
    clearMarkerCache();

    const a = createMarkerCanvas('Test', 'red');
    const b = createMarkerCanvas('Test', 'green');
    expect(a).not.toBe(b);
  });

  it('clearMarkerCache invalidates the cache', async () => {
    vi.resetModules();
    const { createMarkerCanvas, clearMarkerCache } = await import('../markerCanvas');
    clearMarkerCache();

    mockToDataURL.mockReturnValueOnce('data:image/png;base64,first');
    const first = createMarkerCanvas('Clear Test');
    expect(first).toBe('data:image/png;base64,first');

    // Second call should be cached
    const cached = createMarkerCanvas('Clear Test');
    expect(cached).toBe(first);

    // After clearing, a new call should generate a fresh image
    clearMarkerCache();
    mockToDataURL.mockReturnValueOnce('data:image/png;base64,second');
    const second = createMarkerCanvas('Clear Test');
    expect(second).toBe('data:image/png;base64,second');
    expect(second).not.toBe(first);
  });

  it('caches multi-line labels correctly', async () => {
    vi.resetModules();
    const { createMarkerCanvas, clearMarkerCache } = await import('../markerCanvas');
    clearMarkerCache();

    const first = createMarkerCanvas(['Line 1', 'Line 2']);
    mockToDataURL.mockClear();

    const second = createMarkerCanvas(['Line 1', 'Line 2']);
    expect(second).toBe(first);
    expect(mockToDataURL).not.toHaveBeenCalled();
  });
});
