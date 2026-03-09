import { useState, useCallback, useMemo } from 'react';
import { parseCSVToBrfRows, type BrfRow } from '../utils/csvParser';
import { matchBrfToBuildings, normalizeName, type MatchResult } from '../utils/brfMatcher';
import type { BuildingRecord } from '../lib/pocketbase';

export interface BrfDataState {
  matches: MatchResult[];
  fields: { index: number; key: string; label: string }[];
  colorField: string;
  visible: boolean;
  colorMin?: number;
  colorMax?: number;
  colorReversed: boolean;
}

/** Compute the value at the given percentile (0–1) from a sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

/** Get p95 max for a given color field across matches. */
function computeP95Max(matches: MatchResult[], field: string): number | undefined {
  const values = matches
    .map((m) => m.brfRow[field])
    .filter((v): v is number => typeof v === 'number');
  if (values.length < 2) return undefined;
  values.sort((a, b) => a - b);
  return percentile(values, 0.95);
}

export function useBrfData() {
  const [brfState, setBrfState] = useState<BrfDataState | null>(null);

  const importCSV = useCallback(
    (csvText: string, buildings: BuildingRecord[]): BrfDataState | null => {
      const parsed = parseCSVToBrfRows(csvText);
      if (!parsed) return null;

      const matches = matchBrfToBuildings(parsed.rows, buildings);

      // Pick first numeric field as default color field
      const numericFields = parsed.fields.filter((f) =>
        parsed.rows.some((r) => typeof r[f.key] === 'number'),
      );
      const defaultColor = numericFields[0]?.key || '';

      const state: BrfDataState = {
        matches,
        fields: parsed.fields,
        colorField: defaultColor,
        visible: true,
        colorReversed: false,
        colorMax: defaultColor ? computeP95Max(matches, defaultColor) : undefined,
      };
      setBrfState(state);
      return state;
    },
    [],
  );

  const clear = useCallback(() => setBrfState(null), []);

  const setColorField = useCallback((field: string) => {
    setBrfState((prev) => {
      if (!prev) return null;
      return { ...prev, colorField: field, colorMin: undefined, colorMax: computeP95Max(prev.matches, field) };
    });
  }, []);

  const setColorRange = useCallback((min?: number, max?: number) => {
    setBrfState((prev) => (prev ? { ...prev, colorMin: min, colorMax: max } : null));
  }, []);

  const setColorReversed = useCallback((reversed: boolean) => {
    setBrfState((prev) => (prev ? { ...prev, colorReversed: reversed } : null));
  }, []);

  const toggleVisible = useCallback(() => {
    setBrfState((prev) => (prev ? { ...prev, visible: !prev.visible } : null));
  }, []);

  const getBrfForBuilding = useCallback(
    (customName: string, address?: string): BrfRow | null => {
      if (!brfState) return null;

      // Try match via building record (name-based match from import)
      const byName = brfState.matches.find(
        (m) => m.building && m.building.custom_name === customName,
      );
      if (byName) return byName.brfRow;

      // Try match via address column in CSV (if present)
      if (address) {
        const addrNorm = address.toLowerCase().trim();
        const found = brfState.matches.find((m) => {
          const csvAddr = m.brfRow['adress'] || m.brfRow['address'] || m.brfRow['gata/väg'] || m.brfRow['gata'];
          if (!csvAddr || typeof csvAddr !== 'string') return false;
          const csvNorm = csvAddr.toLowerCase().trim();
          return csvNorm === addrNorm || csvNorm.startsWith(addrNorm) || addrNorm.startsWith(csvNorm);
        });
        if (found) return found.brfRow;
      }

      // Try fuzzy name match (e.g. OSM name "Havet" vs CSV "Havet 1")
      if (customName) {
        const nameNorm = normalizeName(customName);
        const found = brfState.matches.find((m) => {
          const csvNorm = normalizeName(m.brfRow.name);
          const csvStripped = csvNorm.replace(/\s+\d+$/, '');
          return nameNorm === csvNorm || nameNorm === csvStripped || csvNorm === nameNorm.replace(/\s+\d+$/, '');
        });
        if (found) return found.brfRow;
      }

      return null;
    },
    [brfState],
  );

  const numericFields = useMemo(() => {
    if (!brfState) return [];
    return brfState.fields.filter((f) =>
      brfState.matches.some((m) => typeof m.brfRow[f.key] === 'number'),
    );
  }, [brfState]);

  return {
    brfState,
    importCSV,
    clear,
    setColorField,
    setColorRange,
    setColorReversed,
    toggleVisible,
    getBrfForBuilding,
    numericFields,
  };
}
