import PocketBase, { RecordModel } from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_PB_URL || window.location.origin);

export interface BuildingRecord extends RecordModel {
  osm_id: string;
  osm_type: string;
  custom_name: string;
  notes: string;
  categories: string[];
  latitude: number;
  longitude: number;
}

export async function getBuilding(osmId: string): Promise<BuildingRecord | null> {
  try {
    const result = await pb.collection('buildings').getList<BuildingRecord>(1, 1, {
      filter: `osm_id='${osmId}'`,
      requestKey: `getBuilding-${osmId}`,
    });
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}

export async function saveBuilding(record: Partial<BuildingRecord>): Promise<BuildingRecord> {
  const existing = await getBuilding(record.osm_id!);
  if (existing) {
    return pb.collection('buildings').update<BuildingRecord>(existing.id, record);
  }
  return pb.collection('buildings').create<BuildingRecord>(record);
}

export async function getAllBuildings(): Promise<BuildingRecord[]> {
  try {
    const result = await pb.collection('buildings').getList<BuildingRecord>(1, 200, {
      requestKey: 'getAllBuildings',
    });
    return result.items;
  } catch {
    return [];
  }
}

export async function getAllCategories(): Promise<string[]> {
  const buildings = await getAllBuildings();
  const set = new Set<string>();
  for (const b of buildings) {
    const cats = b.categories;
    if (Array.isArray(cats)) cats.forEach((c) => set.add(c));
  }
  return [...set].sort();
}

export async function deleteBuilding(osmId: string): Promise<void> {
  const existing = await getBuilding(osmId);
  if (existing) {
    await pb.collection('buildings').delete(existing.id);
  }
}

export interface SettingsMap {
  [key: string]: string;
}

export async function getSettings(): Promise<SettingsMap> {
  try {
    const result = await pb.collection('settings').getList(1, 50, {
      requestKey: 'getSettings',
    });
    const map: SettingsMap = {};
    for (const item of result.items) {
      map[item['key'] as string] = item['value'] as string;
    }
    return map;
  } catch {
    return {};
  }
}
