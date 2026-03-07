import type * as CesiumModule from 'cesium'

interface CesiumConfig {
  token: string
}

declare global {
  const Cesium: typeof CesiumModule
  interface Window {
    Cesium: typeof CesiumModule
    CESIUM_CONFIG: CesiumConfig
  }
}
