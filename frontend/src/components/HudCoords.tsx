import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/animations';
import type { CameraData } from '../hooks/useCameraHud';

interface HudCoordsProps {
  cameraDataRef: React.MutableRefObject<CameraData>;
}

export default function HudCoords({ cameraDataRef }: HudCoordsProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    function loop() {
      const d = cameraDataRef.current;
      if (elRef.current) {
        elRef.current.textContent =
          `Lat: ${d.lat.toFixed(4)}  Lon: ${d.lon.toFixed(4)}  Alt: ${Math.round(d.alt)}m`;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraDataRef]);

  return (
    <motion.div
      {...fadeIn}
      className="absolute top-4 left-4 z-10 pointer-events-none font-mono text-[11px]
        text-white/70
        drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
      ref={elRef}
    />
  );
}
