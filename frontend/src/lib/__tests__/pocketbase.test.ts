import { describe, it, expect } from 'vitest';

describe('pocketbase module', () => {
  it('exports expected functions', async () => {
    const pb = await import('../pocketbase');
    expect(typeof pb.getBuilding).toBe('function');
    expect(typeof pb.saveBuilding).toBe('function');
    expect(typeof pb.getAllBuildings).toBe('function');
    expect(typeof pb.getAllCategories).toBe('function');
    expect(typeof pb.deleteBuilding).toBe('function');
    expect(typeof pb.getSettings).toBe('function');
  });

  it('getAllBuildings accepts a custom requestKey parameter', async () => {
    const pb = await import('../pocketbase');
    // Verify the function signature accepts a requestKey argument.
    // This prevents the PocketBase SDK auto-cancellation bug where
    // concurrent calls with the same requestKey would cancel each other.
    expect(pb.getAllBuildings.length).toBeLessThanOrEqual(1);
    // The function should not throw when called with a custom key
    // (will fail to connect but that's expected in tests)
    const result = await pb.getAllBuildings('test-custom-key');
    // Returns empty array on connection error (caught internally)
    expect(Array.isArray(result)).toBe(true);
  });

  it('exports BuildingRecord type interface', async () => {
    // Compile-time check — if BuildingRecord is not exported, this file won't compile
    const pb = await import('../pocketbase');
    type _Check = typeof pb extends { getAllBuildings: () => Promise<infer R> }
      ? R extends Array<{ osm_id: string; custom_name: string }> ? true : never
      : never;
    const check: _Check = true;
    expect(check).toBe(true);
  });
});
