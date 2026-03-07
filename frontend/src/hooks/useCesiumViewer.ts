import { useEffect, useRef } from 'react';
import { useCesium } from '../context/CesiumContext';

export function useCesiumViewer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  setStatus: (status: string) => void,
) {
  const { viewerRef, googleTilesetRef, osmTilesetRef, setIsReady, cesiumToken } = useCesium();
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current || !containerRef.current || !cesiumToken) return;
    initedRef.current = true;

    Cesium.Ion.defaultAccessToken = cesiumToken;

    const viewer = new Cesium.Viewer(containerRef.current, {
      globe: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
    });

    viewerRef.current = viewer;

    // Disable HDR to prevent dark rendering
    viewer.scene.pickTranslucentDepth = true;
    viewer.scene.highDynamicRange = false;

    // Fixed midday sun
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2024-06-15T10:00:00Z');
    viewer.clock.shouldAnimate = false;

    const googleReady = Cesium.createGooglePhotorealistic3DTileset({
      onlyUsingWithGoogleGeocoder: true,
    })
      .then((tileset) => {
        googleTilesetRef.current = tileset;
        viewer.scene.primitives.add(tileset);
        setStatus('Google 3D Tiles laddade');
      })
      .catch((error) => {
        console.error('Failed to load Google 3D Tiles:', error);
        setStatus('Fel vid laddning av Google 3D Tiles');
      });

    const osmReady = Cesium.Cesium3DTileset.fromIonAssetId(96188)
      .then((tileset) => {
        osmTilesetRef.current = tileset;
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: 'color("white", 0.01)',
          show: true,
        });
        viewer.scene.primitives.add(tileset);
      })
      .catch((error) => {
        console.error('Failed to load OSM Buildings:', error);
      });

    Promise.all([googleReady, osmReady]).then(() => {
      setStatus('Kartan är redo');
      setIsReady(true);
    });

    // Set camera to Hammarby Sjostad overview
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(18.1010, 59.2916, 1126),
      orientation: {
        heading: Cesium.Math.toRadians(350),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
    });

    return () => {
      initedRef.current = false;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
      googleTilesetRef.current = null;
      osmTilesetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cesiumToken]);
}
