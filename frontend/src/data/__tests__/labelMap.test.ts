import { LABEL_MAP, SKIP_KEYS, formatValue } from '../labelMap'

describe('labelMap', () => {
  it('maps OSM keys to Swedish labels', () => {
    expect(LABEL_MAP['name']).toBe('Namn')
    expect(LABEL_MAP['building']).toBe('Byggnadstyp')
    expect(LABEL_MAP['cesium#latitude']).toBe('Latitud')
  })

  it('skips estimated height and color', () => {
    expect(SKIP_KEYS['cesium#estimatedHeight']).toBe(true)
    expect(SKIP_KEYS['cesium#color']).toBe(true)
  })

  it('formats lat/lon to 5 decimals', () => {
    expect(formatValue('cesium#latitude', 59.29291234567)).toBe('59.29291')
    expect(formatValue('cesium#longitude', 18.094)).toBe('18.09400')
  })

  it('passes through other values as strings', () => {
    expect(formatValue('name', 'Kvarteret Borgen')).toBe('Kvarteret Borgen')
    expect(formatValue('building', 'apartments')).toBe('apartments')
  })
})
