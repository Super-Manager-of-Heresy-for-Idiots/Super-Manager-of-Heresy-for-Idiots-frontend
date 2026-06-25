import { describe, expect, it } from 'vitest';
import type { GridConfig, LegacySimpleGridConfig } from '../types';
import {
  DEFAULT_GRID_VISUAL,
  editableFromGridConfig,
  gridConfigFromEditable,
  isGridConfigValid,
  isValidGridLineColor,
  normalizeGridConfig,
  resolveGridVisual,
  validateGridConfig,
} from './calibrationMath';
import type { EditableGridConfig } from './calibrationTypes';

const VALID: EditableGridConfig = {
  type: 'SQUARE',
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
  visual: { ...DEFAULT_GRID_VISUAL },
  calibration: {
    mode: 'SIMPLE',
    origin: { imageX: 10, imageY: 20 },
    cellWidthPx: 50,
    cellHeightPx: 50,
    rotationDeg: 0,
  },
};

describe('normalizeGridConfig', () => {
  it('normalizes legacy SIMPLE config', () => {
    const legacy: LegacySimpleGridConfig = {
      type: 'SQUARE',
      originX: 12,
      originY: 18,
      cellWidthPx: 70,
      cellHeightPx: 72,
      rotationDeg: 5,
      cellWorldSize: 10,
      cellWorldUnit: 'm',
    };
    expect(normalizeGridConfig(legacy)).toEqual({
      type: 'SQUARE',
      cellWorldSize: 10,
      cellWorldUnit: 'm',
      visual: DEFAULT_GRID_VISUAL,
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 12, imageY: 18 },
        cellWidthPx: 70,
        cellHeightPx: 72,
        rotationDeg: 5,
      },
    });
  });

  it('applies grid visual defaults when missing', () => {
    const normalized = normalizeGridConfig({
      type: 'SQUARE',
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
      calibration: VALID.calibration,
    });
    expect(normalized.visual).toEqual(DEFAULT_GRID_VISUAL);
  });
});

describe('resolveGridVisual', () => {
  it('applies defaults for missing visual fields', () => {
    expect(resolveGridVisual({ gridLineColor: '#00FFFF' })).toEqual({
      ...DEFAULT_GRID_VISUAL,
      gridLineColor: '#00FFFF',
    });
  });
});

describe('grid config <-> editable round trip', () => {
  it('projects a GridConfig to editable and back', () => {
    const grid: GridConfig = { ...VALID };
    const editable = editableFromGridConfig(grid);
    expect(editable).toEqual(VALID);
    expect(gridConfigFromEditable(editable)).toEqual(grid);
  });
});

describe('visual validation', () => {
  it('accepts #FFFFFF', () => {
    expect(isValidGridLineColor('#FFFFFF')).toBe(true);
  });

  it('rejects invalid colors', () => {
    expect(isValidGridLineColor('white')).toBe(false);
    expect(isValidGridLineColor('#FFFFF')).toBe(false);
  });
});

describe('validateGridConfig', () => {
  it('accepts a well-formed config', () => {
    expect(validateGridConfig(VALID)).toEqual({});
    expect(isGridConfigValid(VALID)).toBe(true);
  });

  it('rejects non-positive SIMPLE cell and world sizes', () => {
    const config: EditableGridConfig = {
      ...VALID,
      cellWorldSize: 0,
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 10, imageY: 20 },
        cellWidthPx: 0,
        cellHeightPx: -5,
        rotationDeg: 0,
      },
    };
    const errors = validateGridConfig(config);
    expect(errors.cellWidthPx).toBe('POSITIVE_REQUIRED');
    expect(errors.cellHeightPx).toBe('POSITIVE_REQUIRED');
    expect(errors.cellWorldSize).toBe('POSITIVE_REQUIRED');
  });

  it('rejects invalid visual settings', () => {
    const errors = validateGridConfig({
      ...VALID,
      visual: { gridLineColor: 'cyan', gridLineOpacity: 2, gridLineWidthPx: 11 },
    });
    expect(errors.gridLineColor).toBe('COLOR_REQUIRED');
    expect(errors.gridLineOpacity).toBe('OPACITY_RANGE');
    expect(errors.gridLineWidthPx).toBe('WIDTH_RANGE');
  });

  it('rejects invalid BOUNDS rows and columns', () => {
    const errors = validateGridConfig({
      ...VALID,
      calibration: {
        mode: 'BOUNDS',
        topLeft: { imageX: 0, imageY: 0 },
        bottomRight: { imageX: 100, imageY: 100 },
        columns: 0,
        rows: 1.5,
      },
    });
    expect(errors.columns).toBe('INTEGER_REQUIRED');
    expect(errors.rows).toBe('INTEGER_REQUIRED');
  });
});
