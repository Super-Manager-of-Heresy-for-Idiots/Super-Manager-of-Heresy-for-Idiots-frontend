import type {
  CellWorldUnit,
  GridCalibration,
  GridConfig,
  GridVisualConfig,
  ImagePoint,
} from '../types';

export type VisibleGridAnswer = 'unknown' | 'yes' | 'no';
export type CalibrationChoice = 'SIMPLE' | 'BOUNDS' | 'FOUR_CORNER' | 'THREE_POINT' | 'PIECEWISE';

export interface EditableGridConfig {
  type: GridConfig['type'];
  cellWorldSize: number;
  cellWorldUnit: CellWorldUnit;
  visual: GridVisualConfig;
  calibration: GridCalibration;
}

export type GridConfigField =
  | 'cellWorldSize'
  | 'gridLineColor'
  | 'gridLineOpacity'
  | 'gridLineWidthPx'
  | 'columns'
  | 'rows'
  | 'cellWidthPx'
  | 'cellHeightPx'
  | 'rotationDeg'
  | 'points';

export type GridConfigErrorCode =
  | 'POSITIVE_REQUIRED'
  | 'FINITE_REQUIRED'
  | 'INTEGER_REQUIRED'
  | 'COLOR_REQUIRED'
  | 'OPACITY_RANGE'
  | 'WIDTH_RANGE'
  | 'POINTS_REQUIRED';

export type GridConfigErrors = Partial<Record<GridConfigField, GridConfigErrorCode>>;

export type CalibrationClickTarget =
  | 'BOUNDS_TOP_LEFT'
  | 'BOUNDS_BOTTOM_RIGHT'
  | 'FOUR_TOP_LEFT'
  | 'FOUR_TOP_RIGHT'
  | 'FOUR_BOTTOM_RIGHT'
  | 'FOUR_BOTTOM_LEFT';

export interface CalibrationClickState {
  target: CalibrationClickTarget;
  instruction: string;
}

export type ClickedCalibrationPoints = Partial<Record<CalibrationClickTarget, ImagePoint>>;
