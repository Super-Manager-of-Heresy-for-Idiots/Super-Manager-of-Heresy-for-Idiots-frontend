/**
 * Exposes the live pan/zoom transform to in-world overlays (e.g. the calibration
 * {@link GridOverlay}). Children of {@link MapViewport} render in IMAGE coordinates,
 * but a drag handle needs the current `scale` to convert a screen-pixel drag delta
 * back into image space. The provider is mounted by MapViewport around its world
 * children; consumers must therefore be rendered inside a MapViewport.
 */

import { createContext, useContext } from 'react';
import type { MapViewportState } from '../engine';
import type { ImageSize } from '../hooks/useMapViewport';

export interface MapViewportContextValue {
  viewport: MapViewportState;
  imageSize: ImageSize | null;
}

export const MapViewportContext = createContext<MapViewportContextValue | null>(null);

export function useMapViewportContext(): MapViewportContextValue {
  const ctx = useContext(MapViewportContext);
  if (!ctx) {
    throw new Error('useMapViewportContext must be used within <MapViewport>');
  }
  return ctx;
}
