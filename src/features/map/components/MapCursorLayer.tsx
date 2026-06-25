import { MousePointer2 } from 'lucide-react';
import type { GridConfig } from '../types';
import type { RemoteCursor } from '../state';
import { gridToImagePoint } from '../engine';
import s from './MapViewport.module.css';

interface MapCursorLayerProps {
  grid: GridConfig;
  cursors: RemoteCursor[];
}

/** Remote collaborators' cursors, positioned by their last reported grid cell. */
export function MapCursorLayer({ grid, cursors }: MapCursorLayerProps) {
  return (
    <div className={s.cursorLayer}>
      {cursors.map((cursor) => {
        const point = gridToImagePoint(cursor.gridX, cursor.gridY, grid);
        return (
          <div key={cursor.userId} className={s.cursor} style={{ left: point.imageX, top: point.imageY }}>
            <MousePointer2 size={16} aria-hidden="true" />
            <span className={s.cursorLabel}>{cursor.userId.slice(0, 6)}</span>
          </div>
        );
      })}
    </div>
  );
}
