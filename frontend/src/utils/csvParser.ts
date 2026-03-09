/** Lightweight CSV parser with Swedish column auto-detection. */

export interface ColumnMapping {
  nameIndex: number;
  fields: { index: number; key: string; label: string }[];
}

export interface BrfRow {
  name: string;
  [field: string]: string | number | undefined;
}

// Known Swedish header variants → internal field key + display label
const HEADER_MAP: Record<string, { key: string; label: string }> = {
  namn: { key: 'name', label: 'Namn' },
  fastighet: { key: 'name', label: 'Namn' },
  brf: { key: 'name', label: 'Namn' },
  förening: { key: 'name', label: 'Namn' },
  adress: { key: 'adress', label: 'Adress' },
  'gata/väg': { key: 'adress', label: 'Adress' },
  gata: { key: 'adress', label: 'Adress' },
  energiprestanda: { key: 'energyPerformance', label: 'Energiprestanda' },
  'kwh/m2': { key: 'energyPerformance', label: 'Energiprestanda' },
  'kwh/m²': { key: 'energyPerformance', label: 'Energiprestanda' },
  energideklaration: { key: 'energyClass', label: 'Energideklaration' },
  energiklass: { key: 'energyClass', label: 'Energideklaration' },
  solceller: { key: 'solarPanels', label: 'Solceller' },
  solel: { key: 'solarPanels', label: 'Solceller' },
  'antal lgh': { key: 'apartmentCount', label: 'Antal lgh' },
  lägenheter: { key: 'apartmentCount', label: 'Antal lgh' },
  'antal lägenheter': { key: 'apartmentCount', label: 'Antal lgh' },
};

/**
 * Parse CSV text into a 2D string array.
 * Handles quoted fields, embedded commas, and UTF-8 BOM.
 */
export function parseCSV(text: string): string[][] {
  // Strip UTF-8 BOM
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      current.push(field.trim());
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++; // skip \r\n
      current.push(field.trim());
      field = '';
      if (current.some((c) => c !== '')) rows.push(current);
      current = [];
    } else {
      field += ch;
    }
  }

  // Last field/row
  current.push(field.trim());
  if (current.some((c) => c !== '')) rows.push(current);

  return rows;
}

/**
 * Detect known columns from a header row.
 * Returns the name column index and mappings for all other recognized + unrecognized columns.
 */
export function detectColumns(headers: string[]): ColumnMapping {
  let nameIndex = -1;
  const fields: ColumnMapping['fields'] = [];

  headers.forEach((raw, i) => {
    const normalized = raw.toLowerCase().trim();
    const match = HEADER_MAP[normalized];

    if (match && match.key === 'name') {
      if (nameIndex === -1) nameIndex = i;
      return;
    }

    if (match) {
      fields.push({ index: i, key: match.key, label: match.label });
    } else if (normalized) {
      // Unknown column — keep as-is with raw header as label
      fields.push({ index: i, key: normalized, label: raw.trim() });
    }
  });

  return { nameIndex, fields };
}

/**
 * Parse CSV text into structured BRF rows.
 * Returns null if the CSV has no detectable name column.
 */
export function parseCSVToBrfRows(
  text: string,
): { rows: BrfRow[]; fields: ColumnMapping['fields'] } | null {
  const grid = parseCSV(text);
  if (grid.length < 2) return null;

  const headers = grid[0]!;
  const mapping = detectColumns(headers);
  if (mapping.nameIndex === -1) return null;

  const rows: BrfRow[] = [];

  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r]!;
    const name = cells[mapping.nameIndex];
    if (!name) continue;

    const row: BrfRow = { name };
    for (const f of mapping.fields) {
      const raw = cells[f.index];
      if (!raw) continue;
      const num = Number(raw.replace(',', '.'));
      row[f.key] = isNaN(num) ? raw : num;
    }
    rows.push(row);
  }

  return { rows, fields: mapping.fields };
}
