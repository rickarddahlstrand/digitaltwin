export const LABEL_MAP: Record<string, string> = {
  name: 'Namn',
  building: 'Byggnadstyp',
  'building:levels': 'Våningar',
  'roof:levels': 'Takvåningar',
  elementType: 'OSM-typ',
  elementId: 'OSM-ID',
  'cesium#latitude': 'Latitud',
  'cesium#longitude': 'Longitud',
};

export const SKIP_KEYS: Record<string, boolean> = {
  'cesium#estimatedHeight': true,
  'cesium#color': true,
};

export function formatValue(key: string, val: unknown): string {
  if (key === 'cesium#latitude' || key === 'cesium#longitude') {
    return Number(val).toFixed(5);
  }
  return String(val);
}
