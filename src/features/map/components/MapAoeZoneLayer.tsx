import type { GridConfig, MapElementDto } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import { useMapViewportContext } from './MapViewportContext';
import s from './MapViewport.module.css';

const FEET_PER_CELL = 5;

/**
 * Spell zones / AoE templates on the board (Phase 2.3): session-scoped map elements created by a
 * cast (Web etc.). Rendered between terrain and tokens as translucent shapes with the spell's label.
 * Coverage matches the server's AoeGeometry: Chebyshev radius shapes draw their true covered SQUARE
 * (honest UI over a pretty circle), cones a 90-degree wedge, lines a one-cell strip.
 */
export function MapAoeZoneLayer({ grid, zones }: { grid: GridConfig; zones: MapElementDto[] }) {
  const { imageSize } = useMapViewportContext();
  if (!zones.length || !imageSize) return null;

  return (
    <div className={s.aoeLayer} aria-hidden>
      <svg
        className={s.fogSvg}
        width={imageSize.width}
        height={imageSize.height}
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      >
        {zones.map((z) => (
          <ZoneShape key={z.id} zone={z} grid={grid} />
        ))}
      </svg>
    </div>
  );
}

function ZoneShape({ zone, grid }: { zone: MapElementDto; grid: GridConfig }) {
  const props = (zone.properties ?? {}) as Record<string, unknown>;
  const sizeFt = typeof props.sizeFt === 'number' ? props.sizeFt : 0;
  const rotationDeg = typeof props.rotationDeg === 'number' ? props.rotationDeg : 0;
  const label = typeof props.label === 'string' ? props.label : '';
  // The cast panel's aiming preview renders dashed, committed zones solid.
  const shapeClass = props.preview === true ? s.aoePreviewShape : s.aoeShape;
  const ox = Math.floor(zone.gridX ?? 0);
  const oy = Math.floor(zone.gridY ?? 0);
  const cells = Math.max(0, Math.floor(sizeFt / FEET_PER_CELL));
  const center = gridToImagePoint(ox + 0.5, oy + 0.5, grid);
  const cellPx = getGridCellImageMetrics(ox, oy, 1, 1, grid).widthPx;

  let shape: JSX.Element | null = null;
  switch (zone.elementType) {
    case 'SPHERE':
    case 'CYLINDER':
    case 'AURA':
    case 'CUBE': {
      // Chebyshev coverage: a (2h+1)-cell square around the origin (h = radius or half-edge).
      const h = zone.elementType === 'CUBE' ? Math.floor(cells / 2) : cells;
      const topLeft = gridToImagePoint(ox - h, oy - h, grid);
      const metrics = getGridCellImageMetrics(ox - h, oy - h, 2 * h + 1, 2 * h + 1, grid);
      shape = (
        <rect
          x={topLeft.imageX}
          y={topLeft.imageY}
          width={metrics.widthPx}
          height={metrics.heightPx}
          className={shapeClass}
        />
      );
      break;
    }
    case 'CONE': {
      const len = cells * cellPx;
      const p = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return `${center.imageX + len * Math.cos(rad)},${center.imageY + len * Math.sin(rad)}`;
      };
      shape = (
        <polygon
          points={`${center.imageX},${center.imageY} ${p(rotationDeg - 45)} ${p(rotationDeg + 45)}`}
          className={shapeClass}
        />
      );
      break;
    }
    case 'LINE': {
      const len = cells * cellPx;
      const rad = (rotationDeg * Math.PI) / 180;
      const ux = Math.cos(rad);
      const uy = Math.sin(rad);
      const hw = cellPx / 2; // one cell wide
      const pts = [
        [center.imageX - uy * hw, center.imageY + ux * hw],
        [center.imageX + uy * hw, center.imageY - ux * hw],
        [center.imageX + ux * len + uy * hw, center.imageY + uy * len - ux * hw],
        [center.imageX + ux * len - uy * hw, center.imageY + uy * len + ux * hw],
      ];
      shape = <polygon points={pts.map((pt) => pt.join(',')).join(' ')} className={shapeClass} />;
      break;
    }
    default:
      return null;
  }

  return (
    <g>
      {shape}
      {label && (
        <text x={center.imageX} y={center.imageY} className={s.aoeLabel} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

