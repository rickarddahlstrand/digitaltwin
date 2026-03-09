import { describe, it, expect } from 'vitest';
import { parseCSV, detectColumns, parseCSVToBrfRows } from '../csvParser';

describe('parseCSV', () => {
  it('parses simple CSV', () => {
    const result = parseCSV('a,b,c\n1,2,3');
    expect(result).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  it('handles quoted fields with commas', () => {
    const result = parseCSV('name,value\n"Hello, World",42');
    expect(result).toEqual([['name', 'value'], ['Hello, World', '42']]);
  });

  it('handles escaped quotes', () => {
    const result = parseCSV('name\n"He said ""hi"""');
    expect(result).toEqual([['name'], ['He said "hi"']]);
  });

  it('strips UTF-8 BOM', () => {
    const bom = '\uFEFF';
    const result = parseCSV(`${bom}name,val\na,1`);
    expect(result[0]![0]).toBe('name');
  });

  it('handles \\r\\n line endings', () => {
    const result = parseCSV('a,b\r\n1,2\r\n');
    expect(result).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('skips empty lines', () => {
    const result = parseCSV('a\n\nb\n');
    expect(result).toEqual([['a'], ['b']]);
  });
});

describe('detectColumns', () => {
  it('detects Swedish name column', () => {
    const mapping = detectColumns(['Namn', 'Energiprestanda', 'Solceller']);
    expect(mapping.nameIndex).toBe(0);
    expect(mapping.fields).toHaveLength(2);
    expect(mapping.fields[0]!.key).toBe('energyPerformance');
    expect(mapping.fields[1]!.key).toBe('solarPanels');
  });

  it('detects BRF as name column', () => {
    const mapping = detectColumns(['BRF', 'Antal lgh']);
    expect(mapping.nameIndex).toBe(0);
    expect(mapping.fields[0]!.key).toBe('apartmentCount');
  });

  it('preserves unknown columns with raw header', () => {
    const mapping = detectColumns(['Namn', 'Byggnadsår']);
    expect(mapping.fields[0]!.key).toBe('byggnadsår');
    expect(mapping.fields[0]!.label).toBe('Byggnadsår');
  });

  it('is case insensitive', () => {
    const mapping = detectColumns(['NAMN', 'ENERGIPRESTANDA']);
    expect(mapping.nameIndex).toBe(0);
    expect(mapping.fields[0]!.key).toBe('energyPerformance');
  });
});

describe('parseCSVToBrfRows', () => {
  it('parses CSV with known columns', () => {
    const csv = 'Namn,Energiprestanda,Solceller\nBrf Havet,120,Ja\nBrf Holmen,85,Nej';
    const result = parseCSVToBrfRows(csv);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0]!.name).toBe('Brf Havet');
    expect(result!.rows[0]!.energyPerformance).toBe(120);
    expect(result!.rows[0]!.solarPanels).toBe('Ja');
  });

  it('converts comma decimals to numbers', () => {
    const csv = 'Namn,kwh/m2\nBrf Test,"123,5"';
    const result = parseCSVToBrfRows(csv);
    expect(result!.rows[0]!.energyPerformance).toBe(123.5);
  });

  it('returns null for CSV without name column', () => {
    const csv = 'Energiprestanda,Solceller\n120,Ja';
    expect(parseCSVToBrfRows(csv)).toBeNull();
  });

  it('returns null for single-row CSV', () => {
    expect(parseCSVToBrfRows('Namn')).toBeNull();
  });

  it('skips rows with empty name', () => {
    const csv = 'Namn,Val\nBrf A,1\n,2\nBrf B,3';
    const result = parseCSVToBrfRows(csv);
    expect(result!.rows).toHaveLength(2);
  });
});
