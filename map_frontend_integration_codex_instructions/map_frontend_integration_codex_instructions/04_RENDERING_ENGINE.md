# 04. Rendering Engine

## Rendering layers

The map should be rendered in visual layers:

```text
MapViewport
  Background image layer
  System grid layer
  Fog layer
  Token layer
  Measurement layer
  Ping layer
  Cursor layer
  UI overlay layer
```

Keep layer components independent.

## Coordinate systems

There are at least three coordinate systems:

```text
Grid coordinates:
- logical gameplay coordinates
- token persistence
- example: gridX=12, gridY=8

Image coordinates:
- pixels relative to original map image
- grid config origin and cell size are expressed here

Viewport/screen coordinates:
- pixels on the user's current browser viewport after zoom/pan
```

Do not mix them.

## Required utility functions

Implement and test:

```ts
export type Point = { x: number; y: number };

export function gridToImagePoint(
  gridX: number,
  gridY: number,
  grid: GridConfig
): Point;

export function imagePointToGrid(
  point: Point,
  grid: GridConfig,
  options?: { snap?: boolean }
): { gridX: number; gridY: number };

export function imagePointToViewportPoint(
  point: Point,
  viewport: MapViewportState
): Point;

export function viewportPointToImagePoint(
  point: Point,
  viewport: MapViewportState
): Point;

export function gridToViewportPoint(
  gridX: number,
  gridY: number,
  grid: GridConfig,
  viewport: MapViewportState
): Point;

export function viewportPointToGrid(
  point: Point,
  grid: GridConfig,
  viewport: MapViewportState,
  options?: { snap?: boolean }
): { gridX: number; gridY: number };
```

## Rotation

If `rotationDeg` is present, grid conversion must support it.

Minimum acceptable MVP:

- rotation default is 0;
- UI may expose rotation later;
- math functions must not hard-code assumption that rotation is always 0 unless this limitation is explicitly documented and validated.

## Viewport state

```ts
export type MapViewportState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};
```

Required behavior:

- mouse wheel zoom;
- pan by dragging empty map area or middle mouse;
- zoom centered around mouse position if feasible;
- reset view button;
- fit to screen button.

## Token rendering

Token visual size should use `widthCells` and `heightCells`.

For square grid:

```text
token image width = widthCells * cellWidthPx * viewport.scale
token image height = heightCells * cellHeightPx * viewport.scale
```

Token anchor policy must be consistent.

Recommended:

- `gridX`, `gridY` represent top-left occupied cell.
- token rendered from top-left.
- large creatures occupy rectangular cell area.

If using center anchor, document it and make backend/frontend agree.

## Drag movement

On drag start:

```text
1. Check permissions.
2. Check token not locked.
3. Store original grid position.
4. Start local preview.
```

On drag move:

```text
1. Convert pointer viewport point to grid.
2. Snap to cell if snap mode enabled.
3. Update local preview.
4. Throttle TOKEN_DRAG_PREVIEW event.
```

On drag end:

```text
1. Compute target grid cell.
2. Clear local preview only after confirmed event or failed command.
3. Send MOVE_TOKEN with expectedRevision.
4. If command fails, return token to committed position and show error.
```

## Throttling

Cursor and drag preview events must be throttled.

Suggested limits:

```text
cursor update: 10-15 times per second
drag preview: 15-20 times per second
ping: no throttle needed, user action
confirmed move: no throttle, only on drop
```

Do not throttle committed event application.
