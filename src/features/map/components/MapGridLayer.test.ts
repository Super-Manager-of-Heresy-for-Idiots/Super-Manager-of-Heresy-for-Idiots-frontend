import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GridConfig } from '../types';
import { DEFAULT_GRID_VISUAL } from '../calibration';
import { MapGridLayer } from './MapGridLayer';

const IMAGE_SIZE = { width: 120, height: 100 };

const baseGrid = {
  type: 'SQUARE',
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
  visual: { ...DEFAULT_GRID_VISUAL },
} satisfies Omit<GridConfig, 'calibration'>;

function renderGrid(grid: GridConfig): string {
  return renderToStaticMarkup(createElement(MapGridLayer, { grid, imageSize: IMAGE_SIZE }));
}

describe('MapGridLayer', () => {
  it('renders SIMPLE system grid overlay lines', () => {
    const markup = renderGrid({
      ...baseGrid,
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 0, imageY: 0 },
        cellWidthPx: 60,
        cellHeightPx: 50,
        rotationDeg: 0,
      },
    });

    expect(markup).toContain('<svg');
    expect(markup).toContain('<polyline');
  });

  it('renders BOUNDS system grid overlay lines', () => {
    const markup = renderGrid({
      ...baseGrid,
      calibration: {
        mode: 'BOUNDS',
        topLeft: { imageX: 10, imageY: 20 },
        bottomRight: { imageX: 110, imageY: 80 },
        columns: 2,
        rows: 2,
      },
    });

    expect(markup).toContain('points="10,20 10,50 10,80"');
    expect(markup).toContain('points="10,20 60,20 110,20"');
  });

  it('renders FOUR_CORNER system grid overlay with calibrated projected points', () => {
    const markup = renderGrid({
      ...baseGrid,
      calibration: {
        mode: 'FOUR_CORNER',
        columns: 2,
        rows: 2,
        corners: {
          topLeft: { imageX: 0, imageY: 0 },
          topRight: { imageX: 100, imageY: 0 },
          bottomRight: { imageX: 120, imageY: 100 },
          bottomLeft: { imageX: 20, imageY: 100 },
        },
      },
    });

    expect(markup).toContain('points="0,0 10,50 20,100"');
    expect(markup).toContain('points="50,0 60,50 70,100"');
  });

  it('applies grid visual color, opacity, and width to rendered lines', () => {
    const markup = renderGrid({
      ...baseGrid,
      visual: {
        gridLineColor: '#00FFFF',
        gridLineOpacity: 0.4,
        gridLineWidthPx: 3,
      },
      calibration: {
        mode: 'BOUNDS',
        topLeft: { imageX: 0, imageY: 0 },
        bottomRight: { imageX: 100, imageY: 100 },
        columns: 1,
        rows: 1,
      },
    });

    expect(markup).toContain('stroke="#00FFFF"');
    expect(markup).toContain('stroke-opacity="0.4"');
    expect(markup).toContain('stroke-width="3"');
  });

  it('does not override renderer stroke styles in CSS', () => {
    const css = readFileSync(new URL('./MapViewport.module.css', import.meta.url), 'utf8');
    const gridLineRule = css.match(/\.gridLine\s*\{[^}]*\}/)?.[0] ?? '';

    expect(gridLineRule).not.toContain('stroke:');
    expect(gridLineRule).not.toContain('stroke-width:');
  });
});
