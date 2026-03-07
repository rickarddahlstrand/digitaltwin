import { describe, it, expect } from 'vitest';
import { arcPositions, formatKwh, type EnergyLink } from '../useEnergyLinks';

const testLink: EnergyLink = {
  from: { name: 'A', lon: 18.0, lat: 59.0 },
  to: { name: 'B', lon: 18.1, lat: 59.1 },
  surplusKwh: 5000,
  producedKwh: 40000,
  purchasedKwh: 200000,
  monthlySurplus: [0, 0, 0, 100, 500, 1000, 1500, 1000, 500, 100, 0, 0],
};

describe('arcPositions', () => {
  it('returns correct number of coordinates (3 per segment point)', () => {
    const coords = arcPositions(testLink, 10, 40);
    // 10 segments = 11 points, 3 values each (lon, lat, alt)
    expect(coords.length).toBe(11 * 3);
  });

  it('starts at from position', () => {
    const coords = arcPositions(testLink, 10, 40);
    expect(coords[0]).toBe(testLink.from.lon);
    expect(coords[1]).toBe(testLink.from.lat);
  });

  it('ends at to position', () => {
    const coords = arcPositions(testLink, 10, 40);
    const lastIdx = coords.length - 3;
    expect(coords[lastIdx]).toBe(testLink.to.lon);
    expect(coords[lastIdx + 1]).toBe(testLink.to.lat);
  });

  it('has peak altitude at midpoint', () => {
    const coords = arcPositions(testLink, 10, 40);
    // Midpoint is at index 5 (of 11 points), altitude at index 5*3+2
    const midAlt = coords[5 * 3 + 2]!;
    const startAlt = coords[2]!;
    const endAlt = coords[coords.length - 1]!;
    expect(midAlt).toBeGreaterThan(startAlt);
    expect(midAlt).toBeGreaterThan(endAlt);
  });

  it('start and end altitude equal base altitude (40m)', () => {
    const coords = arcPositions(testLink, 10, 40);
    // At t=0 and t=1, alt = 40 + peakAlt * 4 * 0 = 40
    expect(coords[2]).toBe(40);
    expect(coords[coords.length - 1]).toBe(40);
  });

  it('handles single segment', () => {
    const coords = arcPositions(testLink, 1, 40);
    expect(coords.length).toBe(2 * 3); // 2 points
  });
});

describe('formatKwh', () => {
  it('formats values >= 1000 as MWh', () => {
    expect(formatKwh(1000)).toBe('1.0 MWh');
    expect(formatKwh(3711)).toBe('3.7 MWh');
    expect(formatKwh(12297)).toBe('12.3 MWh');
  });

  it('formats values < 1000 as kWh', () => {
    expect(formatKwh(999)).toBe('999 kWh');
    expect(formatKwh(0)).toBe('0 kWh');
    expect(formatKwh(148)).toBe('148 kWh');
  });

  it('rounds MWh to one decimal', () => {
    expect(formatKwh(1550)).toBe('1.6 MWh');
    expect(formatKwh(9503)).toBe('9.5 MWh');
  });
});
