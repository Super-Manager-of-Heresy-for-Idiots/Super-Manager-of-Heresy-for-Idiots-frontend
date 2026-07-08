import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { FogShapeDto, FogStateDto, GridConfig } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import { useMapViewportContext } from './MapViewportContext';
import s from './MapViewport.module.css';

/**
 * Manual fog-of-war layer (Phase 1.6). Draws a dark cover over the whole map with the revealed
 * shapes cut out via an SVG mask. Painted over the tokens but under cursors/pings (DOM order in
 * {@link MapViewport}). Read-only — the GM authors fog through the map-session fog API; this layer
 * only renders committed state. Players see opaque fog; the GM sees it translucent so they can work.
 *
 * `fog === null` means the GM has not engaged fog for this session → nothing is drawn. An empty
 * `revealed` list means deliberately fogged everywhere (e.g. after hide-all).
 */
export function MapFogLayer({
  grid,
  fog,
  isGm,
}: {
  grid: GridConfig;
  fog: FogStateDto | null;
  isGm: boolean;
}) {
  const { imageSize } = useMapViewportContext();
  const maskId = useId();
  if (!fog || !imageSize) return null;

  const width = imageSize.width;
  const height = imageSize.height;

  return (
    <div className={s.fogLayer} aria-hidden>
      <svg className={s.fogSvg} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <mask id={maskId}>
            {/* White = fogged; black holes = revealed areas punched out of the cover. */}
            <rect x={0} y={0} width={width} height={height} fill="white" />
            {fog.revealed.map((shape, i) => (
              <FogHole key={i} shape={shape} grid={grid} />
            ))}
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          className={cn(s.fogFill, isGm && s.fogFillGm)}
          mask={`url(#${maskId})`}
        />
      </svg>
    </div>
  );
}

/** One revealed shape rendered as a black hole in the fog mask. */
function FogHole({ shape, grid }: { shape: FogShapeDto; grid: GridConfig }) {
  if (shape.type === 'POLYGON') {
    if (!shape.points || shape.points.length < 3) return null;
    const points = shape.points
      .map((p) => {
        const pt = gridToImagePoint(p.x, p.y, grid);
        return `${pt.imageX},${pt.imageY}`;
      })
      .join(' ');
    return <polygon points={points} fill="black" />;
  }
  if (shape.x == null || shape.y == null || shape.width == null || shape.height == null) return null;
  const topLeft = gridToImagePoint(shape.x, shape.y, grid);
  const metrics = getGridCellImageMetrics(shape.x, shape.y, shape.width, shape.height, grid);
  return (
    <rect
      x={topLeft.imageX}
      y={topLeft.imageY}
      width={metrics.widthPx}
      height={metrics.heightPx}
      fill="black"
    />
  );
}
