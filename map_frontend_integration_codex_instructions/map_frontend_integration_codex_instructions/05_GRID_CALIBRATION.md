# 05. Grid Calibration

## Goal

Users upload arbitrary DnD map images. The frontend must let the GM align the application's system grid with the visible map image.

The system grid is the source of truth.

The uploaded image is a background.

## MVP calibration mode

Support square grid calibration first.

Editable fields:

```ts
type EditableGridConfig = {
  originX: number;
  originY: number;
  cellWidthPx: number;
  cellHeightPx: number;
  rotationDeg: number;
  cellWorldSize: number;
  cellWorldUnit: 'ft' | 'm' | 'custom';
};
```

UI controls:

- drag grid origin;
- change cell size with slider/input;
- optionally lock cell width/height together;
- optionally rotate grid;
- preview grid overlay;
- save grid config;
- reset changes;
- fit image to viewport.

## Calibration screen

Route example:

```text
/campaigns/:campaignId/maps/:mapId/edit
```

Page responsibilities:

```text
1. Load map definition.
2. Load map asset URL.
3. Render background image.
4. Render editable grid overlay.
5. Allow GM to adjust grid.
6. Save gridConfig through REST.
```

## Two-point calibration future option

Do not implement unless requested, but keep structure ready.

Concept:

```text
GM clicks two known grid intersections.
GM enters how many cells are between them.
Frontend calculates cell size and rotation.
```

Types:

```ts
type TwoPointCalibration = {
  pointA: { imageX: number; imageY: number };
  pointB: { imageX: number; imageY: number };
  cellsBetween: number;
};
```

## Three-point calibration future option

Useful for independent X/Y axis calibration.

Concept:

```text
A = origin
B = point along X axis after N cells
C = point along Y axis after M cells
```

Keep this as future work.

## Validation

Frontend must validate before sending grid config:

```text
cellWidthPx > 0
cellHeightPx > 0
cellWorldSize > 0
rotationDeg finite
originX/originY finite
```

Backend remains final validator.

## Important UX

Show warning in GM editor mode:

```text
Characters move on the system grid. The image is only a visual background.
```

Do not show this as a technical warning to normal players.
