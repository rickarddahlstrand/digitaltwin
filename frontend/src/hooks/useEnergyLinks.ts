import { useEffect, useRef, useCallback, useState } from 'react';
import { useCesium } from '../context/CesiumContext';
import type { Entity, Color, Cartesian3 } from 'cesium';

export interface EnergyLink {
  from: { name: string; lon: number; lat: number };
  to: { name: string; lon: number; lat: number };
  surplusKwh: number;      // Överskott solel per år (kWh)
  producedKwh: number;     // Total producerad solel per år (kWh)
  purchasedKwh: number;    // Inköpt el per år (kWh)
  // Månadsdata: [jan, feb, mar, apr, maj, jun, jul, aug, sep, okt, nov, dec]
  monthlySurplus: number[];
}

const ENERGY_LINKS: EnergyLink[] = [
  {
    from: { name: 'BRF Sundet', lon: 18.11005, lat: 59.3027 },
    to: { name: 'BRF Strandkanten', lon: 18.10709, lat: 59.30255 },
    surplusKwh: 3711,
    producedKwh: 36301,
    purchasedKwh: 279862,
    monthlySurplus: [0, 0, 2, 148, 735, 839, 1148, 709, 130, 0, 0, 0],
  },
  {
    from: { name: 'BRF Havet', lon: 18.1042, lat: 59.3054 },
    to: { name: 'BRF Hammarby Kaj', lon: 18.10292, lat: 59.30404 },
    surplusKwh: 9503,
    producedKwh: 89042,
    purchasedKwh: 592876,
    monthlySurplus: [0, 0, 0, 102, 1134, 2678, 3700, 1655, 234, 0, 0, 0],
  },
  {
    from: { name: 'Sjöportalen 1', lon: 18.10153, lat: 59.30452 },
    to: { name: 'BRF Holmen', lon: 18.10008, lat: 59.30382 },
    surplusKwh: 12297,
    producedKwh: 42680,
    purchasedKwh: 179385,
    monthlySurplus: [0, 6, 234, 686, 2093, 3006, 3075, 2076, 1017, 104, 0, 0],
  },
  {
    from: { name: 'BRF Sjöstadsesplanaden 1', lon: 18.08987, lat: 59.30244 },
    to: { name: 'Brf The Village STHLM', lon: 18.09596, lat: 59.30226 },
    surplusKwh: 6194,
    producedKwh: 83270,
    purchasedKwh: 462067,
    monthlySurplus: [0, 0, 0, 314, 1131, 1683, 2028, 917, 121, 0, 0, 0],
  },
];

// Largest surplus used to normalize arc widths
const MAX_SURPLUS = Math.max(...ENERGY_LINKS.map((l) => l.surplusKwh));

export function arcPositions(link: EnergyLink, segments: number, peakAlt: number): number[] {
  const coords: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lon = link.from.lon + (link.to.lon - link.from.lon) * t;
    const lat = link.from.lat + (link.to.lat - link.from.lat) * t;
    const alt = 40 + peakAlt * 4 * t * (1 - t);
    coords.push(lon, lat, alt);
  }
  return coords;
}

export function formatKwh(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
  return `${kwh} kWh`;
}

export function useEnergyLinks() {
  const { viewerRef, isReady } = useCesium();
  const entitiesRef = useRef<Entity[]>([]);
  const [active, setActive] = useState(true);
  const startTimeRef = useRef(Date.now());
  const initedRef = useRef(false);

  const setContinuousRendering = useCallback((on: boolean) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    if (on) {
      viewer.scene.requestRenderMode = false;
      viewer.targetFrameRate = 30;
    } else {
      viewer.scene.requestRenderMode = true;
      viewer.targetFrameRate = undefined as unknown as number;
    }
  }, [viewerRef]);

  const remove = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];
    viewer.scene.requestRender();
    setContinuousRendering(false);
  }, [viewerRef, setContinuousRendering]);

  const createLink = useCallback((link: EnergyLink, baseColor: Color): Entity[] => {
    const viewer = viewerRef.current!;
    const startTime = startTimeRef.current;
    const peakAlt = 40;

    // Skalanpassad bredd: 4-14 baserat på överskott relativt max
    const relativeSize = link.surplusKwh / MAX_SURPLUS;
    const baseWidth = 4 + 10 * relativeSize;
    const packetSpeed = 2000 + 2000 * (1 - relativeSize); // snabbare vid mer överskott

    // Pulserande glow-båge
    const coords = arcPositions(link, 30, peakAlt);
    const arcEntity = viewer.entities.add({
      name: `Energi: ${link.from.name} → ${link.to.name}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(coords),
        width: new Cesium.CallbackProperty(() => {
          const t = ((Date.now() - startTime) % 2000) / 2000;
          return baseWidth + (baseWidth * 0.4) * Math.abs(Math.sin(t * Math.PI));
        }, false) as unknown as number,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: new Cesium.CallbackProperty(() => {
            const t = ((Date.now() - startTime) % 2000) / 2000;
            return 0.2 + 0.3 * Math.abs(Math.sin(t * Math.PI));
          }, false) as unknown as number,
          color: new Cesium.CallbackProperty(() => {
            const t = ((Date.now() - startTime) % 2000) / 2000;
            const alpha = 0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI));
            return baseColor.withAlpha(alpha);
          }, false) as unknown as Color,
        }),
      },
    });

    // Vandrande prick längs bågen
    const packet = viewer.entities.add({
      name: `Paket: ${link.from.name} → ${link.to.name}`,
      position: new Cesium.CallbackProperty(() => {
        const t = ((Date.now() - startTime) % packetSpeed) / packetSpeed;
        const lon = link.from.lon + (link.to.lon - link.from.lon) * t;
        const lat = link.from.lat + (link.to.lat - link.from.lat) * t;
        const alt = 40 + peakAlt * 4 * t * (1 - t);
        return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
      }, false) as unknown as Cartesian3,
      point: {
        pixelSize: 8 + 6 * relativeSize,
        color: baseColor,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // Etikett vid bågtoppen — växlar mellan överskott och månadsdata
    const midLon = (link.from.lon + link.to.lon) / 2;
    const midLat = (link.from.lat + link.to.lat) / 2;
    const topAlt = 40 + peakAlt + 5;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    // Find peak month
    const peakIdx = link.monthlySurplus.indexOf(Math.max(...link.monthlySurplus));
    const selfUsePercent = Math.round((link.producedKwh / (link.purchasedKwh + link.producedKwh)) * 100);

    const label = viewer.entities.add({
      name: `Etikett: ${link.from.name}`,
      position: Cesium.Cartesian3.fromDegrees(midLon, midLat, topAlt),
      label: {
        text: new Cesium.CallbackProperty(() => {
          // Cycle through 3 displays every 4 seconds each
          const cycle = Math.floor(((Date.now() - startTime) % 12000) / 4000);
          switch (cycle) {
            case 0:
              return `${formatKwh(link.surplusKwh)} överskott/år`;
            case 1:
              return `${months[peakIdx]}: ${formatKwh(link.monthlySurplus[peakIdx]!)} delat`;
            default:
              return `${selfUsePercent}% solel av total`;
          }
        }, false) as unknown as string,
        font: 'bold 22px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
        backgroundPadding: new Cesium.Cartesian2(8, 5),
        scaleByDistance: new Cesium.NearFarScalar(200, 1.2, 2000, 0.35),
      },
    });

    return [arcEntity, packet, label];
  }, [viewerRef]);

  const add = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    remove();
    startTimeRef.current = Date.now();

    const colors: Color[] = [
      Cesium.Color.LIME,
      Cesium.Color.CYAN,
      Cesium.Color.YELLOW,
      Cesium.Color.MAGENTA,
    ];
    ENERGY_LINKS.forEach((link, i) => {
      entitiesRef.current.push(...createLink(link, colors[i % colors.length]!));
    });
    setContinuousRendering(true);
  }, [viewerRef, remove, createLink, setContinuousRendering]);

  const toggle = useCallback(() => {
    setActive((prev) => {
      if (prev) {
        remove();
      } else {
        add();
      }
      return !prev;
    });
  }, [add, remove]);

  // Activate on load when viewer is ready
  useEffect(() => {
    if (isReady && !initedRef.current) {
      initedRef.current = true;
      add();
    }
  }, [isReady, add]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      entitiesRef.current.forEach((e) => viewer.entities.remove(e));
      entitiesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { toggle, active, isReady };
}
