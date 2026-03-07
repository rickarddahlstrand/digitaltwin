import { useEffect, useState, useCallback } from 'react';
import { getBuilding, saveBuilding, getAllCategories, type BuildingRecord } from '../lib/pocketbase';
import type { BuildingInfo } from './useBuildingClick';

export function useBuildingData(buildingInfo: BuildingInfo | null) {
  const [savedData, setSavedData] = useState<BuildingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const osmId = buildingInfo?.osmId;

  useEffect(() => {
    if (!osmId) {
      setSavedData(null);
      return;
    }
    setLoading(true);
    Promise.all([getBuilding(osmId), getAllCategories()])
      .then(([record, cats]) => {
        setSavedData(record);
        setAllCategories(cats);
      })
      .finally(() => setLoading(false));
  }, [osmId]);

  const save = useCallback(
    async ({ customName, notes, categories }: { customName: string; notes: string; categories: string[] }) => {
      if (!buildingInfo?.osmId) return;
      setSaving(true);
      try {
        const record = await saveBuilding({
          osm_id: buildingInfo.osmId,
          osm_type: buildingInfo.osmType || '',
          custom_name: customName,
          notes: notes,
          categories: categories || [],
          latitude: buildingInfo.latitude || 0,
          longitude: buildingInfo.longitude || 0,
        });
        setSavedData(record);
        const cats = await getAllCategories();
        setAllCategories(cats);
      } finally {
        setSaving(false);
      }
    },
    [buildingInfo]
  );

  return { savedData, loading, saving, save, allCategories };
}
