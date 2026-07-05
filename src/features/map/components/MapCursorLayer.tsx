import { OrdoInterfaceIcon } from '@/components/ordo';
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
            <OrdoInterfaceIcon icon="map-cursor" size={16} />
            <span className={s.cursorLabel}>{cursor.userId.slice(0, 6)}</span>
          </div>
        );
      })}
    </div>
  );
}
