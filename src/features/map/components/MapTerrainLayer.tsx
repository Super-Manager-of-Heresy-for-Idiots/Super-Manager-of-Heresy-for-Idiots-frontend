import { cn } from '@/lib/utils';
import type { GridConfig, MapTileStateDto } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import s from './MapViewport.module.css';

const LEVEL_CLASS: Record<number, string | undefined> = {
  1: s.terrainL1,
  2: s.terrainL2,
};

/**
 * Terrain layer (Phase 1.9). Paints the snapshot's non-default `tileStates` (high-ground levels
 * 1/2) as translucent cells between the background/grid and the tokens. Static in MVP — the
 * snapshot is the source of truth; movement cost stays out of scope (that is Phase 2.11), but the
 * levels feed the low→high reach rule via the elevation hook in the tactical panel.
 */
export function MapTerrainLayer({ grid, tiles }: { grid: GridConfig; tiles: MapTileStateDto[] }) {
  if (!tiles.length) return null;
  return (
    <div className={s.terrainLayer} aria-hidden>
      {tiles.map((tile) => {
        if (!tile.terrainLevel) return null; // level 0 = normal ground → nothing to draw
        const point = gridToImagePoint(tile.gridX, tile.gridY, grid);
        const metrics = getGridCellImageMetrics(tile.gridX, tile.gridY, 1, 1, grid);
        return (
          <div
            key={tile.id}
            className={cn(s.terrainCell, LEVEL_CLASS[tile.terrainLevel])}
            style={{
              left: point.imageX,
              top: point.imageY,
              width: metrics.widthPx,
              height: metrics.heightPx,
            }}
            title={tile.terrainName}
          >
            <span className={s.terrainBadge}>▲{tile.terrainLevel}</span>
          </div>
        );
      })}
    </div>
  );
}
