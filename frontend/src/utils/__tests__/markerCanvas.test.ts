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
    // Re-import to pick up mocked canvas
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
    // The black labels bug was caused by returning a canvas element
    // that got GC'd before CesiumJS read the pixels. Returning a
    // data URL string avoids this.
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
