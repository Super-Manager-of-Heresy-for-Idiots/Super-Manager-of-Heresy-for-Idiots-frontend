import type { GridConfig } from '../types';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import { useMapViewportContext } from './MapViewportContext';
import s from './MapTransitionLayer.module.css';

/** Клетка перехода с оформлением: как она читается на карте. */
export interface TransitionMarker {
  gridX: number;
  gridY: number;
  /** enabled — обычный переход, disabled — запертый, picked/target — выбор в редакторе. */
  variant: 'enabled' | 'disabled' | 'picked' | 'target';
  label?: string;
}

const VARIANT_CLASS: Record<TransitionMarker['variant'], string> = {
  enabled: s.cell,
  disabled: s.cellDisabled,
  picked: s.cellPicked,
  target: s.cellTarget,
};

/**
 * Слой ключевых клеток переходов между картами (WORLD_PLAN Этап 5). Рисуется в
 * координатах изображения внутри {@link MapViewport}: мастер видит, где стоит переход,
 * игрок — куда идти. Read-only: клики обрабатывает сам viewport через onEmptyCellClick.
 */
export function MapTransitionLayer({
  grid,
  markers,
}: {
  grid: GridConfig;
  markers: TransitionMarker[];
}) {
  const { imageSize } = useMapViewportContext();
  if (!markers.length || !imageSize) return null;

  return (
    <div className={s.layer} aria-hidden>
      <svg
        className={s.svg}
        width={imageSize.width}
        height={imageSize.height}
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
      >
        {markers.map((marker, i) => {
          const topLeft = gridToImagePoint(marker.gridX, marker.gridY, grid);
          const metrics = getGridCellImageMetrics(marker.gridX, marker.gridY, 1, 1, grid);
          return (
            <g key={`${marker.gridX}:${marker.gridY}:${i}`}>
              <rect
                x={topLeft.imageX}
                y={topLeft.imageY}
                width={metrics.widthPx}
                height={metrics.heightPx}
                rx={3}
                className={VARIANT_CLASS[marker.variant]}
              />
              {marker.label && (
                <text
                  x={topLeft.imageX + metrics.widthPx / 2}
                  y={topLeft.imageY - 4}
                  textAnchor="middle"
                  className={s.label}
                >
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
