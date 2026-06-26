/**
 * Internal state shapes for the map feature.
 *
 * Two stores, kept strictly apart (see 03_STATE_MODEL.md):
 *  - COMMITTED state ({@link MapCommittedState}) is the server-authoritative
 *    snapshot, advanced one `revision` at a time through the revision guard.
 *  - TRANSIENT state ({@link MapTransientState}) is local/presence-only (selection,
 *    hover, drag previews, cursors, pings). It is realtime eye-candy and must NEVER
 *    touch `currentRevision` or the committed token positions.
 *
 * These are FE domain types, not wire types: the WebSocket layer (added later)
 * translates raw STOMP messages into these shapes before they reach the stores.
 */

import type {
  MapEventType,
  MapPermissions,
  MapSnapshotMap,
  MapSnapshotSession,
  MapTokenCombatLinkDto,
  MapTokenDto,
  UUID,
} from '../types';

/** A grid coordinate. May be fractional (token coords are BigDecimal server-side). */
export interface GridPoint {
  gridX: number;
  gridY: number;
}

/* ── Committed state ────────────────────────────────────────── */

/**
 * Server-authoritative session state, seeded from `GET /snapshot` and advanced by
 * sequential committed events. `session`/`map` use the lighter snapshot sub-shapes
 * (that is exactly what the snapshot — and every resync — delivers; there is no
 * separate asset object in the snapshot).
 */
export interface MapCommittedState {
  isLoaded: boolean;
  session: MapSnapshotSession | null;
  map: MapSnapshotMap | null;
  tokensById: Record<UUID, MapTokenDto>;
  /** Stable insertion/draw order for {@link tokensById}. */
  tokenIds: UUID[];
  /**
   * Token↔combatant links from the snapshot (battle-linked sessions only). Read-only
   * here — the derived tactical view recombines them with battle state per render;
   * combat HP/turn is NEVER duplicated into the committed map store.
   */
  tokenCombatLinks: MapTokenCombatLinkDto[];
  /** Fog-of-war blob — opaque in MVP. */
  fog: unknown | null;
  permissions: MapPermissions | null;
  currentRevision: number;
  /** A revision gap (or an unappliable event) was seen → caller must reload snapshot. */
  needsResync: boolean;
}

/**
 * Minimal committed-event shape the reducer needs. The real WS envelope
 * (`{ type, eventId, sessionId, revision, actorUserId, createdAt, payload }`) is a
 * structural superset, so it can be passed straight through.
 */
export interface MapCommittedEvent {
  type: MapEventType;
  revision: number;
  payload: unknown;
}

/* ── Committed event payloads (subset the reducer can apply) ── */

export interface TokenMovedPayload {
  tokenId: UUID;
  from: GridPoint;
  to: GridPoint;
}

/* ── Transient state ────────────────────────────────────────── */

/**
 * A token being dragged — either locally (`localDragPreview`) or by another user
 * (`remoteDragPreviewsByTokenId`). `updatedAt` is a client clock stamp (Date.now)
 * for staleness/expiry; it is NOT on the wire.
 */
export interface TokenDragPreview {
  tokenId: UUID;
  gridX: number;
  gridY: number;
  actorUserId: UUID;
  updatedAt: number;
}

export interface RemoteCursor {
  userId: UUID;
  gridX: number;
  gridY: number;
  updatedAt: number;
}

export interface MapPing {
  id: UUID;
  userId: UUID;
  gridX: number;
  gridY: number;
  createdAt: number;
}

/**
 * Active combatant-placement intent. While set, the next empty grid-cell click
 * creates a linked token for `combatantId` (frontend prompt 03). Local-only — it
 * never touches committed state and clears once the placement request is sent.
 * `widthCells`/`heightCells` carry the GM-chosen token size (creature size).
 */
export interface PlacementState {
  mode: 'PLACE_COMBATANT';
  combatantId: UUID;
  widthCells?: number;
  heightCells?: number;
}

/**
 * A staged default action awaiting target + confirmation. MOVE/FLY pick a destination
 * cell ({@link MapTransientState.movePending}); PUSH picks an enemy token
 * ({@link MapTransientState.pushTargetTokenId}). Nothing commits until the user
 * confirms — local-only intent, never committed state.
 */
export type CombatActionIntent =
  | { type: 'MOVE'; mode: 'WALK' | 'FLY' }
  | { type: 'PUSH' };

export interface MapTransientState {
  selectedTokenId: UUID | null;
  /** A selected empty grid cell (mutually exclusive with `selectedTokenId`). */
  selectedCell: GridPoint | null;
  hoveredGridCell: GridPoint | null;
  localDragPreview: TokenDragPreview | null;
  remoteDragPreviewsByTokenId: Record<UUID, TokenDragPreview>;
  remoteCursorsByUserId: Record<UUID, RemoteCursor>;
  pings: MapPing[];
  placement: PlacementState | null;
  /**
   * Pending attack intent: the chosen attack name awaiting a target token click
   * (frontend prompt 04). `null` when not attacking. Resolution still goes through
   * the core battle API — this is purely the "which attack" half of the selection.
   */
  attackName: string | null;
  /** Staged default action (Move/Fly/Push) awaiting target + confirmation. */
  combatAction: CombatActionIntent | null;
  /** MOVE/FLY destination cell chosen but not yet confirmed (route-preview target). */
  movePending: GridPoint | null;
  /** PUSH target token chosen but not yet confirmed. */
  pushTargetTokenId: UUID | null;
}
