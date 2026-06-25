# 10. Codex Prompts for Frontend Integration

Use these prompts step by step. Do not ask Codex to implement everything in one pass.

## Prompt 1 — Read context and inspect frontend

```text
You are integrating a new map-service into an existing React frontend.

Read all files in this instruction package first:
- 00_FRONTEND_GLOBAL_RULES.md
- 01_FRONTEND_ARCHITECTURE.md
- 02_API_AND_TYPE_CONTRACTS.md
- 03_STATE_MODEL.md
- 04_RENDERING_ENGINE.md
- 05_GRID_CALIBRATION.md
- 06_WEBSOCKET_FLOW.md
- 07_UI_SCREENS_AND_ROUTES.md
- 08_ERRORS_SECURITY_AND_PERMISSIONS.md
- 09_TESTING_ACCEPTANCE.md

Then inspect the existing React project structure.

Do not implement yet.

Return:
1. Current frontend architecture summary.
2. Existing routing solution.
3. Existing auth/API client pattern.
4. Existing state management approach.
5. Existing UI/component library if any.
6. Proposed exact folder/file plan for src/features/map.
7. Any conflicts between this instruction package and the current project.
```

## Prompt 2 — Add map types and API client

```text
Implement the map-service REST client and TypeScript types.

Requirements:
- Create map domain/API/error types.
- Create a dedicated map-service API client.
- Do not mix map-service API with core backend API.
- Use the existing auth token/cookie mechanism from the app.
- Implement functions for:
  - uploadAsset
  - getAsset
  - getAssetContentUrl
  - listMaps
  - createMap
  - updateMapGridConfig
  - createSession
  - getSnapshot
  - createToken/updateToken/deleteToken if backend supports them
- Implement unified MapApiError parsing.
- Do not implement UI yet.
- Add unit tests for error parsing and URL generation if the project has tests.

Return changed files and how each function maps to backend endpoints.
```

## Prompt 3 — Add state model and revision guard

```text
Implement map frontend state.

Requirements:
- Separate committed state from transient state.
- Store snapshot, tokensById, currentRevision and permissions in committed state.
- Store drag preview, cursors, pings, selection and hover in transient state.
- Implement revision guard:
  - sequential committed event applies normally;
  - skipped revision sets needsResync;
  - transient events never change currentRevision.
- Do not implement WebSocket client yet.
- Add tests for:
  - snapshot init
  - TOKEN_MOVED sequential update
  - skipped revision -> needsResync
  - drag preview does not mutate committed token
  - cursor/ping are transient only.

Return changed files and tests.
```

## Prompt 4 — Add grid and viewport math

```text
Implement map rendering math utilities.

Requirements:
- Implement gridToImagePoint.
- Implement imagePointToGrid.
- Implement viewportPointToImagePoint.
- Implement imagePointToViewportPoint.
- Implement gridToViewportPoint.
- Implement viewportPointToGrid.
- Support square grid.
- Support viewport scale and offset.
- Keep rotationDeg in type. Implement rotation if feasible; otherwise document limitation clearly and validate rotationDeg=0 in MVP.
- Add unit tests for coordinate roundtrips, snapping and viewport conversion.

Do not implement UI components yet.
```

## Prompt 5 — Implement basic map renderer

```text
Implement the basic map renderer components.

Requirements:
- Create MapViewport component.
- Render background image from map asset content URL.
- Render square system grid overlay from gridConfig.
- Render tokens by grid coordinates.
- Support pan and zoom.
- Support fit/reset view if feasible.
- Do not implement WebSocket yet.
- Use existing UI conventions of the app.
- Keep rendering implementation isolated behind src/features/map/components and src/features/map/engine.

Add a temporary story/dev page or route only if consistent with the existing app.
Return changed files.
```

## Prompt 6 — Implement map list and editor screens

```text
Implement map management/editor UI.

Requirements:
- Add routes according to existing routing conventions:
  - campaign map list
  - map create/edit page
- GM can upload a map image through map-service.
- GM can create a map definition.
- GM can edit grid config.
- MVP grid calibration:
  - square grid
  - originX/originY
  - cellWidthPx/cellHeightPx
  - optional lock width/height
  - rotationDeg field if backend supports it
  - cellWorldSize/cellWorldUnit
- Preview grid overlay over uploaded image.
- Save grid config via REST.
- Use permissions from backend where available.
- Do not use iframe.

Return changed files and routes.
```

## Prompt 7 — Implement WebSocket/STOMP client

```text
Implement map-service WebSocket/STOMP integration.

Requirements:
- Endpoint: /ws/map unless backend README says otherwise.
- Centralize destination constants.
- On MapSessionPage:
  1. load REST snapshot;
  2. initialize committed store;
  3. connect WebSocket;
  4. subscribe to events/presence/user errors;
  5. send JOIN_SESSION.
- On unmount:
  - send LEAVE_SESSION if connected;
  - unsubscribe;
  - clear transient state.
- On reconnect:
  - reload REST snapshot;
  - reinitialize committed state;
  - send JOIN_SESSION again.
- Implement handlers for:
  - TOKEN_MOVED committed event;
  - TOKEN_DRAG_PREVIEW transient event;
  - CURSOR_UPDATED transient event;
  - PING_CREATED transient event;
  - USER_JOINED/USER_LEFT if backend provides them;
  - map errors.
- Do not optimistically commit movement before TOKEN_MOVED.

Return changed files and explain connection lifecycle.
```

## Prompt 8 — Implement token drag/move flow

```text
Implement token movement UX.

Requirements:
- User can drag tokens if permissions allow.
- Locked token cannot be moved.
- Dragging updates local preview.
- Drag preview sends throttled TOKEN_DRAG_PREVIEW over WebSocket.
- Dropping token sends MOVE_TOKEN with:
  - requestId
  - tokenId
  - expectedRevision from committed state
  - target grid coordinates
- Confirmed TOKEN_MOVED event updates committed position.
- If move fails:
  - clear local preview;
  - show error;
  - keep token at committed position.
- If REVISION_CONFLICT:
  - reload snapshot.
- Do not write movement through REST.

Return changed files and tests if possible.
```

## Prompt 9 — Add error handling and permission UX

```text
Harden map frontend error handling and permissions.

Requirements:
- Parse REST and WebSocket errors into user-facing messages.
- Disable/hide actions according to snapshot.permissions.
- Handle:
  - 401
  - 403
  - 404
  - REVISION_CONFLICT
  - TOKEN_LOCKED
  - MAP_SESSION_CLOSED
  - asset validation errors
- WebSocket disconnect must not crash the page.
- Map-service unavailable must show graceful error.
- Do not log auth tokens or signed URLs.

Return changed files and manual test checklist.
```

## Prompt 10 — Add tests and final frontend audit

```text
Perform a strict frontend audit for map integration.

Check:
1. No iframe is used.
2. Map code is isolated under src/features/map or equivalent.
3. Map-service API client is separate from core backend API client.
4. Token persistent position uses gridX/gridY, not pixels.
5. Background image is treated as visual layer only.
6. MOVE_TOKEN always includes expectedRevision.
7. Confirmed movement is applied only after TOKEN_MOVED event.
8. Drag preview/cursor/ping are transient and do not change currentRevision.
9. Revision gaps trigger snapshot reload.
10. Permissions are applied in UI but backend remains authoritative.
11. WebSocket reconnect reloads snapshot.
12. Existing app routes/auth still work.

Then add missing tests from 09_TESTING_ACCEPTANCE.md.

Do not add new features.
Return:
- found issues;
- fixes made;
- changed files;
- tests added;
- commands to run tests/build.
```
