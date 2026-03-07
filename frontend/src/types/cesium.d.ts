import type * as CesiumModule from 'cesium'

declare global {
  const Cesium: typeof CesiumModule
  interface Window {
    Cesium: typeof CesiumModule
  }
}
