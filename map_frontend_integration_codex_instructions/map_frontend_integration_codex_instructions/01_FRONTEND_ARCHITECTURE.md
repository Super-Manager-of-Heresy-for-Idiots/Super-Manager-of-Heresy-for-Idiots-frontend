# 01. Frontend Architecture

## Target shape

The existing React application remains the only frontend.

```text
React App
  ├── core features
  │   ├── auth
  │   ├── campaigns
  │   ├── characters
  │   └── inventory
  │
  └── map feature
      ├── map list / map management
      ├── map editor / grid calibration
      ├── active map session view
      ├── REST map-service client
      ├── STOMP websocket client
      ├── map rendering engine
      └── map state store
```

## Suggested folder structure

```text
src/features/map/
  api/
    mapApiClient.ts
    mapAssetApi.ts
    mapDefinitionApi.ts
    mapSessionApi.ts
    mapTokenApi.ts

  websocket/
    mapStompClient.ts
    mapWsDestinations.ts
    mapWsMessages.ts
    useMapSessionSocket.ts

  state/
    mapSessionStore.ts
    mapEditorStore.ts
    mapUiStore.ts
    mapSelectors.ts

  engine/
    gridMath.ts
    viewportMath.ts
    tokenMath.ts
    renderTypes.ts

  calibration/
    calibrationTypes.ts
    calibrationMath.ts
    GridCalibrationPanel.tsx
    GridOverlay.tsx

  components/
    MapCanvas.tsx
    MapViewport.tsx
    MapBackgroundLayer.tsx
    MapGridLayer.tsx
    MapTokenLayer.tsx
    MapFogLayer.tsx
    MapPingLayer.tsx
    MapCursorLayer.tsx
    MapToolbar.tsx
    TokenContextMenu.tsx

  pages/
    CampaignMapListPage.tsx
    MapEditorPage.tsx
    MapSessionPage.tsx

  types/
    mapApiTypes.ts
    mapDomainTypes.ts
    mapWsTypes.ts
    mapErrorTypes.ts

  hooks/
    useMapSnapshot.ts
    useMapAssets.ts
    useTokenDrag.ts
    useMapViewport.ts
    useGridCalibration.ts
    useRevisionGuard.ts

  utils/
    mapErrorUtils.ts
    mapPermissionUtils.ts
    throttling.ts
```

## Rendering approach

For MVP, prefer one of these two approaches:

### Option A: Canvas-based renderer

Best for:

- large maps;
- many tokens;
- smooth panning/zooming;
- future fog/grid/effects.

Implementation can use raw Canvas API or a canvas abstraction library if the project already uses one.

### Option B: SVG/HTML overlay renderer

Best for:

- faster MVP;
- fewer tokens;
- simpler selection/context menus;
- easier debugging.

Risk:

- performance may become worse with large maps, fog overlays, many tokens and frequent cursor updates.

## Recommendation

Implement the map renderer behind internal components and math utilities, so it can be replaced later.

Do not make the rest of the app depend on a specific rendering library.

Good boundary:

```text
MapSessionPage
  -> useMapSnapshot
  -> useMapSessionSocket
  -> MapViewport
      -> MapBackgroundLayer
      -> MapGridLayer
      -> MapTokenLayer
```

## Data direction

```text
REST snapshot
    ↓
Committed store
    ↓
Renderer

WebSocket committed events
    ↓
Revision guard
    ↓
Committed store
    ↓
Renderer

Local drag
    ↓
Transient preview store
    ↓
Renderer

Mouse release
    ↓
MOVE_TOKEN command
    ↓
Wait for confirmed event
```
