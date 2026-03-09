import type { BrfRow } from './csvParser';
import type { BuildingRecord } from '../lib/pocketbase';

export interface MatchResult {
  brfRow: BrfRow;
  building: BuildingRecord | null;
  confidence: 'exact' | 'partial' | 'none';
}

const PREFIXES = ['hsb brf ', 'riksbyggen brf ', 'brf ', 'hsb ', 'riksbyggen '];

/** Normalize a BRF/building name for comparison. */
export function normalizeName(name: string): string {
  let n = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const prefix of PREFIXES) {
    if (n.startsWith(prefix)) {
      n = n.slice(prefix.length);
      break;
    }
  }
  return n;
}

/**
 * Strip trailing numbers from a name for fuzzy matching.
 * "havet 1" → "havet", "sjöstaden 2" → "sjöstaden"
 */
function stripTrailingNumber(name: string): string {
  return name.replace(/\s+\d+$/, '').trim();
}

/**
 * Match rows to existing buildings by name.
 * Step 1: exact match on normalized name.
 * Step 2: exact match ignoring trailing numbers (e.g. "Havet 1" → "BRF Havet").
 * Step 3: substring match (either direction).
 */
export function matchBrfToBuildings(
  brfRows: BrfRow[],
  buildings: BuildingRecord[],
): MatchResult[] {
  // Pre-normalize building names (match on both custom_name and property_name)
  const buildingEntries = buildings.map((b) => {
    const nameNorm = normalizeName(b.custom_name || '');
    const propNorm = normalizeName(b.property_name || '');
    return {
      building: b,
      normalized: nameNorm,
      propNormalized: propNorm,
      stripped: stripTrailingNumber(nameNorm),
      propStripped: stripTrailingNumber(propNorm),
    };
  });

  const usedBuildings = new Set<string>();

  return brfRows.map((brfRow) => {
    const brfNorm = normalizeName(brfRow.name);
    const brfStripped = stripTrailingNumber(brfNorm);

    // Step 1: exact match on custom_name or property_name
    for (const entry of buildingEntries) {
      if (usedBuildings.has(entry.building.id)) continue;
      if (brfNorm.length > 0 && (entry.normalized === brfNorm || entry.propNormalized === brfNorm)) {
        usedBuildings.add(entry.building.id);
        return { brfRow, building: entry.building, confidence: 'exact' as const };
      }
    }

    // Step 2: match ignoring trailing numbers
    for (const entry of buildingEntries) {
      if (usedBuildings.has(entry.building.id)) continue;
      if (
        brfStripped.length > 2 &&
        (entry.stripped === brfStripped || entry.normalized === brfStripped || entry.stripped === brfNorm
          || entry.propStripped === brfStripped || entry.propNormalized === brfStripped || entry.propStripped === brfNorm)
      ) {
        usedBuildings.add(entry.building.id);
        return { brfRow, building: entry.building, confidence: 'exact' as const };
      }
    }

    // Step 3: substring match
    for (const entry of buildingEntries) {
      if (usedBuildings.has(entry.building.id)) continue;
      const entryBest = entry.stripped.length > entry.propStripped.length ? entry.stripped : entry.propStripped;
      if (
        brfStripped.length > 2 &&
        entryBest.length > 2 &&
        (entryBest.includes(brfStripped) || brfStripped.includes(entryBest))
      ) {
        usedBuildings.add(entry.building.id);
        return { brfRow, building: entry.building, confidence: 'partial' as const };
      }
    }

    return { brfRow, building: null, confidence: 'none' as const };
  });
}
