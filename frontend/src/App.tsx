import { useState } from 'react';
import { CesiumProvider, useCesium } from './context/CesiumContext';
import CesiumViewer from './components/CesiumViewer';
import HudStatus from './components/HudStatus';
import MapControls from './components/MapControls';
import LayerPanel from './components/LayerPanel';
import BuildingInfoPanel from './components/BuildingInfoPanel';
import { useCameraHud } from './hooks/useCameraHud';
import { useBuildingClick } from './hooks/useBuildingClick';
import { usePOIs } from './hooks/usePOIs';

export default function App() {
  const [status, setStatus] = useState('Tiles: Loading...');

  return (
    <CesiumProvider>
      <div className="relative w-full h-screen overflow-hidden">
        <CesiumViewer setStatus={setStatus} />
        <OverlayWrapper status={status} />
      </div>
    </CesiumProvider>
  );
}

function OverlayWrapper({ status }: { status: string }) {
  const { isReady } = useCesium();
  const cameraDataRef = useCameraHud();
  const { buildingInfo, clearSelection } = useBuildingClick();
  const poiControls = usePOIs();

  return (
    <>
      <HudStatus status={status} />
      {isReady && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <MapControls cameraDataRef={cameraDataRef} />
          <LayerPanel poiControls={poiControls} />
        </div>
      )}
      <BuildingInfoPanel info={buildingInfo} onClose={clearSelection} onSaved={poiControls.reload} />
    </>
  );
}
