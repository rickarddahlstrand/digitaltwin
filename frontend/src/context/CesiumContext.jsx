import { createContext, useContext, useRef, useState } from 'react';

const CesiumContext = createContext(null);

export function CesiumProvider({ children }) {
  const viewerRef = useRef(null);
  const googleTilesetRef = useRef(null);
  const osmTilesetRef = useRef(null);
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
