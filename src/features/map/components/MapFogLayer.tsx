import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { FogShapeDto, FogStateDto, GridConfig } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import { useMapViewportContext } from './MapViewportContext';
import s from './MapViewport.module.css';

/**
 * Manual fog-of-war layer (Phase 1.6). Draws a cloudy dark cover over the whole map with the
 * revealed shapes cut out via an SVG mask. It reads as actual fog, not a flat panel: a fractal-noise
 * filter gives soft billows/clouds, and the revealed holes are feathered (blurred mask) so the edges
 * drift like wisps rather than being hard rectangles. Static (no animation) to stay cheap.
 *
 * Painted over the tokens but under cursors/pings (DOM order in {@link MapViewport}). Read-only — the
 * GM authors fog through the fog API; this only renders committed state. Players see opaque fog; the
 * GM sees it translucent so they can work.
 *
 * `fog === null` → the GM hasn't engaged fog for this session → nothing drawn. An empty `revealed`
 * list → deliberately fogged everywhere (e.g. after hide-all).
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
  const uid = useId();
  if (!fog || !imageSize) return null;

  const width = imageSize.width;
  const height = imageSize.height;

  // Scale the cloud billows and the feathered reveal edge to the grid so fog reads the same at any
  // map resolution: billows a few cells wide, edges softened by roughly a third of a cell.
  const cellPx = Math.max(8, getGridCellImageMetrics(0, 0, 1, 1, grid).widthPx);
  const cloudFreq = 1 / (cellPx * 3);
  const feather = cellPx * 0.35;

  const maskId = `fog-mask-${uid}`;
  const cloudsId = `fog-clouds-${uid}`;
  const featherId = `fog-feather-${uid}`;

  return (
    <div className={s.fogLayer} aria-hidden>
      <svg className={s.fogSvg} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Fractal-noise clouds: turbulence → dark, semi-transparent billows layered over the base. */}
          <filter id={cloudsId} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={cloudFreq}
              numOctaves={4}
              seed={11}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0.7 0.7 0 -0.45"
            />
          </filter>

          {/* Feather the reveal edges so the fog dissolves into a wispy boundary, not a hard cut. */}
          <filter id={featherId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={feather} />
          </filter>

          <mask id={maskId}>
            {/* White = fogged; the blurred black holes = revealed areas softly punched out. */}
            <rect x={0} y={0} width={width} height={height} fill="white" />
            <g filter={`url(#${featherId})`}>
              {fog.revealed.map((shape, i) => (
                <FogHole key={i} shape={shape} grid={grid} />
              ))}
            </g>
          </mask>
        </defs>

        <g className={cn(s.fogGroup, isGm && s.fogGroupGm)} mask={`url(#${maskId})`}>
          {/* Base darkness + cloud texture on top; both clipped to the fogged area by the mask. */}
          <rect x={0} y={0} width={width} height={height} className={s.fogBase} />
          <rect x={0} y={0} width={width} height={height} className={s.fogClouds} filter={`url(#${cloudsId})`} />
        </g>
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
