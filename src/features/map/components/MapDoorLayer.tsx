import type { GridConfig, MapElementDto } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import { useMapViewportContext } from './MapViewportContext';
import s from './MapViewport.module.css';

/**
 * Interactive doors (Phase 3.3): session-scoped DOOR elements drawn between terrain and tokens.
 * A closed/locked door draws a solid bar over its cell (it blocks passage in the movement flood
 * fill + the server's MovementValidator); an open door draws a thin outline. Secret doors are
 * shown ONLY to the GM — a player sees nothing, so the door reads as an invisible wall until the
 * GM reveals it. Read-only layer: the GM changes door state from the Doors panel.
 */
export function MapDoorLayer({
  grid,
  doors,
  viewerIsGm,
}: {
  grid: GridConfig;
  doors: MapElementDto[];
  viewerIsGm: boolean;
}) {
  const { imageSize } = useMapViewportContext();
  const visible = doors.filter(
    (d) => viewerIsGm || (d.properties as Record<string, unknown>)?.state !== 'SECRET',
  );
  if (!visible.length || !imageSize) return null;

  return (
    <div className={s.aoeLayer} aria-hidden>
      <svg
        className={s.fogSvg}
        width={imageSize.width}
        height={imageSize.height}
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      >
        {visible.map((d) => (
          <DoorShape key={d.id} door={d} grid={grid} />
        ))}
      </svg>
    </div>
  );
}

function DoorShape({ door, grid }: { door: MapElementDto; grid: GridConfig }) {
  const props = (door.properties ?? {}) as Record<string, unknown>;
  const state = typeof props.state === 'string' ? props.state : 'CLOSED';
  const w = Math.max(1, Math.round(Number(props.widthCells ?? 1)));
  const h = Math.max(1, Math.round(Number(props.heightCells ?? 1)));
  const ox = Math.floor(door.gridX ?? 0);
  const oy = Math.floor(door.gridY ?? 0);
  const topLeft = gridToImagePoint(ox, oy, grid);
  const metrics = getGridCellImageMetrics(ox, oy, w, h, grid);
  const cls =
    state === 'OPEN'
      ? s.doorOpen
      : state === 'LOCKED'
        ? s.doorLocked
        : state === 'SECRET'
          ? s.doorSecret
          : s.doorClosed;

  return (
    <rect
      x={topLeft.imageX}
      y={topLeft.imageY}
      width={metrics.widthPx}
      height={metrics.heightPx}
      rx={2}
      className={cls}
    />
  );
}
