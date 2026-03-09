import { useEffect, useRef, useCallback, useState } from 'react';
import { useCesium } from '../context/CesiumContext';
import { createMarkerCanvas, clearMarkerCache } from '../utils/markerCanvas';
import { getAllBuildings, type BuildingRecord } from '../lib/pocketbase';
import type { BrfDataState } from './useBrfData';
import type { Entity } from 'cesium';

interface MarkerEntry {
  entity: Entity;
  categories: string[];
  buildingName: string;
}

/**
 * Map a numeric value to a green→yellow→red hue.
 * low values = green (hue 120), high values = red (hue 0).
 * If reversed, low = red, high = green.
 */
function valueToColor(value: number, min: number, max: number, reversed = false): string {
  if (max === min) return 'hsla(120, 80%, 45%, 0.85)';
  let t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (reversed) t = 1 - t;
  const hue = 120 * (1 - t); // 120 = green, 0 = red
  return `hsla(${Math.round(hue)}, 80%, 45%, 0.85)`;
}

export function usePOIs() {
  const { viewerRef, isReady } = useCesium();
  const entitiesRef = useRef<MarkerEntry[]>([]);
  const activeCatsRef = useRef(new Set<string>(['Energigemenskapen']));
  const buildingsRef = useRef<BuildingRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);

  const loadMarkers = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    entitiesRef.current.forEach((e) => {
      if (!viewer.isDestroyed()) viewer.entities.remove(e.entity);
    });
    entitiesRef.current = [];

    try {
      const buildings: BuildingRecord[] = await getAllBuildings();
      buildingsRef.current = buildings;

      const catSet = new Set<string>();

      // Group buildings by position to avoid overlapping labels
      const posKey = (b: BuildingRecord) => `${b.latitude},${b.longitude}`;
      const groups = new Map<string, BuildingRecord[]>();
      for (const b of buildings) {
        if (!b.latitude || !b.longitude) continue;
        const key = posKey(b);
        const arr = groups.get(key);
        if (arr) arr.push(b);
        else groups.set(key, [b]);
      }

      for (const group of groups.values()) {
        const first = group[0]!;
        const labels = group.map((b) => b.custom_name || b.property_name || `#${b.osm_id}`);

        const markerImage = createMarkerCanvas(labels);
        if (!markerImage) continue;

        // Merge categories from all buildings at this position
        const cats = new Set<string>();
        for (const b of group) {
          const c = Array.isArray(b.categories) ? b.categories : [];
          c.forEach((cat) => cats.add(cat));
        }
        const catsArr = [...cats];
        catsArr.forEach((c) => catSet.add(c));

        const position = Cesium.Cartesian3.fromDegrees(
          first.longitude,
          first.latitude,
          45
        );

        // Determine visibility based on active category filter
        const show = activeCatsRef.current.size === 0
          || catsArr.some((c) => activeCatsRef.current.has(c));

        const entity = viewer.entities.add({
          name: labels.join('\n'),
          position,
          billboard: {
            image: markerImage,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scale: 0.8,
            scaleByDistance: new Cesium.NearFarScalar(200, 1.2, 2000, 0.35),
          },
          show,
          properties: {
            osmId: first.osm_id,
            osmType: first.osm_type || 'way',
            latitude: first.latitude,
            longitude: first.longitude,
            address: first.metadata?.address || '',
            isBuildingMarker: true,
          },
        });

        // Register one marker entry per building in the group (for recoloring)
        for (const b of group) {
          entitiesRef.current.push({ entity, categories: catsArr, buildingName: b.custom_name || '' });
        }
      }

      setCategories([...catSet].sort());
    } catch (err) {
      console.error('Failed to load building markers:', err);
    }
  }, [viewerRef]);

  useEffect(() => {
    if (isReady) loadMarkers();
  }, [isReady, loadMarkers]);

  const updateVisibility = () => {
    const viewer = viewerRef.current;
    const showAll = activeCatsRef.current.size === 0;
    entitiesRef.current.forEach(({ entity, categories: cats }) => {
      entity.show = showAll || cats.some((c) => activeCatsRef.current.has(c));
    });
    if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
  };

  const showAllBuildings = () => {
    activeCatsRef.current.clear();
    updateVisibility();
    forceUpdate((n) => n + 1);
  };

  const toggleCategory = (cat: string) => {
    if (activeCatsRef.current.has(cat)) {
      activeCatsRef.current.delete(cat);
    } else {
      activeCatsRef.current.add(cat);
    }
    updateVisibility();
    forceUpdate((n) => n + 1);
  };

  const isCategoryActive = (cat: string) => activeCatsRef.current.has(cat);
  const isShowingAll = () => activeCatsRef.current.size === 0;

  /** Recolor markers based on BRF data, or reset to default if null. */
  const recolorMarkers = useCallback((brfState: BrfDataState | null) => {
    clearMarkerCache();
    if (!brfState || !brfState.visible || !brfState.colorField) {
      // Reset all markers to default color
      entitiesRef.current.forEach(({ entity, buildingName }) => {
        const raw = entity.name || buildingName;
        const labels = raw.includes('\n') ? raw.split('\n') : raw;
        const img = createMarkerCanvas(labels);
        if (img && entity.billboard) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entity.billboard.image as any) = img;
        }
      });
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
      return;
    }

    // Build lookup: building custom_name → brfRow
    const lookup = new Map<string, Record<string, unknown>>();
    for (const m of brfState.matches) {
      if (m.building) {
        lookup.set(m.building.custom_name, m.brfRow);
      }
    }

    // Compute min/max for the color field (use custom range if set)
    const values: number[] = [];
    for (const m of brfState.matches) {
      const v = m.brfRow[brfState.colorField];
      if (typeof v === 'number') values.push(v);
    }
    const min = brfState.colorMin ?? Math.min(...values);
    const max = brfState.colorMax ?? Math.max(...values);
    const reversed = brfState.colorReversed ?? false;

    entitiesRef.current.forEach(({ entity, buildingName }) => {
      const raw = entity.name || buildingName;
      const labels = raw.includes('\n') ? raw.split('\n') : raw;
      const brfRow = lookup.get(buildingName);
      const val = brfRow?.[brfState.colorField];
      const color = typeof val === 'number' ? valueToColor(val, min, max, reversed) : undefined;
      const img = createMarkerCanvas(labels, color);
      if (img && entity.billboard) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entity.billboard.image as any) = img;
      }
    });
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
  }, [viewerRef]);

  return {
    showAllBuildings,
    toggleCategory,
    isCategoryActive,
    isShowingAll,
    reload: loadMarkers,
    recolorMarkers,
    categories,
    buildings: buildingsRef,
  };
}
