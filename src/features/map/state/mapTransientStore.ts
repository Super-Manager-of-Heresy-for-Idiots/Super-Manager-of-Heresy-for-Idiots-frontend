/**
 * Transient (local + presence) map store: selection, hover, and realtime overlays
 * (local/remote drag previews, remote cursors, pings). Deliberately isolated from
 * {@link ./mapSessionStore}: NONE of these setters touch committed token positions
 * or `currentRevision`. Cleared on unmount/reconnect via {@link clearTransient}.
 */

import { create } from 'zustand';
import type { UUID } from '../types';
import type {
  CombatActionIntent,
  GridPoint,
  MapPing,
  MapTransientState,
  PlacementState,
  RemoteCursor,
  TokenDragPreview,
} from './mapStateTypes';

/** Most recent pings kept; older ones drop off (they auto-expire visually anyway). */
const MAX_PINGS = 50;

interface MapTransientStore extends MapTransientState {
  setSelectedToken: (tokenId: UUID | null) => void;
  setSelectedCell: (cell: GridPoint | null) => void;
  setHoveredCell: (cell: GridPoint | null) => void;
  setPlacement: (placement: PlacementState | null) => void;
  clearPlacement: () => void;
  setAttackName: (attackName: string | null) => void;
  /** Arm a default action (Move/Fly/Push); clears any staged target/pending cell. */
  setCombatAction: (action: CombatActionIntent | null) => void;
  setMovePending: (cell: GridPoint | null) => void;
  setPushTarget: (tokenId: UUID | null) => void;
  /** GM "out of rules" toggle (обход правил) — see {@link MapTransientState.forceMode}. */
  setForceMode: (on: boolean) => void;
  /** Stage/clear the live AoE template preview (Phase 2.3) — see {@link MapTransientState.aoePreview}. */
  setAoePreview: (preview: MapTransientState['aoePreview']) => void;
  /** Disarm the staged action and clear its target/pending cell. */
  clearCombatAction: () => void;
  setLocalDragPreview: (preview: TokenDragPreview | null) => void;
  upsertRemoteDragPreview: (preview: TokenDragPreview) => void;
  clearRemoteDragPreview: (tokenId: UUID) => void;
  upsertRemoteCursor: (cursor: RemoteCursor) => void;
  clearRemoteCursor: (userId: UUID) => void;
  addPing: (ping: MapPing) => void;
  removePing: (pingId: UUID) => void;
  clearTransient: () => void;
}

function createInitialTransientState(): MapTransientState {
  return {
    selectedTokenId: null,
    selectedCell: null,
    hoveredGridCell: null,
    localDragPreview: null,
    remoteDragPreviewsByTokenId: {},
    remoteCursorsByUserId: {},
    pings: [],
    placement: null,
    attackName: null,
    combatAction: null,
    movePending: null,
    pushTargetTokenId: null,
    forceMode: false,
    aoePreview: null,
  };
}

export const useMapTransientStore = create<MapTransientStore>((set) => ({
  ...createInitialTransientState(),

  // Token and cell selection are mutually exclusive — selecting one clears the other.
  setSelectedToken: (tokenId) => set({ selectedTokenId: tokenId, selectedCell: null }),

  setSelectedCell: (cell) => set({ selectedCell: cell, selectedTokenId: null }),

  setHoveredCell: (cell) => set({ hoveredGridCell: cell }),

  setPlacement: (placement) => set({ placement }),

  clearPlacement: () => set({ placement: null }),

  setAttackName: (attackName) => set({ attackName }),

  // Arming an action starts a fresh staging (no leftover pending cell / push target).
  setCombatAction: (combatAction) =>
    set({ combatAction, movePending: null, pushTargetTokenId: null }),

  setMovePending: (cell) => set({ movePending: cell }),

  setPushTarget: (tokenId) => set({ pushTargetTokenId: tokenId }),

  setForceMode: (on) => set({ forceMode: on }),

  setAoePreview: (aoePreview) => set({ aoePreview }),

  clearCombatAction: () =>
    set({ combatAction: null, movePending: null, pushTargetTokenId: null }),

  setLocalDragPreview: (preview) => set({ localDragPreview: preview }),

  upsertRemoteDragPreview: (preview) =>
    set((state) => ({
      remoteDragPreviewsByTokenId: {
        ...state.remoteDragPreviewsByTokenId,
        [preview.tokenId]: preview,
      },
    })),

  clearRemoteDragPreview: (tokenId) =>
    set((state) => {
      if (!state.remoteDragPreviewsByTokenId[tokenId]) return state;
      const next = { ...state.remoteDragPreviewsByTokenId };
      delete next[tokenId];
      return { remoteDragPreviewsByTokenId: next };
    }),

  upsertRemoteCursor: (cursor) =>
    set((state) => ({
      remoteCursorsByUserId: { ...state.remoteCursorsByUserId, [cursor.userId]: cursor },
    })),

  clearRemoteCursor: (userId) =>
    set((state) => {
      if (!state.remoteCursorsByUserId[userId]) return state;
      const next = { ...state.remoteCursorsByUserId };
      delete next[userId];
      return { remoteCursorsByUserId: next };
    }),

  addPing: (ping) =>
    set((state) => ({ pings: [...state.pings, ping].slice(-MAX_PINGS) })),

  removePing: (pingId) =>
    set((state) => ({ pings: state.pings.filter((p) => p.id !== pingId) })),

  clearTransient: () => set(createInitialTransientState()),
}));
