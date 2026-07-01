import { describe, expect, it, vi } from 'vitest';
import { createMapMessageRouter, type MapMessageRouterDeps } from './mapWsMessageRouter';

const ACTOR = 'actor-1';
const NOW = 1_000;
const NEW_ID = 'ping-id-1';

function makeRouter(overrides: Partial<MapMessageRouterDeps> = {}) {
  const deps: MapMessageRouterDeps = {
    applyCommittedEvent: vi.fn(),
    upsertRemoteDragPreview: vi.fn(),
    upsertRemoteCursor: vi.fn(),
    addPing: vi.fn(),
    onError: vi.fn(),
    onPresenceJoin: vi.fn(),
    onPresenceLeave: vi.fn(),
    now: () => NOW,
    newId: () => NEW_ID,
    ...overrides,
  };
  return { router: createMapMessageRouter(deps), deps };
}

describe('handleEventsMessage', () => {
  it('forwards a well-formed committed event', () => {
    const { router, deps } = makeRouter();
    router.handleEventsMessage({ type: 'TOKEN_MOVED_EVENT', revision: 7, payload: { tokenId: 't1' } });
    expect(deps.applyCommittedEvent).toHaveBeenCalledWith({
      type: 'TOKEN_MOVED_EVENT',
      revision: 7,
      payload: { tokenId: 't1' },
    });
  });

  it('drops events missing a type or a numeric revision', () => {
    const { router, deps } = makeRouter();
    router.handleEventsMessage({ revision: 7 });
    router.handleEventsMessage({ type: 'TOKEN_MOVED_EVENT' });
    router.handleEventsMessage({ type: 'TOKEN_MOVED_EVENT', revision: '7' });
    router.handleEventsMessage(null);
    router.handleEventsMessage('not-an-object');
    expect(deps.applyCommittedEvent).not.toHaveBeenCalled();
  });
});

describe('handlePresenceMessage', () => {
  it('routes TOKEN_DRAG_PREVIEW with a client clock stamp', () => {
    const { router, deps } = makeRouter();
    router.handlePresenceMessage({
      type: 'TOKEN_DRAG_PREVIEW',
      actorUserId: ACTOR,
      payload: { tokenId: 't1', to: { gridX: 3, gridY: 4 } },
    });
    expect(deps.upsertRemoteDragPreview).toHaveBeenCalledWith({
      tokenId: 't1',
      gridX: 3,
      gridY: 4,
      actorUserId: ACTOR,
      updatedAt: NOW,
    });
  });

  it('routes CURSOR_UPDATE keyed by actor', () => {
    const { router, deps } = makeRouter();
    router.handlePresenceMessage({
      type: 'CURSOR_UPDATE',
      actorUserId: ACTOR,
      payload: { gridX: 1.5, gridY: 2.5 },
    });
    expect(deps.upsertRemoteCursor).toHaveBeenCalledWith({
      userId: ACTOR,
      gridX: 1.5,
      gridY: 2.5,
      updatedAt: NOW,
    });
  });

  it('routes PING with an injected id', () => {
    const { router, deps } = makeRouter();
    router.handlePresenceMessage({
      type: 'PING',
      actorUserId: ACTOR,
      payload: { gridX: 9, gridY: 8 },
    });
    expect(deps.addPing).toHaveBeenCalledWith({
      id: NEW_ID,
      userId: ACTOR,
      gridX: 9,
      gridY: 8,
      createdAt: NOW,
    });
  });

  it('routes JOIN / LEAVE lifecycle to their callbacks', () => {
    const { router, deps } = makeRouter();
    router.handlePresenceMessage({ type: 'JOIN_MAP_SESSION_EVENT', actorUserId: ACTOR });
    router.handlePresenceMessage({ type: 'LEAVE_MAP_SESSION_EVENT', actorUserId: ACTOR });
    expect(deps.onPresenceJoin).toHaveBeenCalledWith(ACTOR);
    expect(deps.onPresenceLeave).toHaveBeenCalledWith(ACTOR);
  });

  it('drops presence messages missing actorUserId or required payload fields', () => {
    const { router, deps } = makeRouter();
    router.handlePresenceMessage({ type: 'CURSOR_UPDATE', payload: { gridX: 1, gridY: 2 } });
    router.handlePresenceMessage({ type: 'TOKEN_DRAG_PREVIEW', actorUserId: ACTOR, payload: { gridX: 1, gridY: 2 } });
    router.handlePresenceMessage({ type: 'PING', actorUserId: ACTOR });
    router.handlePresenceMessage({ type: 'UNKNOWN_PRESENCE', actorUserId: ACTOR });
    expect(deps.upsertRemoteCursor).not.toHaveBeenCalled();
    expect(deps.upsertRemoteDragPreview).not.toHaveBeenCalled();
    expect(deps.addPing).not.toHaveBeenCalled();
  });
});

describe('handleErrorMessage', () => {
  it('normalizes and forwards a recognizable map error', () => {
    const { router, deps } = makeRouter();
    router.handleErrorMessage({
      type: 'MAP_ERROR',
      code: 'REVISION_CONFLICT',
      message: 'stale revision',
      requestId: 'req-1',
    });
    expect(deps.onError).toHaveBeenCalledWith({
      code: 'REVISION_CONFLICT',
      message: 'stale revision',
      requestId: 'req-1',
    });
  });

  it('ignores values that are not map-service errors', () => {
    const { router, deps } = makeRouter();
    router.handleErrorMessage({ code: 'NOT_A_REAL_CODE', message: 'x' });
    router.handleErrorMessage(null);
    expect(deps.onError).not.toHaveBeenCalled();
  });
});
