import { useState } from 'react';
import { CesiumProvider, useCesium } from './context/CesiumContext';
import CesiumViewer from './components/CesiumViewer';
import StatusToast from './components/StatusToast';
import BuildingSearch from './components/BuildingSearch';
import MapControls from './components/MapControls';
import LayerPanel from './components/LayerPanel';
import BuildingInfoPanel from './components/BuildingInfoPanel';
import { useCameraHud } from './hooks/useCameraHud';
import { useBuildingClick } from './hooks/useBuildingClick';
import { usePOIs } from './hooks/usePOIs';
import { useEnergyLinks } from './hooks/useEnergyLinks';

export default function App() {
  const [status, setStatus] = useState('');

  return (
    <CesiumProvider>
      <div className="relative w-full h-screen overflow-hidden">
        <CesiumViewer setStatus={setStatus} />
        <StatusToast message={status} />
        <OverlayWrapper />
      </div>
    </CesiumProvider>
  );
}

function OverlayWrapper() {
  const { isReady } = useCesium();
  const cameraDataRef = useCameraHud();
  const { buildingInfo, clearSelection } = useBuildingClick();
  const poiControls = usePOIs();
  const energyControls = useEnergyLinks();

  return (
    <>
      <img
        src="/images/electricity_färg_grön_grå.png"
        alt="Electricity"
        className="absolute bottom-4 right-4 z-10 h-12 drop-shadow-lg pointer-events-none"
      />
      {isReady && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <BuildingSearch />
          <MapControls cameraDataRef={cameraDataRef} />
          <LayerPanel poiControls={poiControls} energyControls={energyControls} />
        </div>
      )}
      <BuildingInfoPanel info={buildingInfo} onClose={clearSelection} onSaved={poiControls.reload} />
    </>
  );
}
