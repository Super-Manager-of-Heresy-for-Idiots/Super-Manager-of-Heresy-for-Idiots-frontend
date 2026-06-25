/**
 * Committed (server-authoritative) map-session store. Thin zustand wrapper over
 * the pure reducer in {@link ./mapCommittedReducer}: `initFromSnapshot` seeds it,
 * `applyEvent` runs the revision guard, `reset` clears it on unmount.
 *
 * Realtime eye-candy (selection, drag previews, cursors, pings) lives in the
 * SEPARATE {@link ./mapTransientStore}; nothing here is mutated by it.
 */

import { create } from 'zustand';
import type { MapSnapshotDto } from '../types';
import {
  applyCommittedEvent,
  committedStateFromSnapshot,
  createInitialCommittedState,
} from './mapCommittedReducer';
import type { MapCommittedEvent, MapCommittedState } from './mapStateTypes';

interface MapSessionStore extends MapCommittedState {
  /** Seed (or re-seed, on resync) from a REST snapshot. */
  initFromSnapshot: (snapshot: MapSnapshotDto) => void;
  /** Apply one committed event through the revision guard. */
  applyEvent: (event: MapCommittedEvent) => void;
  /** Force a resync (e.g. after a REVISION_CONFLICT error on our own command). */
  markNeedsResync: () => void;
  /** Clear back to the empty committed state (e.g. leaving the page). */
  reset: () => void;
}

export const useMapSessionStore = create<MapSessionStore>((set) => ({
  ...createInitialCommittedState(),
  initFromSnapshot: (snapshot) => set(committedStateFromSnapshot(snapshot)),
  applyEvent: (event) => set((state) => applyCommittedEvent(state, event)),
  markNeedsResync: () => set((state) => (state.isLoaded ? { needsResync: true } : {})),
  reset: () => set(createInitialCommittedState()),
}));
