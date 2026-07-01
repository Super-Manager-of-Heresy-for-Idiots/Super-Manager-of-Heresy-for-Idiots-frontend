/**
 * Pointer-drag controller for tokens, used INSIDE {@link MapViewport} where the live
 * viewport transform and container rect are available. It converts the pointer's
 * screen position into a snapped grid cell and reports it through high-level
 * callbacks — the page owns the network/permission side (preview, MOVE_TOKEN,
 * `expectedRevision`); this hook owns only the coordinate math.
 *
 * A drag starts on a token pointer-down (gated by `canDrag`) and is tracked via
 * window listeners so it keeps following the pointer even if it leaves the token.
 * Movement is NEVER committed here — see 06_WEBSOCKET_FLOW / Prompt 8.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { GridConfig, UUID } from '../types';
import type { GridCoord, MapViewportState } from '../engine';
import { viewportPointToGrid } from '../engine';

export interface UseTokenDragArgs {
  containerRef: RefObject<HTMLDivElement>;
  grid: GridConfig;
  viewport: MapViewportState;
  /** Whether the given token may be dragged right now (permissions/lock/connection). */
  canDrag?: (tokenId: UUID) => boolean;
  onDragMove?: (tokenId: UUID, cell: GridCoord) => void;
  onDragEnd?: (tokenId: UUID, cell: GridCoord) => void;
  onDragCancel?: (tokenId: UUID) => void;
}

export interface UseTokenDragResult {
  draggingTokenId: UUID | null;
  onTokenPointerDown: (tokenId: UUID, e: ReactPointerEvent<HTMLDivElement>) => void;
}

export function useTokenDrag({
  containerRef,
  grid,
  viewport,
  canDrag,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: UseTokenDragArgs): UseTokenDragResult {
  const [draggingTokenId, setDraggingTokenId] = useState<UUID | null>(null);

  // Window listeners read the latest transform/callbacks without re-subscribing.
  const latest = useRef({ grid, viewport, onDragMove, onDragEnd, onDragCancel });
  latest.current = { grid, viewport, onDragMove, onDragEnd, onDragCancel };

  const dragRef = useRef<{ tokenId: UUID; pointerId: number } | null>(null);

  const cellFromEvent = useCallback(
    (clientX: number, clientY: number): GridCoord | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const local = { x: clientX - rect.left, y: clientY - rect.top };
      return viewportPointToGrid(local, latest.current.grid, latest.current.viewport, { snap: true });
    },
    [containerRef],
  );

  useEffect(() => {
    if (!draggingTokenId) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const cell = cellFromEvent(e.clientX, e.clientY);
      if (cell) latest.current.onDragMove?.(d.tokenId, cell);
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const cell = cellFromEvent(e.clientX, e.clientY);
      dragRef.current = null;
      setDraggingTokenId(null);
      if (cell) latest.current.onDragEnd?.(d.tokenId, cell);
    };
    const onCancel = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const { tokenId } = d;
      dragRef.current = null;
      setDraggingTokenId(null);
      latest.current.onDragCancel?.(tokenId);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [draggingTokenId, cellFromEvent]);

  const onTokenPointerDown = useCallback(
    (tokenId: UUID, e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canDrag?.(tokenId)) return;
      dragRef.current = { tokenId, pointerId: e.pointerId };
      setDraggingTokenId(tokenId);
    },
    [canDrag],
  );

  return { draggingTokenId, onTokenPointerDown };
}
