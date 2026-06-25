# 00. Frontend Global Rules

These rules are mandatory for all map frontend implementation.

## 1. Do not use iframe

The map must be integrated as a feature module in the existing React application.

Do not implement:

- iframe embedding;
- separate authentication flow inside iframe;
- cross-window postMessage protocol for normal app communication;
- separate map app deployment for MVP.

Allowed future option:

- Extract map module into a microfrontend later if the map becomes an independent product.

## 2. Preserve frontend modularity

The map code must not be spread across unrelated parts of the application.

Use a dedicated feature folder:

```text
src/features/map/
  api/
  components/
  hooks/
  state/
  websocket/
  engine/
  calibration/
  types/
  utils/
  pages/
```

If the project uses a different structure, adapt names but preserve the same logical boundaries.

## 3. Map image is not gameplay state

The uploaded map image is only a visual background.

Do not use image pixel coordinates as the persistent gameplay position of tokens.

Persistent token state must use grid coordinates:

```ts
type GridPosition = {
  gridX: number;
  gridY: number;
};
```

Pixels are only a rendering projection.

## 4. Server is authoritative

Frontend must never treat local drag/drop as final truth.

Correct flow:

```text
User drags token
Frontend shows temporary local preview
User releases token
Frontend sends MOVE_TOKEN command with expectedRevision
map-service validates and persists movement
map-service broadcasts TOKEN_MOVED event
Frontend applies confirmed event
```

## 5. Revision is mandatory

Every snapshot has `currentRevision`.

Every committed map event has `revision`.

Every confirmed move command must include `expectedRevision`.

If the frontend receives a committed event with non-sequential revision, it must reload snapshot.

## 6. Separate committed state and transient state

Committed state:

- snapshot;
- tokens;
- map session;
- committed revision;
- confirmed map events.

Transient state:

- local drag preview;
- remote drag preview;
- cursors;
- pings;
- hover;
- selection;
- measurement tool.

Transient state must not overwrite committed state.

## 7. REST and WebSocket responsibilities

REST:

- load map definitions;
- upload assets;
- create/update maps;
- create/start map sessions;
- load snapshot;
- create/delete tokens if implemented by REST.

WebSocket/STOMP:

- join session;
- leave session;
- move token;
- drag preview;
- cursor update;
- ping;
- committed events broadcast.

## 8. Do not overbuild MVP

Do not implement in MVP unless explicitly requested:

- dynamic lighting;
- automatic grid detection;
- perspective correction;
- hex grid rendering if backend only supports square grid;
- complex wall/pathfinding;
- collaborative map editor;
- replay UI;
- CDN/pre-signed URL UI flows.

MVP target:

- square grid;
- uploaded background map image;
- manual grid calibration;
- token rendering;
- snap-to-grid movement;
- realtime movement;
- revision recovery.
