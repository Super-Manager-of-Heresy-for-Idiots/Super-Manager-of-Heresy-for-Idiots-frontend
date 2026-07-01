import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { LegacySimpleGridConfig } from '../types';
import { MapViewport } from './MapViewport';
import { MapGridLayer } from './MapGridLayer';

const mapGridLayerMock = vi.hoisted(() => vi.fn(() => null));

vi.mock('../hooks/useMapViewport', () => ({
  useMapViewport: () => ({
    viewport: { scale: 1, offsetX: 0, offsetY: 0 },
    containerRef: { current: null },
    imageSize: { width: 800, height: 600 },
    isPanning: false,
    setImageSize: vi.fn(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    reset: vi.fn(),
    fit: vi.fn(),
  }),
}));

vi.mock('./MapBackgroundLayer', () => ({
  MapBackgroundLayer: () => null,
}));

vi.mock('./MapGridLayer', () => ({
  MapGridLayer: mapGridLayerMock,
}));

describe('MapViewport runtime grid normalization', () => {
  it('passes normalized runtime gridConfig to the system grid layer', () => {
    const legacyGrid: LegacySimpleGridConfig = {
      type: 'SQUARE',
      originX: 12,
      originY: 18,
      cellWidthPx: 70,
      cellHeightPx: 72,
      rotationDeg: 0,
      cellWorldSize: 5,
      cellWorldUnit: 'ft',
    };

    renderToStaticMarkup(
      createElement(MapViewport, {
        imageAssetId: 'asset-1',
        grid: legacyGrid as never,
        showSystemGrid: true,
      }),
    );

    const props = vi.mocked(MapGridLayer).mock.calls[0]?.[0];
    expect(props?.grid).toMatchObject({
      type: 'SQUARE',
      visual: { gridLineColor: '#FFFFFF', gridLineOpacity: 0.65, gridLineWidthPx: 1 },
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 12, imageY: 18 },
        cellWidthPx: 70,
        cellHeightPx: 72,
      },
    });
  });
});
