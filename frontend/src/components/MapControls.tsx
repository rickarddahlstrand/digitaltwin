import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Home, RotateCcw, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';
import { slideInLeft } from '../utils/animations';
import { useCesium } from '../context/CesiumContext';
import type { CameraData } from '../hooks/useCameraHud';

const btnClass =
  'w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors';

interface MapControlsProps {
  cameraDataRef: React.MutableRefObject<CameraData>;
}

export default function MapControls({ cameraDataRef }: MapControlsProps) {
  const { viewerRef } = useCesium();
  const ringRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, heading: 0 });

  useEffect(() => {
    let raf: number;
    function loop() {
      const d = cameraDataRef.current;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${-d.heading}deg)`;
      }
      if (coordsRef.current) {
        coordsRef.current.textContent =
          `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}  ·  ${Math.round(d.alt)}m`;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraDataRef]);

  const didDragRef = useRef(false);

  const onCompassDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const viewer = viewerRef.current;
    if (!viewer) return;
    draggingRef.current = true;
    didDragRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      heading: Cesium.Math.toDegrees(viewer.camera.heading),
    };

    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      if (Math.abs(dx) > 3) didDragRef.current = true;
      const newHeading = dragStartRef.current.heading - dx * 0.8;
      const v = viewerRef.current;
      if (v) {
        v.camera.setView({
          orientation: {
            heading: Cesium.Math.toRadians(newHeading),
            pitch: v.camera.pitch,
            roll: 0,
          },
        });
      }
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [viewerRef]);

  const resetNorth = () => {
    if (didDragRef.current) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 },
      duration: 0.5,
    });
  };

  const zoomIn = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const camera = viewer.camera;
    const distance = camera.positionCartographic.height * 0.4;
    const direction = camera.direction;
    const dest = Cesium.Cartesian3.add(
      camera.position,
      Cesium.Cartesian3.multiplyByScalar(direction, distance, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    camera.flyTo({
      destination: dest,
      orientation: { heading: camera.heading, pitch: camera.pitch, roll: 0 },
      duration: 0.6,
    });
  };

  const zoomOut = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const camera = viewer.camera;
    const distance = camera.positionCartographic.height * 0.6;
    const direction = camera.direction;
    const dest = Cesium.Cartesian3.subtract(
      camera.position,
      Cesium.Cartesian3.multiplyByScalar(direction, distance, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    camera.flyTo({
      destination: dest,
      orientation: { heading: camera.heading, pitch: camera.pitch, roll: 0 },
      duration: 0.6,
    });
  };

  const rotateLeft = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading - Cesium.Math.toRadians(30),
        pitch: viewer.camera.pitch,
        roll: 0,
      },
      duration: 0.5,
    });
  };

  const rotateRight = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading + Cesium.Math.toRadians(30),
        pitch: viewer.camera.pitch,
        roll: 0,
      },
      duration: 0.5,
    });
  };

  const tiltUp = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const newPitch = Math.min(viewer.camera.pitch + Cesium.Math.toRadians(15), Cesium.Math.toRadians(-5));
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading,
        pitch: newPitch,
        roll: 0,
      },
      duration: 0.5,
    });
  };

  const tiltDown = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const newPitch = Math.max(viewer.camera.pitch - Cesium.Math.toRadians(15), Cesium.Math.toRadians(-90));
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading,
        pitch: newPitch,
        roll: 0,
      },
      duration: 0.5,
    });
  };

  const goHome = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(18.094, 59.2929, 991),
      orientation: {
        heading: Cesium.Math.toRadians(1),
        pitch: Cesium.Math.toRadians(-39),
        roll: 0,
      },
      duration: 1.2,
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <motion.div
        {...slideInLeft}
        className="bg-black/70 backdrop-blur-xl
          border border-white/[0.08] rounded-xl p-1
          text-white shadow-xl shadow-black/30"
      >
        <div className="flex items-center gap-1">
          {/* Compass — click to reset north, drag to rotate */}
          <div
            onMouseDown={onCompassDown}
            onClick={resetNorth}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing"
            title="Klicka: norr · Dra: rotera"
          >
            <div ref={ringRef} className="compass-ring">
              <span className="compass-dir compass-n">N</span>
              <span className="compass-dir compass-e">E</span>
              <span className="compass-dir compass-s">S</span>
              <span className="compass-dir compass-w">W</span>
              <div className="compass-needle" />
            </div>
          </div>

          <div className="w-px h-9 bg-white/10" />

          {/* Button grid: 2 rows */}
          <div className="grid grid-cols-4 gap-0.5">
            <button onClick={zoomIn} className={btnClass} title="Zooma in">
              <Plus size={13} strokeWidth={2.5} />
            </button>
            <button onClick={rotateLeft} className={btnClass} title="Rotera vänster">
              <RotateCcw size={12} />
            </button>
            <button onClick={tiltUp} className={btnClass} title="Luta uppåt">
              <ChevronUp size={14} />
            </button>
            <button onClick={goHome} className={btnClass} title="Översikt">
              <Home size={12} />
            </button>
            <button onClick={zoomOut} className={btnClass} title="Zooma ut">
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <button onClick={rotateRight} className={btnClass} title="Rotera höger">
              <RotateCw size={12} />
            </button>
            <button onClick={tiltDown} className={btnClass} title="Luta nedåt">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-1 pt-0.5 px-1">
          <div
            ref={coordsRef}
            className="font-mono text-[9px] text-white/35 text-center pointer-events-none"
          />
        </div>
      </motion.div>

      <div className="px-1.5 py-1 rounded-lg bg-black/50 backdrop-blur-md
        border border-white/[0.06] text-[8px] leading-relaxed text-white/30">
        <span className="text-white/45 font-medium">Vänster + dra</span> Rotera
        {' · '}
        <span className="text-white/45 font-medium">Höger / Scroll</span> Zooma
        <br />
        <span className="text-white/45 font-medium">Ctrl + dra</span> Luta
        {' · '}
        <span className="text-white/45 font-medium">Shift + dra</span> Fri rörelse
      </div>
    </div>
  );
}
