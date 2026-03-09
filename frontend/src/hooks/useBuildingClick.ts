import { useEffect, useRef, useState } from 'react';
import { useCesium } from '../context/CesiumContext';
import { LABEL_MAP, SKIP_KEYS, formatValue } from '../data/labelMap';
import type { Entity } from 'cesium';

export interface BuildingInfo {
  name: string;
  address: string;
  rows: Array<{ label: string; value: string }>;
  osmLink: string | null;
  osmId: string;
  osmType: string;
  latitude: number;
  longitude: number;
}

export function useBuildingClick() {
  const { viewerRef, osmTilesetRef, isReady } = useCesium();
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const markerRef = useRef<Entity | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Click marker entity
    const marker = viewer.entities.add({
      show: false,
      position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#4a9eff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    markerRef.current = marker;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler.setInputAction((movement: any) => {
      const pickedObjects = viewer.scene.drillPick(movement.position);

      // 1. Check for billboard entity click (building markers from usePOIs)
      for (let i = 0; i < pickedObjects.length; i++) {
        const p = pickedObjects[i];
        const entity = p?.id;
        if (entity && entity.billboard && entity.properties?.isBuildingMarker) {
          const props = entity.properties;
          const osmId = String(props.osmId?.getValue?.() ?? props.osmId ?? '');
          const osmType = String(props.osmType?.getValue?.() ?? props.osmType ?? 'way');
          const lat = Number(props.latitude?.getValue?.() ?? props.latitude ?? 0);
          const lon = Number(props.longitude?.getValue?.() ?? props.longitude ?? 0);
          const addr = String(props.address?.getValue?.() ?? props.address ?? '');
          const name = entity.name || 'Byggnad';

          marker.show = false; // no blue dot needed for marker click

          setBuildingInfo({
            name,
            address: addr,
            rows: [],
            osmLink: osmId ? `https://www.openstreetmap.org/${osmType}/${osmId}` : null,
            osmId,
            osmType,
            latitude: lat,
            longitude: lon,
          });
          return;
        }
      }

      // 2. Check for OSM 3D tile feature click
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let feature: any = null;
      for (let i = 0; i < pickedObjects.length; i++) {
        const p = pickedObjects[i] as { tileset?: unknown; getPropertyIds?: () => string[] };
        if (
          p.tileset === osmTilesetRef.current &&
          typeof p.getPropertyIds === 'function'
        ) {
          feature = p;
          break;
        }
      }

      if (!feature) {
        setBuildingInfo(null);
        marker.show = false;
        return;
      }

      // Place marker
      const clickPosition = viewer.scene.pickPosition(movement.position);
      if (clickPosition) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (marker as any).position = clickPosition;
        marker.show = true;
      }

      // Build info
      const name = feature.getProperty('name') || 'Byggnad';

      const props: string[] = feature.getPropertyIds();
      const rows: Array<{ label: string; value: string }> = [];
      props.forEach((key: string) => {
        if (SKIP_KEYS[key]) return;
        const val = feature.getProperty(key);
        if (val !== undefined && val !== null && val !== '') {
          rows.push({
            label: LABEL_MAP[key] || key,
            value: formatValue(key, val),
          });
        }
      });

      const osmId = String(feature.getProperty('elementId'));
      const osmType = String(feature.getProperty('elementType'));
      let osmLink: string | null = null;
      if (osmId && osmType) {
        osmLink = `https://www.openstreetmap.org/${osmType}/${osmId}`;
      }

      const latitude = feature.getProperty('cesium#latitude');
      const longitude = feature.getProperty('cesium#longitude');

      // Build address string from OSM addr:* properties
      const street = feature.getProperty('addr:street') || '';
      const houseNumber = feature.getProperty('addr:housenumber') || '';
      const address = street && houseNumber ? `${street} ${houseNumber}` : street || '';

      setBuildingInfo({ name, address, rows, osmLink, osmId, osmType, latitude, longitude });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.entities.remove(marker);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const clearSelection = () => {
    setBuildingInfo(null);
    if (markerRef.current) markerRef.current.show = false;
  };

  return { buildingInfo, clearSelection };
}
