/**
 * Owns the pan/zoom state for a {@link MapViewport}. Pure DOM + math — no stores —
 * so it can drive both the live session view and the editor preview.
 *
 *   viewport = image * scale + offset      (see engine/coords.ts)
 *
 * Wheel zoom is centered on the cursor; left/middle drag pans; the image auto-fits
 * to the container the first time it loads, and Fit/Reset are exposed for the
 * toolbar. The wheel listener is attached natively (non-passive) so it can call
 * preventDefault and stop the page from scrolling underneath the map.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { MapViewportState } from '../engine';

export interface ImageSize {
  width: number;
  height: number;
}

export interface UseMapViewportResult {
  viewport: MapViewportState;
  containerRef: RefObject<HTMLDivElement>;
  imageSize: ImageSize | null;
  isPanning: boolean;
  /** Reported by the background layer once the image's natural size is known. */
  setImageSize: (size: ImageSize) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.2;
const FIT_PADDING = 0.96;

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function useMapViewport(): UseMapViewportResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<MapViewportState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [imageSize, setImageSizeState] = useState<ImageSize | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef<{ x: number; y: number } | null>(null);

  const containerSize = useCallback((): ImageSize => {
    const el = containerRef.current;
    return el ? { width: el.clientWidth, height: el.clientHeight } : { width: 0, height: 0 };
  }, []);

  // Zoom about a container-local point, keeping the image pixel under it fixed.
  const zoomAround = useCallback((cx: number, cy: number, factor: number) => {
    setViewport((v) => {
      const scale = clampScale(v.scale * factor);
      const k = scale / v.scale;
      return {
        scale,
        offsetX: cx - (cx - v.offsetX) * k,
        offsetY: cy - (cy - v.offsetY) * k,
      };
    });
  }, []);

  const fitTo = useCallback(
    (img: ImageSize | null) => {
      const { width: cw, height: ch } = containerSize();
      if (!img || img.width <= 0 || img.height <= 0) {
        setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
        return;
      }
      const scale = clampScale(Math.min(cw / img.width, ch / img.height) * FIT_PADDING);
      setViewport({
        scale,
        offsetX: (cw - img.width * scale) / 2,
        offsetY: (ch - img.height * scale) / 2,
      });
    },
    [containerSize],
  );

  const fit = useCallback(() => fitTo(imageSize), [fitTo, imageSize]);

  const reset = useCallback(() => {
    const { width: cw, height: ch } = containerSize();
    if (!imageSize) {
      setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
      return;
    }
    setViewport({
      scale: 1,
      offsetX: (cw - imageSize.width) / 2,
      offsetY: (ch - imageSize.height) / 2,
    });
  }, [containerSize, imageSize]);

  const setImageSize = useCallback(
    (size: ImageSize) => {
      setImageSizeState(size);
      fitTo(size); // auto-fit the freshly-loaded image
    },
    [fitTo],
  );

  const zoomIn = useCallback(() => {
    const { width, height } = containerSize();
    zoomAround(width / 2, height / 2, ZOOM_STEP);
  }, [containerSize, zoomAround]);

  const zoomOut = useCallback(() => {
    const { width, height } = containerSize();
    zoomAround(width / 2, height / 2, 1 / ZOOM_STEP);
  }, [containerSize, zoomAround]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // Left button (empty area) or middle button starts a pan.
    if (e.button !== 0 && e.button !== 1) return;
    panOrigin.current = { x: e.clientX, y: e.clientY };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const origin = panOrigin.current;
    if (!origin) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    panOrigin.current = { x: e.clientX, y: e.clientY };
    setViewport((v) => ({ ...v, offsetX: v.offsetX + dx, offsetY: v.offsetY + dy }));
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!panOrigin.current) return;
    panOrigin.current = null;
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  // Native non-passive wheel listener so preventDefault actually suppresses scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAround(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAround]);

  return {
    viewport,
    containerRef,
    imageSize,
    isPanning,
    setImageSize,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomIn,
    zoomOut,
    reset,
    fit,
  };
}
