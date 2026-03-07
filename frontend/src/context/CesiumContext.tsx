import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { Viewer, Cesium3DTileset } from 'cesium';

interface CesiumContextValue {
  viewerRef: React.MutableRefObject<Viewer | null>;
  googleTilesetRef: React.MutableRefObject<Cesium3DTileset | null>;
  osmTilesetRef: React.MutableRefObject<Cesium3DTileset | null>;
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
}

const CesiumContext = createContext<CesiumContextValue | null>(null);

export function CesiumProvider({ children }: { children: ReactNode }) {
  const viewerRef = useRef<Viewer | null>(null);
  const googleTilesetRef = useRef<Cesium3DTileset | null>(null);
  const osmTilesetRef = useRef<Cesium3DTileset | null>(null);
  const [isReady, setIsReady] = useState(false);

  return (
    <CesiumContext.Provider
      value={{ viewerRef, googleTilesetRef, osmTilesetRef, isReady, setIsReady }}
    >
      {children}
    </CesiumContext.Provider>
  );
}

export function useCesium() {
  const ctx = useContext(CesiumContext);
  if (!ctx) throw new Error('useCesium must be used within CesiumProvider');
  return ctx;
}
