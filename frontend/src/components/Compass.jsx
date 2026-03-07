import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { scaleSpring } from '../utils/animations';
import { useCesium } from '../context/CesiumContext';

const Cesium = window.Cesium;

export default function Compass({ cameraDataRef }) {
  const { viewerRef } = useCesium();
  const ringRef = useRef(null);
  const headingTextRef = useRef(null);

  useEffect(() => {
    let raf;
    function loop() {
      const d = cameraDataRef.current;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${-d.heading}deg)`;
      }
      if (headingTextRef.current) {
        headingTextRef.current.textContent = `${Math.round(d.heading)}° / ${Math.round(d.pitch)}°`;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraDataRef]);

  const resetNorth = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: 0,
        pitch: viewer.camera.pitch,
        roll: 0,
      },
      duration: 0.5,
    });
  };

  return (
    <motion.div
      {...scaleSpring}
      className="absolute top-4 right-4 z-10 flex flex-col items-center cursor-pointer"
      onClick={resetNorth}
      title="Click to reset north"
    >
      <div ref={ringRef} className="compass-ring">
        <span className="compass-dir compass-n">N</span>
        <span className="compass-dir compass-e">E</span>
        <span className="compass-dir compass-s">S</span>
        <span className="compass-dir compass-w">W</span>
        <div className="compass-needle" />
      </div>
      <div
        ref={headingTextRef}
        className="mt-1 text-xs font-mono text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
      />
    </motion.div>
  );
}
