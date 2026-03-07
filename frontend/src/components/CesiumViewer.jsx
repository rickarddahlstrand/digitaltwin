import { useRef } from 'react';
import { useCesiumViewer } from '../hooks/useCesiumViewer';

export default function CesiumViewer({ setStatus }) {
  const containerRef = useRef(null);
  useCesiumViewer(containerRef, setStatus);

  return <div ref={containerRef} className="w-full h-full" />;
}
