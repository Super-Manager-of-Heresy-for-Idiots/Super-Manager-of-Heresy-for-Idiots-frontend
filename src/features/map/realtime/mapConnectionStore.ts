/**
 * Connection status for the map realtime channel. Kept separate from the core
 * app's `useWsStore` because the map-service socket is a DISTINCT connection with
 * its own lifecycle. Components (toolbar, reconnect banner) read `connectionState`.
 */

import { create } from 'zustand';

export type MapConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline';

interface MapConnectionStore {
  connectionState: MapConnectionState;
  setConnectionState: (state: MapConnectionState) => void;
  reset: () => void;
}

export const useMapConnectionStore = create<MapConnectionStore>((set) => ({
  connectionState: 'idle',
  setConnectionState: (state) => set({ connectionState: state }),
  reset: () => set({ connectionState: 'idle' }),
}));
