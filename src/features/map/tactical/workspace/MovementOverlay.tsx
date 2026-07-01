/**
 * In-world movement preview, rendered as a child of {@link MapViewport} (image space).
 * Shows the reachable cells for the active combatant, and — while dragging — the
 * route to the hovered cell plus the final destination marker. Non-interactive
 * (pointer-events: none) so it never intercepts token/cell clicks. Colour keys the
 * mover: character (gold) vs monster (ember), so the GM reads monster moves at a glance.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { gridToImagePoint } from '../../engine';
import type { GridConfig } from '../../types';
import { useMapViewportContext } from '../../components/MapViewportContext';
import { cellKey, type Cell } from './movement';
import s from './workspace.module.css';

interface MovementOverlayProps {
  grid: GridConfig;
  origin: Cell;
  reachable: Cell[];
  /** The cell currently under the dragged token (route target), if any. */
  target: Cell | null;
  /** Shortest path origin → target, inclusive, when a target is set. */
  path: Cell[];
  kind: 'CHARACTER' | 'MONSTER';
}

function cellPolygon(grid: GridConfig, x: number, y: number): string {
  return [
    gridToImagePoint(x, y, grid),
    gridToImagePoint(x + 1, y, grid),
    gridToImagePoint(x + 1, y + 1, grid),
    gridToImagePoint(x, y + 1, grid),
  ]
    .map((p) => `${p.imageX},${p.imageY}`)
    .join(' ');
}

function cellCenter(grid: GridConfig, x: number, y: number) {
  return gridToImagePoint(x + 0.5, y + 0.5, grid);
}

export function MovementOverlay({ grid, origin, reachable, target, path, kind }: MovementOverlayProps) {
  const { imageSize } = useMapViewportContext();

  const originKey = cellKey(origin.gridX, origin.gridY);
  const toneClass = kind === 'MONSTER' ? s.moveMonster : s.moveCharacter;

  const pathLine = useMemo(() => {
    if (path.length < 2) return '';
    return path.map((c) => {
      const p = cellCenter(grid, c.gridX, c.gridY);
      return `${p.imageX},${p.imageY}`;
    }).join(' ');
  }, [path, grid]);

  if (!imageSize) return null;

  return (
    <svg
      className={cn(s.moveOverlay, toneClass)}
      width={imageSize.width}
      height={imageSize.height}
      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      aria-hidden="true"
    >
      {reachable.map((c) =>
        cellKey(c.gridX, c.gridY) === originKey ? null : (
          <polygon
            key={`r-${c.gridX}-${c.gridY}`}
            className={s.moveCell}
            points={cellPolygon(grid, c.gridX, c.gridY)}
          />
        ),
      )}

      {pathLine && <polyline className={s.movePath} fill="none" points={pathLine} />}

      {target && (
        <polygon className={s.moveTarget} points={cellPolygon(grid, target.gridX, target.gridY)} />
      )}
    </svg>
  );
}
