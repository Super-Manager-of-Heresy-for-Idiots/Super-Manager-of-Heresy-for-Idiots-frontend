import { describe, it, expect } from 'vitest';
import type { GridConfig, ImagePoint, ViewportPoint } from '../types';
import { gridConfigFromEditable, normalizeGridConfig, type EditableGridConfig } from '../calibration';
import {
  gridToImagePoint,
  imagePointToGrid,
  imagePointToViewportPoint,
  viewportPointToImagePoint,
  gridToViewportPoint,
  viewportPointToGrid,
  type MapViewportState,
} from './coords';

function squareGrid(over: Partial<GridConfig> = {}): GridConfig {
  return {
    type: 'SQUARE',
    cellWorldSize: 5,
    cellWorldUnit: 'ft',
    visual: { gridLineColor: '#FFFFFF', gridLineOpacity: 0.65, gridLineWidthPx: 1 },
    calibration: {
      mode: 'SIMPLE',
      origin: { imageX: 0, imageY: 0 },
      cellWidthPx: 50,
      cellHeightPx: 50,
      rotationDeg: 0,
    },
    ...over,
  };
}

function expectImagePointClose(actual: ImagePoint, imageX: number, imageY: number) {
  expect(actual.imageX).toBeCloseTo(imageX, 6);
  expect(actual.imageY).toBeCloseTo(imageY, 6);
}

function expectViewportPointClose(actual: ViewportPoint, x: number, y: number) {
  expect(actual.x).toBeCloseTo(x, 6);
  expect(actual.y).toBeCloseTo(y, 6);
}

describe('SIMPLE calibration', () => {
  it('places integer grid cells at origin + cellSize multiples', () => {
    const grid = squareGrid({
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 100, imageY: 200 },
        cellWidthPx: 64,
        cellHeightPx: 48,
        rotationDeg: 0,
      },
    });
    expectImagePointClose(gridToImagePoint(0, 0, grid), 100, 200);
    expectImagePointClose(gridToImagePoint(2, 3, grid), 100 + 2 * 64, 200 + 3 * 48);
  });

  it('roundtrips grid to image to grid for integer and fractional cells', () => {
    const grid = squareGrid({
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 10, imageY: -5 },
        cellWidthPx: 40,
        cellHeightPx: 32,
        rotationDeg: 0,
      },
    });
    for (const [gx, gy] of [[0, 0], [12, 8], [3.25, 1.5], [-2, 4]] as const) {
      const back = imagePointToGrid(gridToImagePoint(gx, gy, grid), grid);
      expect(back.gridX).toBeCloseTo(gx, 6);
      expect(back.gridY).toBeCloseTo(gy, 6);
    }
  });

  it('snaps to the containing cell when snap is enabled', () => {
    const grid = squareGrid();
    expect(imagePointToGrid({ imageX: 170, imageY: 80 }, grid, { snap: true })).toEqual({ gridX: 3, gridY: 1 });
  });

  it('rotates grid axes about the origin', () => {
    const grid = squareGrid({
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 100, imageY: 100 },
        cellWidthPx: 50,
        cellHeightPx: 50,
        rotationDeg: 90,
      },
    });
    expectImagePointClose(gridToImagePoint(1, 0, grid), 100, 150);
    expectImagePointClose(gridToImagePoint(0, 1, grid), 50, 100);
  });
});

describe('BOUNDS calibration', () => {
  const grid = squareGrid({
    calibration: {
      mode: 'BOUNDS',
      topLeft: { imageX: 100, imageY: 80 },
      bottomRight: { imageX: 500, imageY: 380 },
      columns: 40,
      rows: 30,
    },
  });

  it('projects topLeft correctly', () => {
    expectImagePointClose(gridToImagePoint(0, 0, grid), 100, 80);
  });

  it('projects bottomRight correctly', () => {
    expectImagePointClose(gridToImagePoint(40, 30, grid), 500, 380);
  });

  it('projects center correctly', () => {
    expectImagePointClose(gridToImagePoint(20, 15, grid), 300, 230);
  });

  it('roundtrips viewport to image to grid with snap', () => {
    const viewport: MapViewportState = { scale: 2, offsetX: 10, offsetY: 20 };
    const point = gridToViewportPoint(12, 8, grid, viewport);
    expect(viewportPointToGrid(point, grid, viewport, { snap: true })).toEqual({ gridX: 12, gridY: 8 });
  });

  it('does not treat raw viewport/container coordinates as calibration coordinates', () => {
    const viewport: MapViewportState = { scale: 2, offsetX: 50, offsetY: 30 };
    const viewportPoint = gridToViewportPoint(12, 8, grid, viewport);

    expect(viewportPoint).toEqual({ x: 490, y: 350 });
    expect(viewportPointToGrid(viewportPoint, grid, viewport, { snap: true })).toEqual({ gridX: 12, gridY: 8 });
    expect(imagePointToGrid({ imageX: viewportPoint.x, imageY: viewportPoint.y }, grid, { snap: true })).not.toEqual({
      gridX: 12,
      gridY: 8,
    });
  });
});

describe('FOUR_CORNER calibration', () => {
  const grid = squareGrid({
    calibration: {
      mode: 'FOUR_CORNER',
      columns: 40,
      rows: 30,
      corners: {
        topLeft: { imageX: 112, imageY: 85 },
        topRight: { imageX: 2918, imageY: 102 },
        bottomRight: { imageX: 2895, imageY: 2188 },
        bottomLeft: { imageX: 98, imageY: 2170 },
      },
    },
  });

  it('projects all four corners correctly', () => {
    expectImagePointClose(gridToImagePoint(0, 0, grid), 112, 85);
    expectImagePointClose(gridToImagePoint(40, 0, grid), 2918, 102);
    expectImagePointClose(gridToImagePoint(40, 30, grid), 2895, 2188);
    expectImagePointClose(gridToImagePoint(0, 30, grid), 98, 2170);
  });

  it('projects the center to the bilinear center', () => {
    const center = gridToImagePoint(20, 15, grid);
    expect(center.imageX).toBeCloseTo((112 + 2918 + 2895 + 98) / 4, 6);
    expect(center.imageY).toBeCloseTo((85 + 102 + 2188 + 2170) / 4, 6);
  });

  it('approximately inverts projected points', () => {
    const back = imagePointToGrid(gridToImagePoint(12, 9, grid), grid);
    expect(back.gridX).toBeCloseTo(12, 4);
    expect(back.gridY).toBeCloseTo(9, 4);
  });
});

describe('viewport conversions', () => {
  const viewport: MapViewportState = { scale: 2, offsetX: 10, offsetY: 20 };

  it('roundtrips image to viewport to image', () => {
    const img: ImagePoint = { imageX: 200, imageY: 130 };
    expectViewportPointClose(imagePointToViewportPoint(img, viewport), 410, 280);
    expectImagePointClose(viewportPointToImagePoint(imagePointToViewportPoint(img, viewport), viewport), 200, 130);
  });
});

describe('editor/runtime projection invariant', () => {
  const viewport: MapViewportState = { scale: 0.75, offsetX: 24, offsetY: 36 };

  it('projects BOUNDS configs identically after editor and runtime normalization', () => {
    const editable: EditableGridConfig = {
      type: 'SQUARE',
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
      visual: { gridLineColor: '#00FFFF', gridLineOpacity: 0.4, gridLineWidthPx: 2 },
      calibration: {
        mode: 'BOUNDS',
        topLeft: { imageX: 100, imageY: 80 },
        bottomRight: { imageX: 500, imageY: 380 },
        columns: 40,
        rows: 30,
      },
    };
    const editorGrid = gridConfigFromEditable(editable);
    const runtimeGrid = normalizeGridConfig(JSON.parse(JSON.stringify(editorGrid)));

    expect(gridToViewportPoint(12, 8, editorGrid, viewport)).toEqual(
      gridToViewportPoint(12, 8, runtimeGrid, viewport),
    );
  });

  it('projects FOUR_CORNER configs identically after editor and runtime normalization', () => {
    const editable: EditableGridConfig = {
      type: 'SQUARE',
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
      visual: { gridLineColor: '#FF00FF', gridLineOpacity: 0.5, gridLineWidthPx: 3 },
      calibration: {
        mode: 'FOUR_CORNER',
        columns: 40,
        rows: 30,
        corners: {
          topLeft: { imageX: 112, imageY: 85 },
          topRight: { imageX: 2918, imageY: 102 },
          bottomRight: { imageX: 2895, imageY: 2188 },
          bottomLeft: { imageX: 98, imageY: 2170 },
        },
      },
    };
    const editorGrid = gridConfigFromEditable(editable);
    const runtimeGrid = normalizeGridConfig(JSON.parse(JSON.stringify(editorGrid)));

    expect(gridToViewportPoint(12, 8, editorGrid, viewport)).toEqual(
      gridToViewportPoint(12, 8, runtimeGrid, viewport),
    );
  });
});
