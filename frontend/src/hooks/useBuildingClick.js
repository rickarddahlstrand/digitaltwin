import { useEffect, useRef, useState } from 'react';
import { useCesium } from '../context/CesiumContext';
import { LABEL_MAP, SKIP_KEYS, formatValue } from '../data/labelMap';

const Cesium = window.Cesium;

export function useBuildingClick() {
  const { viewerRef, osmTilesetRef, isReady } = useCesium();
  const [buildingInfo, setBuildingInfo] = useState(null);
  const markerRef = useRef(null);

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

    handler.setInputAction((movement) => {
      const pickedObjects = viewer.scene.drillPick(movement.position);

      // Duck-type check — instanceof fails with minified CDN build
      let feature = null;
      for (let i = 0; i < pickedObjects.length; i++) {
        const p = pickedObjects[i];
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
        marker.position = clickPosition;
        marker.show = true;
      }

      // Build info
      const name =
        feature.getProperty('name') ||
        feature.getProperty('building') ||
        'Byggnad';

      const props = feature.getPropertyIds();
      const rows = [];
      props.forEach((key) => {
        if (SKIP_KEYS[key]) return;
        const val = feature.getProperty(key);
        if (val !== undefined && val !== null && val !== '') {
          rows.push({
            label: LABEL_MAP[key] || key,
            value: formatValue(key, val),
          });
        }
      });

      const osmId = feature.getProperty('elementId');
      const osmType = feature.getProperty('elementType');
      let osmLink = null;
      if (osmId && osmType) {
        osmLink = `https://www.openstreetmap.org/${osmType}/${osmId}`;
      }

      const latitude = feature.getProperty('cesium#latitude');
      const longitude = feature.getProperty('cesium#longitude');

      setBuildingInfo({ name, rows, osmLink, osmId, osmType, latitude, longitude });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.entities.remove(marker);
      }
    };
  }, [isReady]);

  const clearSelection = () => {
    setBuildingInfo(null);
    if (markerRef.current) markerRef.current.show = false;
  };

  return { buildingInfo, clearSelection };
}
