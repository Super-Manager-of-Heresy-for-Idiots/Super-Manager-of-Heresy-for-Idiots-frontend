import type {
  BoundsGridCalibration,
  CellWorldUnit,
  FourCornerGridCalibration,
  GridCalibration,
  GridConfig,
  GridType,
  GridVisualConfig,
  ImagePoint,
  LegacySimpleGridConfig,
  SimpleGridCalibration,
} from '../types';
import type { EditableGridConfig, GridConfigErrors } from './calibrationTypes';

export const CALIBRATION_GRID_TYPE: GridType = 'SQUARE';

export const DEFAULT_GRID_VISUAL: GridVisualConfig = {
  gridLineColor: '#FFFFFF',
  gridLineOpacity: 0.65,
  gridLineWidthPx: 1,
};

const DEFAULT_SIMPLE: SimpleGridCalibration = {
  mode: 'SIMPLE',
  origin: { imageX: 0, imageY: 0 },
  cellWidthPx: 64,
  cellHeightPx: 64,
  rotationDeg: 0,
};

const GRID_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positive(value: unknown, fallback: number): number {
  const n = finite(value, fallback);
  return n > 0 ? n : fallback;
}

function positiveInt(value: unknown, fallback: number): number {
  const n = Math.floor(positive(value, fallback));
  return n > 0 ? n : fallback;
}

function unit(value: unknown): CellWorldUnit {
  return value === 'm' || value === 'custom' ? value : 'ft';
}

function imagePoint(value: unknown, fallback: ImagePoint): ImagePoint {
  if (!isRecord(value)) return fallback;
  return {
    imageX: finite(value.imageX, fallback.imageX),
    imageY: finite(value.imageY, fallback.imageY),
  };
}

export function resolveGridVisual(visual?: Partial<GridVisualConfig>): GridVisualConfig {
  return {
    gridLineColor: visual?.gridLineColor ?? DEFAULT_GRID_VISUAL.gridLineColor,
    gridLineOpacity: visual?.gridLineOpacity ?? DEFAULT_GRID_VISUAL.gridLineOpacity,
    gridLineWidthPx: visual?.gridLineWidthPx ?? DEFAULT_GRID_VISUAL.gridLineWidthPx,
  };
}

function visual(value: unknown): GridVisualConfig {
  if (!isRecord(value)) return { ...DEFAULT_GRID_VISUAL };
  const gridLineColor =
    typeof value.gridLineColor === 'string' && isValidGridLineColor(value.gridLineColor)
      ? value.gridLineColor.toUpperCase()
      : DEFAULT_GRID_VISUAL.gridLineColor;
  return resolveGridVisual({
    gridLineColor,
    gridLineOpacity: Math.min(1, Math.max(0, finite(value.gridLineOpacity, DEFAULT_GRID_VISUAL.gridLineOpacity))),
    gridLineWidthPx: Math.min(10, Math.max(0.1, finite(value.gridLineWidthPx, DEFAULT_GRID_VISUAL.gridLineWidthPx))),
  });
}

function simpleCalibration(value: Record<string, unknown>): SimpleGridCalibration {
  return {
    mode: 'SIMPLE',
    origin: imagePoint(value.origin, DEFAULT_SIMPLE.origin),
    cellWidthPx: positive(value.cellWidthPx, DEFAULT_SIMPLE.cellWidthPx),
    cellHeightPx: positive(value.cellHeightPx, DEFAULT_SIMPLE.cellHeightPx),
    rotationDeg: finite(value.rotationDeg, DEFAULT_SIMPLE.rotationDeg),
  };
}

function boundsCalibration(value: Record<string, unknown>): BoundsGridCalibration {
  return {
    mode: 'BOUNDS',
    topLeft: imagePoint(value.topLeft, { imageX: 0, imageY: 0 }),
    bottomRight: imagePoint(value.bottomRight, { imageX: 640, imageY: 640 }),
    columns: positiveInt(value.columns, 10),
    rows: positiveInt(value.rows, 10),
  };
}

function fourCornerCalibration(value: Record<string, unknown>): FourCornerGridCalibration {
  const corners = isRecord(value.corners) ? value.corners : {};
  return {
    mode: 'FOUR_CORNER',
    columns: positiveInt(value.columns, 10),
    rows: positiveInt(value.rows, 10),
    corners: {
      topLeft: imagePoint(corners.topLeft, { imageX: 0, imageY: 0 }),
      topRight: imagePoint(corners.topRight, { imageX: 640, imageY: 0 }),
      bottomRight: imagePoint(corners.bottomRight, { imageX: 640, imageY: 640 }),
      bottomLeft: imagePoint(corners.bottomLeft, { imageX: 0, imageY: 640 }),
    },
  };
}

function normalizeCalibration(value: unknown): GridCalibration {
  if (!isRecord(value) || typeof value.mode !== 'string') return DEFAULT_SIMPLE;
  if (value.mode === 'BOUNDS') return boundsCalibration(value);
  if (value.mode === 'FOUR_CORNER') return fourCornerCalibration(value);
  if (value.mode === 'THREE_POINT') {
    return {
      mode: 'THREE_POINT',
      origin: imagePoint(value.origin, { imageX: 0, imageY: 0 }),
      xAxisPoint: imagePoint(value.xAxisPoint, { imageX: 640, imageY: 0 }),
      yAxisPoint: imagePoint(value.yAxisPoint, { imageX: 0, imageY: 640 }),
      xCells: positiveInt(value.xCells, 10),
      yCells: positiveInt(value.yCells, 10),
    };
  }
  if (value.mode === 'PIECEWISE') {
    const anchors = Array.isArray(value.anchors)
      ? value.anchors.filter(isRecord).map((anchor) => ({
          gridX: finite(anchor.gridX, 0),
          gridY: finite(anchor.gridY, 0),
          imageX: finite(anchor.imageX, 0),
          imageY: finite(anchor.imageY, 0),
        }))
      : [];
    return {
      mode: 'PIECEWISE',
      columns: positiveInt(value.columns, 10),
      rows: positiveInt(value.rows, 10),
      anchors,
    };
  }
  return simpleCalibration(value);
}

function isLegacySimpleGridConfig(value: unknown): value is LegacySimpleGridConfig {
  return (
    isRecord(value) &&
    typeof value.originX === 'number' &&
    typeof value.originY === 'number' &&
    typeof value.cellWidthPx === 'number' &&
    typeof value.cellHeightPx === 'number'
  );
}

export function normalizeGridConfig(raw: unknown): GridConfig {
  if (isLegacySimpleGridConfig(raw)) {
    return {
      type: 'SQUARE',
      cellWorldSize: positive(raw.cellWorldSize, 5),
      cellWorldUnit: unit(raw.cellWorldUnit),
      visual: { ...DEFAULT_GRID_VISUAL },
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: finite(raw.originX, 0), imageY: finite(raw.originY, 0) },
        cellWidthPx: positive(raw.cellWidthPx, DEFAULT_SIMPLE.cellWidthPx),
        cellHeightPx: positive(raw.cellHeightPx, DEFAULT_SIMPLE.cellHeightPx),
        rotationDeg: finite(raw.rotationDeg, 0),
      },
    };
  }

  if (!isRecord(raw)) {
    return {
      type: 'SQUARE',
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
      visual: { ...DEFAULT_GRID_VISUAL },
      calibration: DEFAULT_SIMPLE,
    };
  }

  return {
    type:
      raw.type === 'HEX_VERTICAL' || raw.type === 'HEX_HORIZONTAL' || raw.type === 'FREE'
        ? raw.type
        : 'SQUARE',
    cellWorldSize: positive(raw.cellWorldSize, 5),
    cellWorldUnit: unit(raw.cellWorldUnit),
    visual: visual(raw.visual),
    calibration: normalizeCalibration(raw.calibration),
  };
}

export function editableFromGridConfig(grid: GridConfig): EditableGridConfig {
  const normalized = normalizeGridConfig(grid);
  return {
    ...normalized,
    visual: normalized.visual ?? { ...DEFAULT_GRID_VISUAL },
  };
}

export function gridConfigFromEditable(editable: EditableGridConfig): GridConfig {
  return normalizeGridConfig(editable);
}

export function isValidGridLineColor(color: string): boolean {
  return GRID_COLOR_PATTERN.test(color);
}

export function validateGridConfig(editable: EditableGridConfig): GridConfigErrors {
  const errors: GridConfigErrors = {};
  if (!(editable.cellWorldSize > 0)) errors.cellWorldSize = 'POSITIVE_REQUIRED';
  if (!isValidGridLineColor(editable.visual.gridLineColor)) errors.gridLineColor = 'COLOR_REQUIRED';
  if (!(editable.visual.gridLineOpacity >= 0 && editable.visual.gridLineOpacity <= 1)) {
    errors.gridLineOpacity = 'OPACITY_RANGE';
  }
  if (!(editable.visual.gridLineWidthPx > 0 && editable.visual.gridLineWidthPx <= 10)) {
    errors.gridLineWidthPx = 'WIDTH_RANGE';
  }

  const cal = editable.calibration;
  if (cal.mode === 'SIMPLE') {
    if (!(cal.cellWidthPx > 0)) errors.cellWidthPx = 'POSITIVE_REQUIRED';
    if (!(cal.cellHeightPx > 0)) errors.cellHeightPx = 'POSITIVE_REQUIRED';
    if (!Number.isFinite(cal.rotationDeg)) errors.rotationDeg = 'FINITE_REQUIRED';
  }
  if (cal.mode === 'BOUNDS' || cal.mode === 'FOUR_CORNER' || cal.mode === 'PIECEWISE') {
    if (!Number.isInteger(cal.columns) || cal.columns <= 0) errors.columns = 'INTEGER_REQUIRED';
    if (!Number.isInteger(cal.rows) || cal.rows <= 0) errors.rows = 'INTEGER_REQUIRED';
  }
  if (cal.mode === 'PIECEWISE' && cal.anchors.length === 0) errors.points = 'POINTS_REQUIRED';
  return errors;
}

export function isGridConfigValid(editable: EditableGridConfig): boolean {
  return Object.keys(validateGridConfig(editable)).length === 0;
}
