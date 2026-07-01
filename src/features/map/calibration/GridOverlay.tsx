/**
 * Draggable grid-origin handle, rendered inside a {@link MapViewport}'s world so it
 * sits in IMAGE coordinates at `(originX, originY)`. The visual is counter-scaled by
 * `1/scale` to keep a constant on-screen size at any zoom. Dragging converts the
 * screen-pixel delta back to image space (`delta / scale`) and reports a new origin;
 * the parent owns the {@link EditableGridConfig} and re-renders the grid. Pointer
 * events are stopped so a drag never starts a viewport pan.
 */

import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { GridConfig } from '../types';
import { useMapViewportContext } from '../components/MapViewportContext';
import s from './calibration.module.css';

interface GridOverlayProps {
  grid: GridConfig;
  onOriginChange: (originX: number, originY: number) => void;
  label?: string;
}

interface DragState {
  pointerId: number;
  clientX: number;
  clientY: number;
  originX: number;
  originY: number;
}

export function GridOverlay({ grid, onOriginChange, label = 'Grid origin' }: GridOverlayProps) {
  const { viewport } = useMapViewportContext();
  const scale = viewport.scale;
  const drag = useRef<DragState | null>(null);
  const calibration = grid.calibration.mode === 'SIMPLE' ? grid.calibration : null;

  if (!calibration) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // don't let the viewport start a pan
    e.preventDefault();
    drag.current = {
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      originX: calibration.origin.imageX,
      originY: calibration.origin.imageY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    e.stopPropagation();
    const dx = (e.clientX - d.clientX) / scale;
    const dy = (e.clientY - d.clientY) / scale;
    onOriginChange(d.originX + dx, d.originY + dy);
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  // Keyboard nudging for accessibility (arrows = 1px, +Shift = 10px in image space).
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    onOriginChange(calibration.origin.imageX + dx, calibration.origin.imageY + dy);
  };

  return (
    <button
      type="button"
      className={s.originHandle}
      style={{
        left: calibration.origin.imageX,
        top: calibration.origin.imageY,
        transform: `translate(-50%, -50%) scale(${1 / scale})`,
      }}
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    />
  );
}
