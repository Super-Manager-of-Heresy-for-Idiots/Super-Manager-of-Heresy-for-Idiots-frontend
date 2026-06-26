import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { GridConfig, MapTokenDto, UUID } from '../types';
import type { GridCoord } from '../engine';
import { viewportPointToGrid } from '../engine';
import { normalizeGridConfig } from '../calibration/calibrationMath';
import type { MapPing, RemoteCursor, TokenDragPreview } from '../state';
import { useMapViewport } from '../hooks/useMapViewport';
import { useTokenDrag } from '../hooks/useTokenDrag';
import { MapBackgroundLayer } from './MapBackgroundLayer';
import { MapGridLayer } from './MapGridLayer';
import { MapTokenLayer } from './MapTokenLayer';
import { MapCursorLayer } from './MapCursorLayer';
import { MapPingLayer } from './MapPingLayer';
import { MapToolbar, type MapToolbarLabels } from './MapToolbar';
import { MapViewportContext } from './MapViewportContext';
import s from './MapViewport.module.css';

export interface MapViewportProps {
  imageAssetId: UUID | null;
  grid: GridConfig;
  tokens?: MapTokenDto[];
  selectedTokenId?: UUID | null;
  remoteDragPreviews?: TokenDragPreview[];
  localDragPreview?: TokenDragPreview | null;
  cursors?: RemoteCursor[];
  pings?: MapPing[];
  /** Initial system-grid visibility; the toolbar toggle takes over afterwards. */
  showSystemGrid?: boolean;
  /** @deprecated Use showSystemGrid. Kept for existing callers. */
  showGrid?: boolean;
  onSelectToken?: (tokenId: UUID | null) => void;
  /** Whether a token may be dragged right now (permissions / lock / connection). */
  canDragToken?: (tokenId: UUID) => boolean;
  /** Live drag: the token is following the pointer over `cell` (no commit yet). */
  onTokenDragMove?: (tokenId: UUID, cell: GridCoord) => void;
  /** Drop: the page commits the move (MOVE_TOKEN with `expectedRevision`). */
  onTokenDragEnd?: (tokenId: UUID, cell: GridCoord) => void;
  /** Drag aborted (pointercancel) — the page clears its local preview. */
  onTokenDragCancel?: (tokenId: UUID) => void;
  /** Pointer moved over a new grid cell (`null` on leave) — for cursor presence. */
  onCursorMove?: (cursor: (GridCoord & { screenX: number; screenY: number }) | null) => void;
  /**
   * A click (not a pan/drag) landed on an empty grid cell. Used by placement mode to
   * drop a combatant token; fires only when the pointer barely moved between down/up.
   */
  onEmptyCellClick?: (cell: GridCoord) => void;
  /** In-world layer drawn UNDER the tokens (e.g. the movement preview), image space. */
  underlay?: ReactNode;
  /** Extra in-world overlays (e.g. the calibration overlay), drawn in image space. */
  children?: ReactNode;
  toolbarLabels?: MapToolbarLabels;
  emptyLabel?: string;
}

const DEFAULT_TOOLBAR_LABELS: MapToolbarLabels = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fit: 'Fit to screen',
  reset: 'Reset view',
  toggleGrid: 'Toggle grid',
};

/**
 * Map renderer root. A single world wrapper carries the affine viewport transform
 * (`translate(offset) scale`), so every child layer positions purely in image
 * coordinates. Pan/zoom live in {@link useMapViewport}; the toolbar floats above the
 * world. Presentational only — the page feeds tokens/presence in from the stores.
 */
export function MapViewport({
  imageAssetId,
  grid,
  tokens = [],
  selectedTokenId = null,
  remoteDragPreviews = [],
  localDragPreview = null,
  cursors = [],
  pings = [],
  showSystemGrid,
  showGrid,
  onSelectToken,
  canDragToken,
  onTokenDragMove,
  onTokenDragEnd,
  onTokenDragCancel,
  onCursorMove,
  onEmptyCellClick,
  underlay,
  children,
  toolbarLabels = DEFAULT_TOOLBAR_LABELS,
  emptyLabel = 'No map image',
}: MapViewportProps) {
  const vp = useMapViewport();
  const [gridVisible, setGridVisible] = useState(showSystemGrid ?? showGrid ?? true);
  const normalizedGrid = useMemo(() => normalizeGridConfig(grid), [grid]);

  // Token drag lives here (the live transform/container rect are only available
  // inside the viewport); the page owns the network/permission side via callbacks.
  const tokenDrag = useTokenDrag({
    containerRef: vp.containerRef,
    grid: normalizedGrid,
    viewport: vp.viewport,
    canDrag: canDragToken,
    onDragMove: onTokenDragMove,
    onDragEnd: onTokenDragEnd,
    onDragCancel: onTokenDragCancel,
  });

  // Report the snapped cell under the pointer for cursor presence, deduped so a WS
  // message is sent at most once per cell crossing (never on every pixel of motion).
  const lastCursorCell = useRef<GridCoord | null>(null);
  const reportCursor = (clientX: number, clientY: number, screenX: number, screenY: number) => {
    if (!onCursorMove) return;
    const el = vp.containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cell = viewportPointToGrid(
      { x: clientX - rect.left, y: clientY - rect.top },
      normalizedGrid,
      vp.viewport,
      { snap: true },
    );
    const last = lastCursorCell.current;
    if (!last || last.gridX !== cell.gridX || last.gridY !== cell.gridY) {
      lastCursorCell.current = cell;
      onCursorMove({ ...cell, screenX, screenY });
    }
  };

  // Distinguish a click (placement) from a pan: remember the pointer-down position
  // and only fire onEmptyCellClick if the pointer barely moved before release.
  const CLICK_MOVE_THRESHOLD_PX = 5;
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const gridCellAt = (clientX: number, clientY: number): GridCoord | null => {
    const el = vp.containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return viewportPointToGrid(
      { x: clientX - rect.left, y: clientY - rect.top },
      normalizedGrid,
      vp.viewport,
      { snap: true },
    );
  };

  return (
    <div
      ref={vp.containerRef}
      className={cn(s.viewport, vp.isPanning ? s.isPanning : s.isPannable)}
      onPointerDown={(e) => {
        onSelectToken?.(null);
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        vp.onPointerDown(e);
      }}
      onPointerMove={(e) => {
        vp.onPointerMove(e);
        reportCursor(e.clientX, e.clientY, e.screenX, e.screenY);
      }}
      onPointerUp={(e) => {
        vp.onPointerUp(e);
        const down = pointerDownPos.current;
        pointerDownPos.current = null;
        if (onEmptyCellClick && down) {
          const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
          if (moved <= CLICK_MOVE_THRESHOLD_PX) {
            const cell = gridCellAt(e.clientX, e.clientY);
            if (cell) onEmptyCellClick(cell);
          }
        }
      }}
      onPointerCancel={(e) => {
        pointerDownPos.current = null;
        vp.onPointerUp(e);
      }}
      onPointerLeave={() => {
        if (onCursorMove && lastCursorCell.current) {
          lastCursorCell.current = null;
          onCursorMove(null);
        }
      }}
    >
      {imageAssetId ? (
        <div
          className={s.world}
          style={{
            transform: `translate(${vp.viewport.offsetX}px, ${vp.viewport.offsetY}px) scale(${vp.viewport.scale})`,
          }}
        >
          <MapViewportContext.Provider value={{ viewport: vp.viewport, imageSize: vp.imageSize }}>
            <MapBackgroundLayer imageAssetId={imageAssetId} onImageSize={vp.setImageSize} />
            {gridVisible && <MapGridLayer grid={normalizedGrid} imageSize={vp.imageSize} />}
            {underlay}
            <MapTokenLayer
              grid={normalizedGrid}
              tokens={tokens}
              selectedTokenId={selectedTokenId}
              remoteDragPreviews={remoteDragPreviews}
              localDragPreview={localDragPreview}
              onSelectToken={onSelectToken}
              onTokenPointerDown={tokenDrag.onTokenPointerDown}
            />
            <MapPingLayer grid={normalizedGrid} pings={pings} />
            <MapCursorLayer grid={normalizedGrid} cursors={cursors} />
            {children}
          </MapViewportContext.Provider>
        </div>
      ) : (
        <div className={s.empty}>{emptyLabel}</div>
      )}

      <MapToolbar
        scale={vp.viewport.scale}
        showGrid={gridVisible}
        onZoomIn={vp.zoomIn}
        onZoomOut={vp.zoomOut}
        onReset={vp.reset}
        onFit={vp.fit}
        onToggleGrid={() => setGridVisible((g) => !g)}
        labels={toolbarLabels}
      />
    </div>
  );
}
