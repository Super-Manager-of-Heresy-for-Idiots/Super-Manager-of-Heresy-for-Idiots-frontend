import type {
  BoundsGridCalibration,
  FourCornerGridCalibration,
  GridCalibration,
  GridConfig,
  ImagePoint,
  SimpleGridCalibration,
  ThreePointGridCalibration,
  ViewportPoint,
} from '../types';

export type Point = ViewportPoint;

export interface GridCoord {
  gridX: number;
  gridY: number;
}

export interface MapViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface GridCellImageMetrics {
  widthPx: number;
  heightPx: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: ImagePoint, b: ImagePoint, t: number): ImagePoint {
  return {
    imageX: lerp(a.imageX, b.imageX, t),
    imageY: lerp(a.imageY, b.imageY, t),
  };
}

function distance(a: ImagePoint, b: ImagePoint): number {
  return Math.hypot(a.imageX - b.imageX, a.imageY - b.imageY);
}

function gridToImageSimple(gridX: number, gridY: number, calibration: SimpleGridCalibration): ImagePoint {
  const localX = gridX * calibration.cellWidthPx;
  const localY = gridY * calibration.cellHeightPx;
  if (!calibration.rotationDeg) {
    return {
      imageX: calibration.origin.imageX + localX,
      imageY: calibration.origin.imageY + localY,
    };
  }
  const theta = toRadians(calibration.rotationDeg);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    imageX: calibration.origin.imageX + localX * cos - localY * sin,
    imageY: calibration.origin.imageY + localX * sin + localY * cos,
  };
}

function imageToGridSimple(point: ImagePoint, calibration: SimpleGridCalibration): GridCoord {
  const dx = point.imageX - calibration.origin.imageX;
  const dy = point.imageY - calibration.origin.imageY;
  let localX: number;
  let localY: number;

  if (!calibration.rotationDeg) {
    localX = dx;
    localY = dy;
  } else {
    const theta = toRadians(calibration.rotationDeg);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    localX = dx * cos + dy * sin;
    localY = -dx * sin + dy * cos;
  }

  return {
    gridX: localX / calibration.cellWidthPx,
    gridY: localY / calibration.cellHeightPx,
  };
}

function gridToImageBounds(gridX: number, gridY: number, calibration: BoundsGridCalibration): ImagePoint {
  const cellWidth = (calibration.bottomRight.imageX - calibration.topLeft.imageX) / calibration.columns;
  const cellHeight = (calibration.bottomRight.imageY - calibration.topLeft.imageY) / calibration.rows;
  return {
    imageX: calibration.topLeft.imageX + gridX * cellWidth,
    imageY: calibration.topLeft.imageY + gridY * cellHeight,
  };
}

function imageToGridBounds(point: ImagePoint, calibration: BoundsGridCalibration): GridCoord {
  const cellWidth = (calibration.bottomRight.imageX - calibration.topLeft.imageX) / calibration.columns;
  const cellHeight = (calibration.bottomRight.imageY - calibration.topLeft.imageY) / calibration.rows;
  return {
    gridX: (point.imageX - calibration.topLeft.imageX) / cellWidth,
    gridY: (point.imageY - calibration.topLeft.imageY) / cellHeight,
  };
}

function gridToImageThreePoint(gridX: number, gridY: number, calibration: ThreePointGridCalibration): ImagePoint {
  const xUnit = {
    imageX: (calibration.xAxisPoint.imageX - calibration.origin.imageX) / calibration.xCells,
    imageY: (calibration.xAxisPoint.imageY - calibration.origin.imageY) / calibration.xCells,
  };
  const yUnit = {
    imageX: (calibration.yAxisPoint.imageX - calibration.origin.imageX) / calibration.yCells,
    imageY: (calibration.yAxisPoint.imageY - calibration.origin.imageY) / calibration.yCells,
  };
  return {
    imageX: calibration.origin.imageX + gridX * xUnit.imageX + gridY * yUnit.imageX,
    imageY: calibration.origin.imageY + gridX * xUnit.imageY + gridY * yUnit.imageY,
  };
}

function imageToGridThreePoint(point: ImagePoint, calibration: ThreePointGridCalibration): GridCoord {
  const ax = (calibration.xAxisPoint.imageX - calibration.origin.imageX) / calibration.xCells;
  const ay = (calibration.xAxisPoint.imageY - calibration.origin.imageY) / calibration.xCells;
  const bx = (calibration.yAxisPoint.imageX - calibration.origin.imageX) / calibration.yCells;
  const by = (calibration.yAxisPoint.imageY - calibration.origin.imageY) / calibration.yCells;
  const px = point.imageX - calibration.origin.imageX;
  const py = point.imageY - calibration.origin.imageY;
  const det = ax * by - ay * bx;
  if (Math.abs(det) < 0.000001) return { gridX: 0, gridY: 0 };
  return {
    gridX: (px * by - py * bx) / det,
    gridY: (ax * py - ay * px) / det,
  };
}

function gridToImageFourCornerUv(u: number, v: number, calibration: FourCornerGridCalibration): ImagePoint {
  const top = lerpPoint(calibration.corners.topLeft, calibration.corners.topRight, u);
  const bottom = lerpPoint(calibration.corners.bottomLeft, calibration.corners.bottomRight, u);
  return lerpPoint(top, bottom, v);
}

function gridToImageFourCorner(gridX: number, gridY: number, calibration: FourCornerGridCalibration): ImagePoint {
  return gridToImageFourCornerUv(gridX / calibration.columns, gridY / calibration.rows, calibration);
}

function imageToGridFourCorner(point: ImagePoint, calibration: FourCornerGridCalibration): GridCoord {
  const boundsApprox: BoundsGridCalibration = {
    mode: 'BOUNDS',
    topLeft: calibration.corners.topLeft,
    bottomRight: calibration.corners.bottomRight,
    columns: calibration.columns,
    rows: calibration.rows,
  };
  const approx = imageToGridBounds(point, boundsApprox);
  let u = Math.min(1, Math.max(0, approx.gridX / calibration.columns));
  let v = Math.min(1, Math.max(0, approx.gridY / calibration.rows));

  for (let i = 0; i < 12; i += 1) {
    const projected = gridToImageFourCornerUv(u, v, calibration);
    const fx = projected.imageX - point.imageX;
    const fy = projected.imageY - point.imageY;

    const topDx = calibration.corners.topRight.imageX - calibration.corners.topLeft.imageX;
    const topDy = calibration.corners.topRight.imageY - calibration.corners.topLeft.imageY;
    const bottomDx = calibration.corners.bottomRight.imageX - calibration.corners.bottomLeft.imageX;
    const bottomDy = calibration.corners.bottomRight.imageY - calibration.corners.bottomLeft.imageY;
    const leftDx = calibration.corners.bottomLeft.imageX - calibration.corners.topLeft.imageX;
    const leftDy = calibration.corners.bottomLeft.imageY - calibration.corners.topLeft.imageY;
    const rightDx = calibration.corners.bottomRight.imageX - calibration.corners.topRight.imageX;
    const rightDy = calibration.corners.bottomRight.imageY - calibration.corners.topRight.imageY;

    const dux = lerp(topDx, bottomDx, v);
    const duy = lerp(topDy, bottomDy, v);
    const dvx = lerp(leftDx, rightDx, u);
    const dvy = lerp(leftDy, rightDy, u);
    const det = dux * dvy - duy * dvx;
    if (Math.abs(det) < 0.000001) break;

    const deltaU = (fx * dvy - fy * dvx) / det;
    const deltaV = (dux * fy - duy * fx) / det;
    u = Math.min(1, Math.max(0, u - deltaU));
    v = Math.min(1, Math.max(0, v - deltaV));
    if (Math.abs(deltaU) + Math.abs(deltaV) < 0.000001) break;
  }

  return {
    gridX: u * calibration.columns,
    gridY: v * calibration.rows,
  };
}

function representativeCalibration(calibration: GridCalibration): SimpleGridCalibration | BoundsGridCalibration {
  if (calibration.mode === 'PIECEWISE' && calibration.anchors.length >= 2) {
    const minX = Math.min(...calibration.anchors.map((a) => a.imageX));
    const minY = Math.min(...calibration.anchors.map((a) => a.imageY));
    const maxX = Math.max(...calibration.anchors.map((a) => a.imageX));
    const maxY = Math.max(...calibration.anchors.map((a) => a.imageY));
    return {
      mode: 'BOUNDS',
      topLeft: { imageX: minX, imageY: minY },
      bottomRight: { imageX: maxX, imageY: maxY },
      columns: calibration.columns,
      rows: calibration.rows,
    };
  }
  return {
    mode: 'SIMPLE',
    origin: { imageX: 0, imageY: 0 },
    cellWidthPx: 64,
    cellHeightPx: 64,
    rotationDeg: 0,
  };
}

export function gridToImagePoint(gridX: number, gridY: number, gridConfig: GridConfig): ImagePoint {
  const calibration = gridConfig.calibration;
  if (calibration.mode === 'SIMPLE') return gridToImageSimple(gridX, gridY, calibration);
  if (calibration.mode === 'BOUNDS') return gridToImageBounds(gridX, gridY, calibration);
  if (calibration.mode === 'THREE_POINT') return gridToImageThreePoint(gridX, gridY, calibration);
  if (calibration.mode === 'FOUR_CORNER') return gridToImageFourCorner(gridX, gridY, calibration);
  return gridToImagePoint(gridX, gridY, { ...gridConfig, calibration: representativeCalibration(calibration) });
}

export function imagePointToGrid(
  point: ImagePoint,
  gridConfig: GridConfig,
  options?: { snap?: boolean },
): GridCoord {
  const calibration = gridConfig.calibration;
  let coord: GridCoord;
  if (calibration.mode === 'SIMPLE') coord = imageToGridSimple(point, calibration);
  else if (calibration.mode === 'BOUNDS') coord = imageToGridBounds(point, calibration);
  else if (calibration.mode === 'THREE_POINT') coord = imageToGridThreePoint(point, calibration);
  else if (calibration.mode === 'FOUR_CORNER') coord = imageToGridFourCorner(point, calibration);
  else coord = imagePointToGrid(point, { ...gridConfig, calibration: representativeCalibration(calibration) });

  if (!options?.snap) return coord;
  return {
    gridX: Math.floor(coord.gridX),
    gridY: Math.floor(coord.gridY),
  };
}

export function imagePointToViewportPoint(point: ImagePoint, viewport: MapViewportState): ViewportPoint {
  return {
    x: point.imageX * viewport.scale + viewport.offsetX,
    y: point.imageY * viewport.scale + viewport.offsetY,
  };
}

export function viewportPointToImagePoint(point: ViewportPoint, viewport: MapViewportState): ImagePoint {
  return {
    imageX: (point.x - viewport.offsetX) / viewport.scale,
    imageY: (point.y - viewport.offsetY) / viewport.scale,
  };
}

export function gridToViewportPoint(
  gridX: number,
  gridY: number,
  gridConfig: GridConfig,
  viewport: MapViewportState,
): ViewportPoint {
  return imagePointToViewportPoint(gridToImagePoint(gridX, gridY, gridConfig), viewport);
}

export function viewportPointToGrid(
  point: ViewportPoint,
  gridConfig: GridConfig,
  viewport: MapViewportState,
  options?: { snap?: boolean },
): GridCoord {
  return imagePointToGrid(viewportPointToImagePoint(point, viewport), gridConfig, options);
}

export function getGridCellImageMetrics(
  gridX: number,
  gridY: number,
  widthCells: number,
  heightCells: number,
  gridConfig: GridConfig,
): GridCellImageMetrics {
  const topLeft = gridToImagePoint(gridX, gridY, gridConfig);
  const topRight = gridToImagePoint(gridX + widthCells, gridY, gridConfig);
  const bottomLeft = gridToImagePoint(gridX, gridY + heightCells, gridConfig);
  return {
    widthPx: Math.max(12, distance(topLeft, topRight)),
    heightPx: Math.max(12, distance(topLeft, bottomLeft)),
  };
}

export function getCalibrationDimensions(calibration: GridCalibration): { columns: number; rows: number } | null {
  if (calibration.mode === 'BOUNDS' || calibration.mode === 'FOUR_CORNER' || calibration.mode === 'PIECEWISE') {
    return { columns: calibration.columns, rows: calibration.rows };
  }
  return null;
}
