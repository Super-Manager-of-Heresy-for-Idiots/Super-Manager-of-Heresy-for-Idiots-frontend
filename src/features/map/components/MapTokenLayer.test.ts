import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GridConfig, MapTokenDto } from '../types';
import { MapTokenLayer } from './MapTokenLayer';

const grid: GridConfig = {
  type: 'SQUARE',
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
  visual: { gridLineColor: '#00FFFF', gridLineOpacity: 0.4, gridLineWidthPx: 2 },
  calibration: {
    mode: 'BOUNDS',
    topLeft: { imageX: 100, imageY: 80 },
    bottomRight: { imageX: 500, imageY: 380 },
    columns: 40,
    rows: 30,
  },
};

const token: MapTokenDto = {
  id: 'token-1',
  mapSessionId: 'session-1',
  characterId: null,
  ownerUserId: null,
  name: 'Acolyte',
  tokenType: 'CHARACTER',
  gridX: 12,
  gridY: 8,
  widthCells: 2,
  heightCells: 3,
  visible: true,
  locked: false,
  data: {},
  createdAt: '2026-06-24T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
};

describe('MapTokenLayer', () => {
  it('positions runtime tokens through calibrated grid projection', () => {
    const markup = renderToStaticMarkup(
      createElement(MapTokenLayer, {
        grid,
        tokens: [token],
        selectedTokenId: null,
        remoteDragPreviews: [],
        localDragPreview: null,
      }),
    );

    expect(markup).toContain('left:220px');
    expect(markup).toContain('top:160px');
    expect(markup).toContain('width:20px');
    expect(markup).toContain('height:30px');
  });
});
