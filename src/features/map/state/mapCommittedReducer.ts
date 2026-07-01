/**
 * Pure reducer for committed map state. No React/zustand here so the revision
 * guard is trivially unit-testable; the zustand store just wraps these functions.
 *
 * Revision guard (see 03_STATE_MODEL.md): a committed event is applied only when
 * its `revision` is exactly `currentRevision + 1`. A gap means we missed an event
 * → `needsResync` (the caller reloads the snapshot via REST and re-inits). Events
 * we cannot fully reconstruct from their payload (a freshly created token carries
 * only its id; fog and map-definition changes are opaque in MVP) also request a
 * resync instead of silently diverging.
 */

import type { MapSnapshotDto, MapTokenDto, UUID } from '../types';
import { normalizeGridConfig } from '../calibration/calibrationMath';
import type {
  GridPoint,
  MapCommittedEvent,
  MapCommittedState,
  TokenMovedPayload,
} from './mapStateTypes';

export function createInitialCommittedState(): MapCommittedState {
  return {
    isLoaded: false,
    session: null,
    map: null,
    tokensById: {},
    tokenIds: [],
    tokenCombatLinks: [],
    fog: null,
    permissions: null,
    currentRevision: 0,
    needsResync: false,
  };
}

/** Seed committed state from a REST snapshot (initial load and every resync). */
export function committedStateFromSnapshot(snapshot: MapSnapshotDto): MapCommittedState {
  const tokensById: Record<UUID, MapTokenDto> = {};
  const tokenIds: UUID[] = [];
  for (const token of snapshot.tokens) {
    tokensById[token.id] = token;
    tokenIds.push(token.id);
  }
  const map = {
    ...snapshot.map,
    gridConfig: normalizeGridConfig(snapshot.map.gridConfig),
  };
  return {
    isLoaded: true,
    session: snapshot.session,
    map,
    tokensById,
    tokenIds,
    tokenCombatLinks: snapshot.tokenCombatLinks ?? [],
    fog: snapshot.fog ?? null,
    permissions: snapshot.permissions,
    currentRevision: snapshot.session.currentRevision,
    needsResync: false,
  };
}

/**
 * Apply one committed event under the revision guard. Returns a new state; the
 * input is never mutated. Once `needsResync` is set, further events are ignored
 * until the caller re-seeds via {@link committedStateFromSnapshot}.
 */
export function applyCommittedEvent(
  state: MapCommittedState,
  event: MapCommittedEvent,
): MapCommittedState {
  if (!state.isLoaded || state.needsResync) return state;

  if (event.revision !== state.currentRevision + 1) {
    return { ...state, needsResync: true };
  }

  const applied = applyCommittedPayload(state, event);
  // A handler that bailed to resync must NOT advance the revision — the snapshot
  // reload supplies the authoritative revision.
  if (applied.needsResync) return { ...state, needsResync: true };

  return { ...applied, currentRevision: event.revision, needsResync: false };
}

function applyCommittedPayload(
  state: MapCommittedState,
  event: MapCommittedEvent,
): MapCommittedState {
  switch (event.type) {
    case 'TOKEN_MOVED_EVENT': {
      const payload = parseTokenMoved(event.payload);
      if (!payload) return resync(state);
      const token = state.tokensById[payload.tokenId];
      if (!token) return resync(state); // moving an unknown token → we are diverged
      return {
        ...state,
        tokensById: {
          ...state.tokensById,
          [payload.tokenId]: { ...token, gridX: payload.to.gridX, gridY: payload.to.gridY },
        },
      };
    }

    case 'TOKEN_DELETED_EVENT': {
      const tokenId = parseTokenId(event.payload);
      if (!tokenId) return resync(state);
      if (!state.tokensById[tokenId]) return state; // idempotent: already gone
      const tokensById = { ...state.tokensById };
      delete tokensById[tokenId];
      return {
        ...state,
        tokensById,
        tokenIds: state.tokenIds.filter((id) => id !== tokenId),
      };
    }

    case 'TOKEN_LOCKED_EVENT':
    case 'TOKEN_UNLOCKED_EVENT': {
      const tokenId = parseTokenId(event.payload);
      if (!tokenId) return resync(state);
      const token = state.tokensById[tokenId];
      if (!token) return resync(state);
      const locked = event.type === 'TOKEN_LOCKED_EVENT';
      return {
        ...state,
        tokensById: { ...state.tokensById, [tokenId]: { ...token, locked } },
      };
    }

    case 'MAP_SESSION_STARTED_EVENT':
      return state.session
        ? { ...state, session: { ...state.session, status: 'ACTIVE' } }
        : resync(state);

    case 'MAP_SESSION_CLOSED_EVENT':
      return state.session
        ? { ...state, session: { ...state.session, status: 'CLOSED' } }
        : resync(state);

    // Payload is insufficient to apply in MVP (created token needs hydration; fog
    // and map-definition blobs are opaque) → reload the snapshot.
    case 'TOKEN_CREATED_EVENT':
    case 'FOG_REVEALED_EVENT':
    case 'FOG_HIDDEN_EVENT':
    case 'MAP_DEFINITION_CHANGED_EVENT':
      return resync(state);

    default:
      return resync(state);
  }
}

function resync(state: MapCommittedState): MapCommittedState {
  return { ...state, needsResync: true };
}

/* ── Defensive payload parsing (wire payloads are untyped maps) ── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseGridPoint(value: unknown): GridPoint | null {
  if (!isRecord(value)) return null;
  const { gridX, gridY } = value;
  if (typeof gridX !== 'number' || typeof gridY !== 'number') return null;
  return { gridX, gridY };
}

function parseTokenId(payload: unknown): UUID | null {
  if (!isRecord(payload)) return null;
  return typeof payload.tokenId === 'string' ? payload.tokenId : null;
}

function parseTokenMoved(payload: unknown): TokenMovedPayload | null {
  const tokenId = parseTokenId(payload);
  const to = isRecord(payload) ? parseGridPoint(payload.to) : null;
  if (!tokenId || !to) return null;
  const from = isRecord(payload) ? parseGridPoint(payload.from) : null;
  return { tokenId, from: from ?? to, to };
}
