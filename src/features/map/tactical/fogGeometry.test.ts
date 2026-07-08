import { describe, it, expect } from 'vitest';
import type { FogShapeDto } from '../types';
import { isPointRevealed } from './fogGeometry';

const rect = (x: number, y: number, width: number, height: number): FogShapeDto => ({
  type: 'RECT',
  x,
  y,
  width,
  height,
  points: null,
});

describe('isPointRevealed', () => {
  it('returns false when there are no revealed shapes (fully fogged)', () => {
    expect(isPointRevealed([], 3, 3)).toBe(false);
  });

  it('detects a point inside a revealed rectangle (inclusive edges)', () => {
    const shapes = [rect(2, 2, 4, 4)];
    expect(isPointRevealed(shapes, 3, 3)).toBe(true); // inside
    expect(isPointRevealed(shapes, 2, 2)).toBe(true); // top-left corner
    expect(isPointRevealed(shapes, 6, 6)).toBe(true); // bottom-right corner (x+w, y+h)
    expect(isPointRevealed(shapes, 7, 3)).toBe(false); // outside x
    expect(isPointRevealed(shapes, 3, 8)).toBe(false); // outside y
  });

  it('detects a point inside a revealed polygon', () => {
    const triangle: FogShapeDto = {
      type: 'POLYGON',
      x: null,
      y: null,
      width: null,
      height: null,
      points: [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 0, y: 6 },
      ],
    };
    expect(isPointRevealed([triangle], 1, 1)).toBe(true); // inside
    expect(isPointRevealed([triangle], 5, 5)).toBe(false); // outside the hypotenuse
  });

  it('is revealed if the point falls in any one of several shapes', () => {
    const shapes = [rect(0, 0, 2, 2), rect(10, 10, 2, 2)];
    expect(isPointRevealed(shapes, 11, 11)).toBe(true);
    expect(isPointRevealed(shapes, 5, 5)).toBe(false);
  });
});
