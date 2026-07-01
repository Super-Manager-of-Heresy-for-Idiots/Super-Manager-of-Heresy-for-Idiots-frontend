import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import type { CellWorldUnit, GridCalibration, ImagePoint } from '../types';
import type {
  CalibrationClickTarget,
  EditableGridConfig,
  GridConfigErrorCode,
  GridConfigErrors,
} from './calibrationTypes';
import { DEFAULT_GRID_VISUAL, validateGridConfig } from './calibrationMath';
import s from './calibration.module.css';

export interface GridCalibrationLabels {
  title: string;
  save: string;
  saving: string;
  reset: string;
  backgroundWarning: string;
  errorPositive: string;
  errorFinite: string;
}

export interface GridCalibrationPanelProps {
  value: EditableGridConfig;
  errors?: GridConfigErrors;
  isSaving?: boolean;
  isDirty?: boolean;
  canSave?: boolean;
  activeClickTarget?: CalibrationClickTarget | null;
  onChange: (next: EditableGridConfig) => void;
  onSave: () => void;
  onReset: () => void;
  onStartPointCapture?: (target: CalibrationClickTarget) => void;
  labels?: GridCalibrationLabels;
}

const DEFAULT_LABELS: GridCalibrationLabels = {
  title: 'Grid calibration',
  save: 'Save grid',
  saving: 'Saving...',
  reset: 'Reset',
  backgroundWarning: 'Characters move on the system grid. The image is only a visual background.',
  errorPositive: 'Must be greater than 0',
  errorFinite: 'Must be a number',
};

const PRESETS = [
  ['White', '#FFFFFF', 'swatchWhite'],
  ['Black', '#000000', 'swatchBlack'],
  ['Yellow', '#FFFF00', 'swatchYellow'],
  ['Cyan', '#00FFFF', 'swatchCyan'],
  ['Red', '#FF0000', 'swatchRed'],
  ['Green', '#00FF00', 'swatchGreen'],
] as const;

const CLICK_LABELS: Record<CalibrationClickTarget, string> = {
  BOUNDS_TOP_LEFT: 'Click top-left grid intersection',
  BOUNDS_BOTTOM_RIGHT: 'Click bottom-right grid intersection',
  FOUR_TOP_LEFT: 'Click top-left grid corner',
  FOUR_TOP_RIGHT: 'Click top-right grid corner',
  FOUR_BOTTOM_RIGHT: 'Click bottom-right grid corner',
  FOUR_BOTTOM_LEFT: 'Click bottom-left grid corner',
};

function pointLabel(point: ImagePoint): string {
  return `${Math.round(point.imageX)}, ${Math.round(point.imageY)}`;
}

function simpleCalibration(): GridCalibration {
  return {
    mode: 'SIMPLE',
    origin: { imageX: 0, imageY: 0 },
    cellWidthPx: 64,
    cellHeightPx: 64,
    rotationDeg: 0,
  };
}

function boundsCalibration(): GridCalibration {
  return {
    mode: 'BOUNDS',
    topLeft: { imageX: 0, imageY: 0 },
    bottomRight: { imageX: 640, imageY: 640 },
    columns: 10,
    rows: 10,
  };
}

function fourCornerCalibration(): GridCalibration {
  return {
    mode: 'FOUR_CORNER',
    columns: 10,
    rows: 10,
    corners: {
      topLeft: { imageX: 0, imageY: 0 },
      topRight: { imageX: 640, imageY: 0 },
      bottomRight: { imageX: 640, imageY: 640 },
      bottomLeft: { imageX: 0, imageY: 640 },
    },
  };
}

export function GridCalibrationPanel({
  value,
  errors,
  isSaving = false,
  isDirty = false,
  canSave = true,
  activeClickTarget = null,
  onChange,
  onSave,
  onReset,
  onStartPointCapture,
  labels = DEFAULT_LABELS,
}: GridCalibrationPanelProps) {
  const fieldErrors = useMemo<GridConfigErrors>(
    () => ({ ...validateGridConfig(value), ...errors }),
    [value, errors],
  );
  const hasErrors = Object.keys(fieldErrors).length > 0;

  const patch = (next: Partial<EditableGridConfig>) => onChange({ ...value, ...next });
  const patchCalibration = (calibration: GridCalibration) => patch({ calibration });

  const errorText = (code: GridConfigErrorCode | undefined): string | null => {
    if (code === 'POSITIVE_REQUIRED') return labels.errorPositive;
    if (code === 'FINITE_REQUIRED') return labels.errorFinite;
    if (code === 'COLOR_REQUIRED') return 'Use #RRGGBB';
    if (code === 'OPACITY_RANGE') return 'Use 0 to 1';
    if (code === 'WIDTH_RANGE') return 'Use 0.1 to 10';
    if (code === 'INTEGER_REQUIRED') return 'Use a whole number greater than 0';
    return null;
  };

  const onWorldUnit = (e: ChangeEvent<HTMLSelectElement>) =>
    patch({ cellWorldUnit: e.target.value as CellWorldUnit });

  const visual = value.visual ?? DEFAULT_GRID_VISUAL;
  const patchVisual = (next: Partial<typeof visual>) =>
    patch({ visual: { ...visual, ...next } });

  const calibration = value.calibration;
  const mode = calibration.mode;

  return (
    <section className={cn('ao-panel', s.panel)} aria-label={labels.title}>
      <h2 className={s.title}>{labels.title}</h2>
      <p className={s.warning}>{labels.backgroundWarning}</p>

      <div className={s.flow}>
        <p className={s.prompt}>Does this map image already have a visible grid?</p>
        <div className={s.segmented}>
          <button
            type="button"
            className={cn(s.segmentButton, mode !== 'SIMPLE' && s.segmentActive)}
            onClick={() => patchCalibration(boundsCalibration())}
          >
            Yes
          </button>
          <button
            type="button"
            className={cn(s.segmentButton, mode === 'SIMPLE' && s.segmentActive)}
            onClick={() => patchCalibration(simpleCalibration())}
          >
            No
          </button>
        </div>

        {mode !== 'SIMPLE' && (
          <div className={s.choiceGrid}>
            <button
              type="button"
              className={cn(s.choice, mode === 'BOUNDS' && s.choiceActive)}
              onClick={() => patchCalibration(boundsCalibration())}
            >
              <strong>Quick calibration</strong>
              <span>Two intersections plus columns and rows.</span>
            </button>
            <button
              type="button"
              className={cn(s.choice, mode === 'FOUR_CORNER' && s.choiceActive)}
              onClick={() => patchCalibration(fourCornerCalibration())}
            >
              <strong>Accurate calibration</strong>
              <span>Four corners for skewed or drifting maps.</span>
            </button>
          </div>
        )}
      </div>

      {mode === 'BOUNDS' && (
        <div className={s.modePanel}>
          <CaptureButton
            target="BOUNDS_TOP_LEFT"
            activeClickTarget={activeClickTarget}
            value={calibration.topLeft}
            onStartPointCapture={onStartPointCapture}
          />
          <CaptureButton
            target="BOUNDS_BOTTOM_RIGHT"
            activeClickTarget={activeClickTarget}
            value={calibration.bottomRight}
            onStartPointCapture={onStartPointCapture}
          />
          <RowsColumns
            columns={calibration.columns}
            rows={calibration.rows}
            onColumns={(columns) => patchCalibration({ ...calibration, columns })}
            onRows={(rows) => patchCalibration({ ...calibration, rows })}
            columnsError={errorText(fieldErrors.columns)}
            rowsError={errorText(fieldErrors.rows)}
          />
        </div>
      )}

      {mode === 'FOUR_CORNER' && (
        <div className={s.modePanel}>
          <CaptureButton
            target="FOUR_TOP_LEFT"
            activeClickTarget={activeClickTarget}
            value={calibration.corners.topLeft}
            onStartPointCapture={onStartPointCapture}
          />
          <CaptureButton
            target="FOUR_TOP_RIGHT"
            activeClickTarget={activeClickTarget}
            value={calibration.corners.topRight}
            onStartPointCapture={onStartPointCapture}
          />
          <CaptureButton
            target="FOUR_BOTTOM_RIGHT"
            activeClickTarget={activeClickTarget}
            value={calibration.corners.bottomRight}
            onStartPointCapture={onStartPointCapture}
          />
          <CaptureButton
            target="FOUR_BOTTOM_LEFT"
            activeClickTarget={activeClickTarget}
            value={calibration.corners.bottomLeft}
            onStartPointCapture={onStartPointCapture}
          />
          <RowsColumns
            columns={calibration.columns}
            rows={calibration.rows}
            onColumns={(columns) => patchCalibration({ ...calibration, columns })}
            onRows={(rows) => patchCalibration({ ...calibration, rows })}
            columnsError={errorText(fieldErrors.columns)}
            rowsError={errorText(fieldErrors.rows)}
          />
        </div>
      )}

      {(mode === 'THREE_POINT' || mode === 'PIECEWISE') && (
        <div className={s.comingSoon}>Local correction points - coming later</div>
      )}

      {mode === 'SIMPLE' && (
        <details className={s.advanced} open>
          <summary>No visible grid: simple setup</summary>
          <div className={s.grid2}>
            <NumberField
              id="grid-origin-x"
              label="Origin X"
              value={calibration.origin.imageX}
              onChange={(imageX) =>
                patchCalibration({ ...calibration, origin: { ...calibration.origin, imageX } })
              }
            />
            <NumberField
              id="grid-origin-y"
              label="Origin Y"
              value={calibration.origin.imageY}
              onChange={(imageY) =>
                patchCalibration({ ...calibration, origin: { ...calibration.origin, imageY } })
              }
            />
            <NumberField
              id="grid-cell-w"
              label="Cell width"
              value={calibration.cellWidthPx}
              error={errorText(fieldErrors.cellWidthPx)}
              onChange={(cellWidthPx) => patchCalibration({ ...calibration, cellWidthPx })}
            />
            <NumberField
              id="grid-cell-h"
              label="Cell height"
              value={calibration.cellHeightPx}
              error={errorText(fieldErrors.cellHeightPx)}
              onChange={(cellHeightPx) => patchCalibration({ ...calibration, cellHeightPx })}
            />
            <NumberField
              id="grid-rotation"
              label="Rotation"
              value={calibration.rotationDeg}
              error={errorText(fieldErrors.rotationDeg)}
              onChange={(rotationDeg) => patchCalibration({ ...calibration, rotationDeg })}
            />
          </div>
        </details>
      )}

      <section className={s.visualPanel} aria-label="System grid appearance">
        <h3 className={s.subhead}>System grid appearance</h3>
        <div className={s.colorRow}>
          <label className="ao-label" htmlFor="grid-color">
            Choose system grid color
          </label>
          <input
            id="grid-color"
            type="color"
            className={s.colorInput}
            value={visual.gridLineColor}
            onChange={(e) => patchVisual({ gridLineColor: e.target.value.toUpperCase() })}
          />
        </div>
        <div className={s.presetRow}>
          {PRESETS.map(([label, color, className]) => (
            <button
              key={color}
              type="button"
              className={cn(s.swatchButton, s[className])}
              aria-label={label}
              title={label}
              onClick={() => patchVisual({ gridLineColor: color })}
            />
          ))}
        </div>
        {errorText(fieldErrors.gridLineColor) && <span className={s.error}>{errorText(fieldErrors.gridLineColor)}</span>}

        <NumberField
          id="grid-opacity"
          label="Grid opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={visual.gridLineOpacity}
          error={errorText(fieldErrors.gridLineOpacity)}
          onChange={(gridLineOpacity) => patchVisual({ gridLineOpacity })}
        />
        <NumberField
          id="grid-width"
          label="Grid line width"
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={visual.gridLineWidthPx}
          error={errorText(fieldErrors.gridLineWidthPx)}
          onChange={(gridLineWidthPx) => patchVisual({ gridLineWidthPx })}
        />
      </section>

      <div className={s.grid2}>
        <NumberField
          id="grid-world-size"
          label="Cell world size"
          value={value.cellWorldSize}
          step={0.5}
          error={errorText(fieldErrors.cellWorldSize)}
          onChange={(cellWorldSize) => patch({ cellWorldSize })}
        />
        <div className={cn('ao-field', s.field)}>
          <label className="ao-label" htmlFor="grid-world-unit">
            Unit
          </label>
          <select id="grid-world-unit" className="ao-input" value={value.cellWorldUnit} onChange={onWorldUnit}>
            <option value="ft">Feet</option>
            <option value="m">Meters</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className="ao-btn ao-btn--primary"
          onClick={onSave}
          disabled={isSaving || hasErrors || !canSave}
        >
          {isSaving ? labels.saving : labels.save}
        </button>
        <button
          type="button"
          className="ao-btn ao-btn--ghost"
          onClick={onReset}
          disabled={isSaving || !isDirty}
        >
          {labels.reset}
        </button>
      </div>
    </section>
  );
}

function CaptureButton({
  target,
  value,
  activeClickTarget,
  onStartPointCapture,
}: {
  target: CalibrationClickTarget;
  value: ImagePoint;
  activeClickTarget: CalibrationClickTarget | null;
  onStartPointCapture?: (target: CalibrationClickTarget) => void;
}) {
  return (
    <button
      type="button"
      className={cn(s.captureButton, activeClickTarget === target && s.captureActive)}
      onClick={() => onStartPointCapture?.(target)}
    >
      <span>{CLICK_LABELS[target]}</span>
      <strong>{pointLabel(value)}</strong>
    </button>
  );
}

function RowsColumns({
  columns,
  rows,
  onColumns,
  onRows,
  columnsError,
  rowsError,
}: {
  columns: number;
  rows: number;
  onColumns: (columns: number) => void;
  onRows: (rows: number) => void;
  columnsError: string | null;
  rowsError: string | null;
}) {
  return (
    <div className={s.grid2}>
      <NumberField
        id="grid-columns"
        label="How many columns are between these borders?"
        value={columns}
        min={1}
        step={1}
        error={columnsError}
        onChange={onColumns}
      />
      <NumberField
        id="grid-rows"
        label="How many rows are between these borders?"
        value={rows}
        min={1}
        step={1}
        error={rowsError}
        onChange={onRows}
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
  type = 'number',
  min,
  max,
  step = 1,
}: {
  id: string;
  label: string;
  value: number;
  error?: string | null;
  onChange: (value: number) => void;
  type?: 'number' | 'range';
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className={cn('ao-field', s.field)}>
      <label className="ao-label" htmlFor={id}>
        {label}
      </label>
      <div className={type === 'range' ? s.rangeLine : undefined}>
        <input
          id={id}
          type={type}
          inputMode="decimal"
          className="ao-input"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          aria-invalid={error ? true : undefined}
        />
        {type === 'range' && <span className={s.rangeValue}>{value}</span>}
      </div>
      {error && (
        <span className={s.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
