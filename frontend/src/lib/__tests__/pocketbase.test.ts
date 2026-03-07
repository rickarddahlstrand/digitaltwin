import { describe, it, expect } from 'vitest'

describe('pocketbase module', () => {
  it('exports expected functions', async () => {
    const pb = await import('../pocketbase')
    expect(typeof pb.getBuilding).toBe('function')
    expect(typeof pb.saveBuilding).toBe('function')
    expect(typeof pb.getAllBuildings).toBe('function')
    expect(typeof pb.getAllCategories).toBe('function')
    expect(typeof pb.deleteBuilding).toBe('function')
  })
})
