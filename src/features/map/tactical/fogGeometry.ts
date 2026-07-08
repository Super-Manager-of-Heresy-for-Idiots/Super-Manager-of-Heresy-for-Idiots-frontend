/**
 * Fog geometry helpers (Phase 1.6). The map is fogged everywhere except the union of the
 * revealed shapes; these predicates answer "is this grid point revealed?" for client-side
 * token filtering (players don't see tokens standing in fog — an MVP approximation; the
 * server does not yet occlude tokens by fog).
 */

import type { FogShapeDto } from '../types';

/** True when the grid point (x, y) lies inside any revealed shape (i.e. NOT fogged). */
export function isPointRevealed(revealed: FogShapeDto[], x: number, y: number): boolean {
  for (const shape of revealed) {
    if (shape.type === 'RECT') {
      if (shape.x == null || shape.y == null || shape.width == null || shape.height == null) continue;
      if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) {
        return true;
      }
    } else if (shape.points && shape.points.length >= 3 && pointInPolygon(shape.points, x, y)) {
      return true;
    }
  }
  return false;
}

/** Standard ray-casting point-in-polygon test (grid coordinates). */
function pointInPolygon(points: Array<{ x: number; y: number }>, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
