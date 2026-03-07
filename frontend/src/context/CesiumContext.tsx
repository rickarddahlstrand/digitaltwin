import { createContext, useContext, useRef, useState, useEffect, type ReactNode } from 'react';
import type { Viewer, Cesium3DTileset } from 'cesium';
import { getSettings } from '../lib/pocketbase';

interface CesiumContextValue {
  viewerRef: React.MutableRefObject<Viewer | null>;
  googleTilesetRef: React.MutableRefObject<Cesium3DTileset | null>;
  osmTilesetRef: React.MutableRefObject<Cesium3DTileset | null>;
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
  cesiumToken: string | null;
}

const CesiumContext = createContext<CesiumContextValue | null>(null);

export function CesiumProvider({ children }: { children: ReactNode }) {
  const viewerRef = useRef<Viewer | null>(null);
  const googleTilesetRef = useRef<Cesium3DTileset | null>(null);
  const osmTilesetRef = useRef<Cesium3DTileset | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cesiumToken, setCesiumToken] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      setCesiumToken(settings['cesium_token'] || null);
    });
  }, []);

  return (
    <CesiumContext.Provider
      value={{ viewerRef, googleTilesetRef, osmTilesetRef, isReady, setIsReady, cesiumToken }}
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
