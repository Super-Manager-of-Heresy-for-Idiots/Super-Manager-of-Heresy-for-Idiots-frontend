import { describe, it, expect, beforeEach } from 'vitest';
import type { LegacySimpleGridConfig, MapSnapshotDto, MapTokenDto, UUID } from '../types';
import {
  applyCommittedEvent,
  committedStateFromSnapshot,
  createInitialCommittedState,
} from './mapCommittedReducer';
import type { MapCommittedEvent } from './mapStateTypes';
import { useMapSessionStore } from './mapSessionStore';
import { useMapTransientStore } from './mapTransientStore';

/* ── Fixtures ───────────────────────────────────────────────── */

function makeToken(id: UUID, gridX: number, gridY: number, over: Partial<MapTokenDto> = {}): MapTokenDto {
  return {
    id,
    mapSessionId: 'session-1',
    characterId: null,
    ownerUserId: null,
    name: id,
    tokenType: 'CHARACTER',
    gridX,
    gridY,
    widthCells: 1,
    heightCells: 1,
    visible: true,
    locked: false,
    data: {},
    createdAt: '2026-06-23T12:00:00Z',
    updatedAt: '2026-06-23T12:00:00Z',
    ...over,
  };
}

function makeSnapshot(revision = 5, tokens: MapTokenDto[] = [makeToken('t1', 1, 1), makeToken('t2', 4, 4)]): MapSnapshotDto {
  return {
    session: { id: 'session-1', campaignId: 'camp-1', mapId: 'map-1', status: 'ACTIVE', currentRevision: revision },
    map: {
      id: 'map-1',
      name: 'Dungeon',
      imageAssetId: 'asset-1',
      imageUrl: '/api/map-assets/asset-1/content',
      gridType: 'SQUARE',
      gridConfig: {
        type: 'SQUARE',
        cellWorldSize: 5,
        cellWorldUnit: 'ft',
        visual: { gridLineColor: '#FFFFFF', gridLineOpacity: 0.65, gridLineWidthPx: 1 },
        calibration: {
          mode: 'SIMPLE',
          origin: { imageX: 0, imageY: 0 },
          cellWidthPx: 64,
          cellHeightPx: 64,
          rotationDeg: 0,
        },
      },
    },
    tokens,
    fog: null,
    permissions: { canManageMap: true, canMoveAnyToken: true, movableTokenIds: [] },
  };
}

function movedEvent(revision: number, tokenId: UUID, to: { gridX: number; gridY: number }): MapCommittedEvent {
  return { type: 'TOKEN_MOVED_EVENT', revision, payload: { tokenId, from: { gridX: 0, gridY: 0 }, to } };
}

/* ── 1. Snapshot init ───────────────────────────────────────── */

describe('committedStateFromSnapshot', () => {
  it('seeds tokensById/tokenIds, currentRevision and permissions; clears resync', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    expect(state.isLoaded).toBe(true);
    expect(state.needsResync).toBe(false);
    expect(state.currentRevision).toBe(5);
    expect(state.tokenIds).toEqual(['t1', 't2']);
    expect(state.tokensById.t1.gridX).toBe(1);
    expect(state.permissions?.canManageMap).toBe(true);
    expect(state.session?.status).toBe('ACTIVE');
  });

  it('normalizes snapshot gridConfig before storing runtime map state', () => {
    const legacyGrid: LegacySimpleGridConfig = {
      type: 'SQUARE',
      originX: 12,
      originY: 18,
      cellWidthPx: 70,
      cellHeightPx: 72,
      rotationDeg: 0,
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
    };
    const state = committedStateFromSnapshot({
      ...makeSnapshot(5),
      map: {
        ...makeSnapshot(5).map,
        gridConfig: legacyGrid as never,
      },
    });

    expect(state.map?.gridConfig).toMatchObject({
      type: 'SQUARE',
      visual: { gridLineColor: '#FFFFFF', gridLineOpacity: 0.65, gridLineWidthPx: 1 },
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 12, imageY: 18 },
        cellWidthPx: 70,
        cellHeightPx: 72,
      },
    });
  });
});

/* ── 2. + 3. Revision guard ─────────────────────────────────── */

describe('applyCommittedEvent — revision guard', () => {
  it('applies a sequential TOKEN_MOVED and advances the revision', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, movedEvent(6, 't1', { gridX: 3, gridY: 7 }));
    expect(next.currentRevision).toBe(6);
    expect(next.needsResync).toBe(false);
    expect(next.tokensById.t1.gridX).toBe(3);
    expect(next.tokensById.t1.gridY).toBe(7);
    // input not mutated
    expect(state.tokensById.t1.gridX).toBe(1);
  });

  it('applies several sequential moves in order', () => {
    let state = committedStateFromSnapshot(makeSnapshot(5));
    state = applyCommittedEvent(state, movedEvent(6, 't1', { gridX: 2, gridY: 2 }));
    state = applyCommittedEvent(state, movedEvent(7, 't2', { gridX: 9, gridY: 9 }));
    expect(state.currentRevision).toBe(7);
    expect(state.tokensById.t1.gridX).toBe(2);
    expect(state.tokensById.t2.gridY).toBe(9);
  });

  it('sets needsResync on a skipped revision and leaves committed data untouched', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, movedEvent(7, 't1', { gridX: 3, gridY: 7 })); // gap: expected 6
    expect(next.needsResync).toBe(true);
    expect(next.currentRevision).toBe(5);
    expect(next.tokensById.t1.gridX).toBe(1);
  });

  it('ignores further events once needsResync is set, until re-seeded', () => {
    let state = committedStateFromSnapshot(makeSnapshot(5));
    state = applyCommittedEvent(state, movedEvent(7, 't1', { gridX: 3, gridY: 7 })); // gap
    expect(state.needsResync).toBe(true);
    // even the "correct" next revision is ignored while resyncing
    const stalled = applyCommittedEvent(state, movedEvent(6, 't1', { gridX: 5, gridY: 5 }));
    expect(stalled).toBe(state);
    // re-seeding clears the flag
    const reseeded = committedStateFromSnapshot(makeSnapshot(9));
    expect(reseeded.needsResync).toBe(false);
    expect(reseeded.currentRevision).toBe(9);
  });
});

describe('applyCommittedEvent — other committed events', () => {
  it('removes a token on TOKEN_DELETED_EVENT', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, { type: 'TOKEN_DELETED_EVENT', revision: 6, payload: { tokenId: 't1' } });
    expect(next.currentRevision).toBe(6);
    expect(next.tokenIds).toEqual(['t2']);
    expect(next.tokensById.t1).toBeUndefined();
  });

  it('toggles locked on TOKEN_LOCKED_EVENT / TOKEN_UNLOCKED_EVENT', () => {
    let state = committedStateFromSnapshot(makeSnapshot(5));
    state = applyCommittedEvent(state, { type: 'TOKEN_LOCKED_EVENT', revision: 6, payload: { tokenId: 't1' } });
    expect(state.tokensById.t1.locked).toBe(true);
    state = applyCommittedEvent(state, { type: 'TOKEN_UNLOCKED_EVENT', revision: 7, payload: { tokenId: 't1' } });
    expect(state.tokensById.t1.locked).toBe(false);
  });

  it('marks the session CLOSED on MAP_SESSION_CLOSED_EVENT', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, { type: 'MAP_SESSION_CLOSED_EVENT', revision: 6, payload: {} });
    expect(next.session?.status).toBe('CLOSED');
  });

  it('requests resync for a created token (payload lacks the token) without advancing revision', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, { type: 'TOKEN_CREATED_EVENT', revision: 6, payload: { tokenId: 't9' } });
    expect(next.needsResync).toBe(true);
    expect(next.currentRevision).toBe(5);
  });

  it('requests resync when a moved token is unknown to committed state', () => {
    const state = committedStateFromSnapshot(makeSnapshot(5));
    const next = applyCommittedEvent(state, movedEvent(6, 'ghost', { gridX: 1, gridY: 1 }));
    expect(next.needsResync).toBe(true);
  });
});

/* ── 4. + 5. Transient isolation ────────────────────────────── */

describe('transient state never mutates committed state', () => {
  beforeEach(() => {
    useMapSessionStore.getState().reset();
    useMapSessionStore.getState().initFromSnapshot(makeSnapshot(5));
    useMapTransientStore.getState().clearTransient();
  });

  it('drag preview (local + remote) leaves committed token and revision untouched', () => {
    const before = useMapSessionStore.getState();
    expect(before.tokensById.t1.gridX).toBe(1);

    useMapTransientStore.getState().setLocalDragPreview({
      tokenId: 't1',
      gridX: 99,
      gridY: 99,
      actorUserId: 'me',
      updatedAt: Date.now(),
    });
    useMapTransientStore.getState().upsertRemoteDragPreview({
      tokenId: 't2',
      gridX: 50,
      gridY: 50,
      actorUserId: 'other',
      updatedAt: Date.now(),
    });

    const committed = useMapSessionStore.getState();
    expect(committed.tokensById.t1.gridX).toBe(1);
    expect(committed.tokensById.t1.gridY).toBe(1);
    expect(committed.tokensById.t2.gridX).toBe(4);
    expect(committed.currentRevision).toBe(5);

    // …but the preview is recorded transiently
    expect(useMapTransientStore.getState().localDragPreview?.gridX).toBe(99);
    expect(useMapTransientStore.getState().remoteDragPreviewsByTokenId.t2.gridX).toBe(50);
  });

  it('cursor and ping are transient only and do not change currentRevision', () => {
    useMapTransientStore.getState().upsertRemoteCursor({ userId: 'u1', gridX: 3, gridY: 3, updatedAt: Date.now() });
    useMapTransientStore.getState().addPing({ id: 'p1', userId: 'u1', gridX: 7, gridY: 8, createdAt: Date.now() });

    const committed = useMapSessionStore.getState();
    expect(committed.currentRevision).toBe(5);
    expect(committed.tokensById.t1.gridX).toBe(1);

    const transient = useMapTransientStore.getState();
    expect(transient.remoteCursorsByUserId.u1.gridX).toBe(3);
    expect(transient.pings).toHaveLength(1);
    expect(transient.pings[0].id).toBe('p1');
  });

  it('clearTransient wipes overlays but not committed state', () => {
    useMapTransientStore.getState().setSelectedToken('t1');
    useMapTransientStore.getState().addPing({ id: 'p1', userId: 'u1', gridX: 1, gridY: 1, createdAt: Date.now() });
    useMapTransientStore.getState().clearTransient();

    expect(useMapTransientStore.getState().selectedTokenId).toBeNull();
    expect(useMapTransientStore.getState().pings).toHaveLength(0);
    expect(useMapSessionStore.getState().tokenIds).toEqual(['t1', 't2']);
  });
});

/* ── Store wiring (zustand merge preserves methods) ─────────── */

describe('useMapSessionStore wiring', () => {
  beforeEach(() => useMapSessionStore.getState().reset());

  it('initial state is empty/unloaded', () => {
    const s = useMapSessionStore.getState();
    expect(s).toMatchObject(createInitialCommittedState());
  });

  it('initFromSnapshot then applyEvent advances through the store', () => {
    useMapSessionStore.getState().initFromSnapshot(makeSnapshot(5));
    useMapSessionStore.getState().applyEvent(movedEvent(6, 't1', { gridX: 8, gridY: 8 }));
    const s = useMapSessionStore.getState();
    expect(s.currentRevision).toBe(6);
    expect(s.tokensById.t1.gridX).toBe(8);
    // methods survive the zustand shallow-merge
    expect(typeof s.applyEvent).toBe('function');
    expect(typeof s.reset).toBe('function');
  });
});
