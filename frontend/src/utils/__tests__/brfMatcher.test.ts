import { describe, it, expect } from 'vitest';
import { normalizeName, matchBrfToBuildings } from '../brfMatcher';
import type { BuildingRecord } from '../../lib/pocketbase';
import type { BrfRow } from '../csvParser';

function makeBuilding(name: string, propertyName = ''): BuildingRecord {
  return {
    id: name,
    osm_id: '1',
    osm_type: 'way',
    custom_name: name,
    property_name: propertyName,
    notes: '',
    categories: [],
    latitude: 59.29,
    longitude: 18.09,
    collectionId: '',
    collectionName: 'buildings',
    created: '',
    updated: '',
  };
}

function makeRow(name: string, extra?: Record<string, unknown>): BrfRow {
  return { name, ...extra };
}

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Brf Havet  ')).toBe('havet');
  });

  it('strips BRF prefix', () => {
    expect(normalizeName('BRF Sjöstaden')).toBe('sjöstaden');
  });

  it('strips HSB BRF prefix', () => {
    expect(normalizeName('HSB Brf Hammarby')).toBe('hammarby');
  });

  it('collapses whitespace', () => {
    expect(normalizeName('Brf   Sjö   Stad')).toBe('sjö stad');
  });

  it('strips Riksbyggen BRF prefix', () => {
    expect(normalizeName('Riksbyggen BRF Konvojen')).toBe('konvojen');
  });
});

describe('matchBrfToBuildings', () => {
  const buildings = [
    makeBuilding('BRF Havet'),
    makeBuilding('Brf Holmen'),
    makeBuilding('HSB BRF Hammarby Strand'),
  ];

  it('matches exact (case-insensitive, prefix-stripped)', () => {
    const rows = [makeRow('Brf Havet')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results).toHaveLength(1);
    expect(results[0]!.confidence).toBe('exact');
    expect(results[0]!.building?.custom_name).toBe('BRF Havet');
  });

  it('matches partial via substring', () => {
    const rows = [makeRow('Hammarby')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.confidence).toBe('partial');
    expect(results[0]!.building?.custom_name).toBe('HSB BRF Hammarby Strand');
  });

  it('returns none for unmatched', () => {
    const rows = [makeRow('Nonexistent BRF')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.confidence).toBe('none');
    expect(results[0]!.building).toBeNull();
  });

  it('does not double-match buildings', () => {
    const rows = [makeRow('Brf Havet'), makeRow('Havet')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.confidence).toBe('exact');
    expect(results[1]!.confidence).toBe('none'); // already taken
  });
});

describe('matchBrfToBuildings with property_name', () => {
  it('matches on property_name when custom_name is empty', () => {
    const buildings = [
      makeBuilding('', 'Böljan 4'),
    ];
    const rows = [makeRow('Böljan 4')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.confidence).toBe('exact');
    expect(results[0]!.building?.property_name).toBe('Böljan 4');
  });

  it('matches on property_name with trailing number stripped', () => {
    const buildings = [
      makeBuilding('', 'Godsvagnen 11'),
    ];
    const rows = [makeRow('Godsvagnen')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.confidence).toBe('exact');
    expect(results[0]!.building?.property_name).toBe('Godsvagnen 11');
  });

  it('prefers custom_name match over property_name match', () => {
    const buildings = [
      makeBuilding('BRF Havet', 'Havet 1'),
      makeBuilding('', 'Havet 2'),
    ];
    const rows = [makeRow('Havet')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.building?.custom_name).toBe('BRF Havet');
  });

  it('matches CSV name against property_name via substring', () => {
    const buildings = [
      makeBuilding('', 'Fredriksdal 10'),
    ];
    const rows = [makeRow('Fredriksdal')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.building?.property_name).toBe('Fredriksdal 10');
  });

  it('matches when CSV has BRF prefix but building only has property_name', () => {
    const buildings = [
      makeBuilding('', 'Knallen 1'),
    ];
    const rows = [makeRow('BRF Knallen 1')];
    const results = matchBrfToBuildings(rows, buildings);
    expect(results[0]!.building?.property_name).toBe('Knallen 1');
  });
});
