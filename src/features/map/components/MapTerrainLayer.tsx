import { cn } from '@/lib/utils';
import type { GridConfig, MapTileStateDto } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import s from './MapViewport.module.css';

const LEVEL_CLASS: Record<number, string | undefined> = {
  1: s.terrainL1,
  2: s.terrainL2,
};

/**
 * Terrain layer (Phase 1.9 / 2.11). Paints the snapshot's non-default `tileStates` between the
 * background/grid and the tokens: high-ground levels 1/2 feed the low→high reach rule, and difficult
 * cells (Phase 2.11) that double movement cost are hatched. The snapshot is the source of truth.
 */
export function MapTerrainLayer({ grid, tiles }: { grid: GridConfig; tiles: MapTileStateDto[] }) {
  if (!tiles.length) return null;
  return (
    <div className={s.terrainLayer} aria-hidden>
      {tiles.map((tile) => {
        if (!tile.terrainLevel && !tile.difficult) return null; // normal ground → nothing to draw
        const point = gridToImagePoint(tile.gridX, tile.gridY, grid);
        const metrics = getGridCellImageMetrics(tile.gridX, tile.gridY, 1, 1, grid);
        return (
          <div
            key={tile.id}
            className={cn(
              s.terrainCell,
              tile.terrainLevel ? LEVEL_CLASS[tile.terrainLevel] : undefined,
              tile.difficult && s.terrainDifficult,
            )}
            style={{
              left: point.imageX,
              top: point.imageY,
              width: metrics.widthPx,
              height: metrics.heightPx,
            }}
            title={tile.terrainName}
          >
            {tile.terrainLevel ? <span className={s.terrainBadge}>▲{tile.terrainLevel}</span> : null}
            {tile.difficult ? <span className={s.terrainBadge}>≈</span> : null}
          </div>
        );
      })}
    </div>
  );
}
