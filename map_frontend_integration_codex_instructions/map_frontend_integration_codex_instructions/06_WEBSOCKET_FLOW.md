# 06. WebSocket Flow

## Endpoint

Use backend endpoint from README. Expected default:

```text
/ws/map
```

Use STOMP destinations from backend README. If actual paths differ, adapt constants in one place only.

## Suggested destination constants

```ts
export const mapWsDestinations = {
  appJoin: (sessionId: UUID) => `/app/maps/${sessionId}/join`,
  appLeave: (sessionId: UUID) => `/app/maps/${sessionId}/leave`,
  appMoveToken: (sessionId: UUID) => `/app/maps/${sessionId}/move-token`,
  appDragPreview: (sessionId: UUID) => `/app/maps/${sessionId}/drag-preview`,
  appCursor: (sessionId: UUID) => `/app/maps/${sessionId}/cursor`,
  appPing: (sessionId: UUID) => `/app/maps/${sessionId}/ping`,

  topicEvents: (sessionId: UUID) => `/topic/maps/${sessionId}/events`,
  topicPresence: (sessionId: UUID) => `/topic/maps/${sessionId}/presence`,
  userErrors: `/user/queue/map-errors`,
};
```

## Connection lifecycle

On `MapSessionPage` mount:

```text
1. Load REST snapshot.
2. Initialize committed store.
3. Open STOMP connection.
4. Subscribe to events topic.
5. Subscribe to presence topic.
6. Subscribe to user error queue.
7. Send JOIN_SESSION.
```

On unmount:

```text
1. Send LEAVE_SESSION if connected.
2. Unsubscribe.
3. Disconnect if no other map page uses the same connection.
4. Clear transient state.
```

## Reconnect behavior

On WebSocket disconnect:

```text
1. Show reconnect indicator.
2. Try reconnect.
3. After reconnect, reload REST snapshot.
4. Reinitialize committed state.
5. Send JOIN_SESSION again.
```

Do not rely on WebSocket missed events being replayed.

## Command messages

### Move token

```ts
export type MoveTokenCommand = {
  requestId: string;
  tokenId: UUID;
  expectedRevision: number;
  to: {
    gridX: number;
    gridY: number;
  };
};
```

### Drag preview

```ts
export type TokenDragPreviewCommand = {
  tokenId: UUID;
  gridX: number;
  gridY: number;
};
```

### Cursor update

```ts
export type CursorUpdateCommand = {
  gridX: number;
  gridY: number;
};
```

### Ping

```ts
export type PingCommand = {
  gridX: number;
  gridY: number;
  label?: string;
};
```

## Event messages

```ts
export type MapWsEnvelope<TPayload = unknown> = {
  type: string;
  eventId?: UUID;
  requestId?: string;
  mapSessionId: UUID;
  revision?: number;
  actorUserId?: UUID;
  timestamp: string;
  payload: TPayload;
};
```

Committed event example:

```ts
export type TokenMovedPayload = {
  tokenId: UUID;
  from: { gridX: number; gridY: number };
  to: { gridX: number; gridY: number };
};
```

Transient event example:

```ts
export type CursorUpdatedPayload = {
  userId: UUID;
  gridX: number;
  gridY: number;
};
```

## Error handling

User-specific WebSocket errors should be shown as non-blocking notifications unless they require resync.

Important error cases:

```text
REVISION_CONFLICT:
- reload snapshot

FORBIDDEN:
- show permission error
- do not retry automatically

TOKEN_LOCKED:
- return token to committed position

MAP_SESSION_CLOSED:
- show closed session state
- disable movement

VALIDATION_ERROR:
- show validation details
```

## Request correlation

Every client command should include `requestId`.

Use it to:

- clear pending state after success/error;
- ignore duplicate responses if needed;
- debug client/server logs.
