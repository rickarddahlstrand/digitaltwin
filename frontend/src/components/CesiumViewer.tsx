import { useRef } from 'react';
import { useCesiumViewer } from '../hooks/useCesiumViewer';

interface CesiumViewerProps {
  setStatus: (status: string) => void;
}

export default function CesiumViewer({ setStatus }: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useCesiumViewer(containerRef, setStatus);

  return <div ref={containerRef} className="w-full h-full" />;
}
