export const LABEL_MAP = {
  name: 'Namn',
  building: 'Byggnadstyp',
  'building:levels': 'Våningar',
  'roof:levels': 'Takvåningar',
  elementType: 'OSM-typ',
  elementId: 'OSM-ID',
  'cesium#latitude': 'Latitud',
  'cesium#longitude': 'Longitud',
};

export const SKIP_KEYS = {
  'cesium#estimatedHeight': true,
  'cesium#color': true,
};

export function formatValue(key, val) {
  if (key === 'cesium#latitude' || key === 'cesium#longitude') {
    return Number(val).toFixed(5);
  }
  return val;
}
