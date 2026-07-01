import type { GridConfig, ImagePoint } from '../types';
import type { ImageSize } from '../hooks/useMapViewport';
import { resolveGridVisual } from '../calibration';
import { getCalibrationDimensions, gridToImagePoint, imagePointToGrid } from '../engine';
import s from './MapViewport.module.css';

interface MapGridLayerProps {
  grid: GridConfig;
  imageSize: ImageSize | null;
}

interface GridLine {
  key: string;
  points: ImagePoint[];
}

function pathFromPoints(points: ImagePoint[]): string {
  return points.map((point) => `${point.imageX},${point.imageY}`).join(' ');
}

function simpleLineRange(grid: GridConfig, imageSize: ImageSize) {
  const corners = [
    { imageX: 0, imageY: 0 },
    { imageX: imageSize.width, imageY: 0 },
    { imageX: imageSize.width, imageY: imageSize.height },
    { imageX: 0, imageY: imageSize.height },
  ].map((corner) => imagePointToGrid(corner, grid));
  const xs = corners.map((corner) => corner.gridX);
  const ys = corners.map((corner) => corner.gridY);
  return {
    minX: Math.floor(Math.min(...xs)) - 1,
    maxX: Math.ceil(Math.max(...xs)) + 1,
    minY: Math.floor(Math.min(...ys)) - 1,
    maxY: Math.ceil(Math.max(...ys)) + 1,
  };
}

function buildLines(grid: GridConfig, imageSize: ImageSize): GridLine[] {
  const dimensions = getCalibrationDimensions(grid.calibration);
  const lines: GridLine[] = [];

  if (dimensions) {
    const verticalStep = Math.max(1, Math.ceil(dimensions.rows / 80));
    const horizontalStep = Math.max(1, Math.ceil(dimensions.columns / 80));
    for (let x = 0; x <= dimensions.columns; x += 1) {
      const points: ImagePoint[] = [];
      for (let y = 0; y <= dimensions.rows; y += verticalStep) {
        points.push(gridToImagePoint(x, y, grid));
      }
      const last = gridToImagePoint(x, dimensions.rows, grid);
      if (points[points.length - 1]?.imageY !== last.imageY) {
        points.push(last);
      }
      lines.push({ key: `v-${x}`, points });
    }
    for (let y = 0; y <= dimensions.rows; y += 1) {
      const points: ImagePoint[] = [];
      for (let x = 0; x <= dimensions.columns; x += horizontalStep) {
        points.push(gridToImagePoint(x, y, grid));
      }
      const last = gridToImagePoint(dimensions.columns, y, grid);
      if (points[points.length - 1]?.imageX !== last.imageX) {
        points.push(last);
      }
      lines.push({ key: `h-${y}`, points });
    }
    return lines;
  }

  const range = simpleLineRange(grid, imageSize);
  for (let x = range.minX; x <= range.maxX; x += 1) {
    lines.push({
      key: `v-${x}`,
      points: [gridToImagePoint(x, range.minY, grid), gridToImagePoint(x, range.maxY, grid)],
    });
  }
  for (let y = range.minY; y <= range.maxY; y += 1) {
    lines.push({
      key: `h-${y}`,
      points: [gridToImagePoint(range.minX, y, grid), gridToImagePoint(range.maxX, y, grid)],
    });
  }
  return lines;
}

export function MapGridLayer({ grid, imageSize }: MapGridLayerProps) {
  if (!imageSize) return null;
  const { width, height } = imageSize;
  const visual = resolveGridVisual(grid.visual);
  const lines = buildLines(grid, imageSize);

  return (
    <svg
      className={s.gridSvg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {lines.map((line) => (
        <polyline
          key={line.key}
          className={s.gridLine}
          fill="none"
          points={pathFromPoints(line.points)}
          stroke={visual.gridLineColor}
          strokeOpacity={visual.gridLineOpacity}
          strokeWidth={visual.gridLineWidthPx}
        />
      ))}
    </svg>
  );
}
