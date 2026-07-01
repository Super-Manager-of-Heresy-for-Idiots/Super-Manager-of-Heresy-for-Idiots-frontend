import type { GridConfig } from '../types';
import type { MapPing } from '../state';
import { gridToImagePoint } from '../engine';
import s from './MapViewport.module.css';

interface MapPingLayerProps {
  grid: GridConfig;
  pings: MapPing[];
}

/** Transient "look here" pings — an expanding ring at the pinged grid cell. */
export function MapPingLayer({ grid, pings }: MapPingLayerProps) {
  return (
    <div className={s.pingLayer}>
      {pings.map((ping) => {
        const point = gridToImagePoint(ping.gridX, ping.gridY, grid);
        return (
          <div key={ping.id} className={s.ping} style={{ left: point.imageX, top: point.imageY }}>
            <span className={s.pingRing} />
          </div>
        );
      })}
    </div>
  );
}
