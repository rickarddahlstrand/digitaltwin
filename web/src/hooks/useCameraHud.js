import { useEffect, useRef } from 'react';
import { useCesium } from '../context/CesiumContext';

const Cesium = window.Cesium;

export function useCameraHud() {
  const { viewerRef, isReady } = useCesium();
  const dataRef = useRef({ lat: 0, lon: 0, alt: 0, heading: 0, pitch: 0 });

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    function update() {
      const carto = viewer.camera.positionCartographic;
      dataRef.current.lat = Cesium.Math.toDegrees(carto.latitude);
      dataRef.current.lon = Cesium.Math.toDegrees(carto.longitude);
      dataRef.current.alt = carto.height;
      dataRef.current.heading = Cesium.Math.toDegrees(viewer.camera.heading);
      dataRef.current.pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
    }

    viewer.camera.changed.addEventListener(update);
    viewer.camera.moveEnd.addEventListener(update);
    update();

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.camera.changed.removeEventListener(update);
        viewer.camera.moveEnd.removeEventListener(update);
      }
    };
  }, [isReady]);

  return dataRef;
}
