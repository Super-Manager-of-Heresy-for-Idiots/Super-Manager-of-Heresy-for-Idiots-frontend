import type { PointerEvent as ReactPointerEvent } from 'react';
import { OrdoInterfaceIcon } from '@/components/ordo';
import { cn } from '@/lib/utils';
import s from './MapViewport.module.css';

export interface MapToolbarLabels {
  zoomIn: string;
  zoomOut: string;
  fit: string;
  reset: string;
  toggleGrid: string;
}

interface MapToolbarProps {
  scale: number;
  showGrid: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onToggleGrid: () => void;
  labels: MapToolbarLabels;
}

/** View-control overlay (zoom / fit / reset / grid toggle). Sits above the world. */
export function MapToolbar({
  scale,
  showGrid,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  onToggleGrid,
  labels,
}: MapToolbarProps) {
  // Swallow pointerdown so toolbar clicks never start a viewport pan.
  const stop = (e: ReactPointerEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className={s.toolbar} onPointerDown={stop}>
      <div className={s.toolbarRow}>
        <button type="button" className="ao-iconbtn" onClick={onZoomIn} aria-label={labels.zoomIn} title={labels.zoomIn}>
          <OrdoInterfaceIcon icon="zoom-in" size={16} />
        </button>
        <button type="button" className="ao-iconbtn" onClick={onZoomOut} aria-label={labels.zoomOut} title={labels.zoomOut}>
          <OrdoInterfaceIcon icon="zoom-out" size={16} />
        </button>
      </div>
      <div className={s.toolbarRow}>
        <button type="button" className="ao-iconbtn" onClick={onFit} aria-label={labels.fit} title={labels.fit}>
          <OrdoInterfaceIcon icon="fit-map" size={16} />
        </button>
        <button type="button" className="ao-iconbtn" onClick={onReset} aria-label={labels.reset} title={labels.reset}>
          <OrdoInterfaceIcon icon="reset-view" size={16} />
        </button>
      </div>
      <div className={s.toolbarRow}>
        <button
          type="button"
          className={cn('ao-iconbtn', showGrid && 'is-active')}
          onClick={onToggleGrid}
          aria-label={labels.toggleGrid}
          aria-pressed={showGrid}
          title={labels.toggleGrid}
        >
          <OrdoInterfaceIcon icon="toggle-grid" size={16} />
        </button>
      </div>
      <div className={s.scaleReadout}>{Math.round(scale * 100)}%</div>
    </div>
  );
}
