import { useEffect, useRef, useCallback, useState } from 'react';
import { useCesium } from '../context/CesiumContext';
import { createMarkerCanvas } from '../utils/markerCanvas';
import { getAllBuildings, type BuildingRecord } from '../lib/pocketbase';
import type { Entity } from 'cesium';

interface MarkerEntry {
  entity: Entity;
  categories: string[];
}

export function usePOIs() {
  const { viewerRef, isReady } = useCesium();
  const entitiesRef = useRef<MarkerEntry[]>([]);
  const activeCatsRef = useRef(new Set<string>(['Energigemenskapen']));
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

      const catSet = new Set<string>();

      buildings.forEach((b) => {
        if (!b.latitude || !b.longitude) return;

        const label = b.custom_name || `#${b.osm_id}`;
        const markerImage = createMarkerCanvas(label);
        if (!markerImage) return;
        const cats = Array.isArray(b.categories) ? b.categories : [];
        cats.forEach((c) => catSet.add(c));

        const position = Cesium.Cartesian3.fromDegrees(
          b.longitude,
          b.latitude,
          45
        );

        // Determine visibility based on active category filter
        const show = activeCatsRef.current.size === 0
          || cats.some((c) => activeCatsRef.current.has(c));

        const entity = viewer.entities.add({
          name: label,
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
        });

        entitiesRef.current.push({ entity, categories: cats });
      });

      setCategories([...catSet].sort());
    } catch (err) {
      console.error('Failed to load building markers:', err);
    }
  }, [viewerRef]);

  useEffect(() => {
    if (isReady) loadMarkers();
  }, [isReady, loadMarkers]);

  const updateVisibility = () => {
    const showAll = activeCatsRef.current.size === 0;
    entitiesRef.current.forEach(({ entity, categories: cats }) => {
      entity.show = showAll || cats.some((c) => activeCatsRef.current.has(c));
    });
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

  return {
    showAllBuildings,
    toggleCategory,
    isCategoryActive,
    isShowingAll,
    reload: loadMarkers,
    categories,
  };
}
