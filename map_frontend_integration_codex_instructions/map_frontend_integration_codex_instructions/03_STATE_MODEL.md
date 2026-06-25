# 03. State Model

## Store separation

Do not put all map state into one giant React component.

Use three conceptual stores:

```text
Committed session state:
- snapshot
- map definition
- session
- tokens by id
- currentRevision
- permissions

Transient realtime state:
- local drag preview
- remote drag previews
- remote cursors
- pings
- selected token id
- hover cell
- measurement line

Editor state:
- unsaved grid config
- calibration mode
- uploaded file preview
- dirty flag
```

The implementation may use existing project state management. If no store exists, use a small dedicated store or React context + reducer.

## Committed state shape

```ts
export type MapCommittedState = {
  isLoaded: boolean;
  map: MapDefinitionDto | null;
  session: MapSessionDto | null;
  asset: MapAssetDto | null;
  tokensById: Record<UUID, MapTokenDto>;
  tokenIds: UUID[];
  permissions: MapPermissionsDto | null;
  currentRevision: number;
  needsResync: boolean;
};
```

## Transient state shape

```ts
export type TokenDragPreview = {
  tokenId: UUID;
  gridX: number;
  gridY: number;
  actorUserId: UUID;
  updatedAt: number;
};

export type RemoteCursor = {
  userId: UUID;
  gridX: number;
  gridY: number;
  updatedAt: number;
};

export type MapPing = {
  id: UUID;
  userId: UUID;
  gridX: number;
  gridY: number;
  createdAt: number;
};

export type MapTransientState = {
  selectedTokenId: UUID | null;
  hoveredGridCell: { gridX: number; gridY: number } | null;
  localDragPreview: TokenDragPreview | null;
  remoteDragPreviewsByTokenId: Record<UUID, TokenDragPreview>;
  remoteCursorsByUserId: Record<UUID, RemoteCursor>;
  pings: MapPing[];
};
```

## Revision guard

Committed events must be applied only if revision is sequential.

Pseudo-code:

```ts
function applyCommittedEvent(state: MapCommittedState, event: MapCommittedEvent): MapCommittedState {
  if (event.revision !== state.currentRevision + 1) {
    return {
      ...state,
      needsResync: true,
    };
  }

  const nextState = applyEventPayload(state, event);

  return {
    ...nextState,
    currentRevision: event.revision,
    needsResync: false,
  };
}
```

If `needsResync` becomes true:

```text
1. Stop applying further committed events.
2. Show small reconnect/resync indicator.
3. Reload snapshot through REST.
4. Replace committed state.
5. Continue WebSocket.
```

## Optimistic UI policy

For MVP, avoid optimistic final movement.

Allowed:

- local drag preview while dragging;
- preview target cell;
- temporary ghost token.

Not allowed:

- permanently moving token before confirmed TOKEN_MOVED event.

Reason:

- confirmed movement may fail due to revision conflict, token lock, permissions, or closed session.

## Event application

Known committed event types:

```text
TOKEN_MOVED
TOKEN_CREATED
TOKEN_UPDATED
TOKEN_DELETED
FOG_UPDATED
MAP_SESSION_UPDATED
```

Known transient event types:

```text
TOKEN_DRAG_PREVIEW
CURSOR_UPDATED
PING_CREATED
USER_JOINED
USER_LEFT
```

Transient events do not modify `currentRevision`.
