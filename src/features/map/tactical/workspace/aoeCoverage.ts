/**
 * Whether an AoE zone covers a grid cell — the frontend mirror of the map-service `AoeGeometry.covers`
 * (Phase 2.11). Used to decide difficult-terrain movement cost in the preview so it matches what the
 * server charges. Radius shapes use Chebyshev distance (like movement); cone/line lingering difficult
 * terrain is rare and left to the server (returns false here — a preview-only approximation).
 */

import type { MapElementDto } from '../../types/mapApiTypes';

const FEET_PER_CELL = 5;

export function zoneCoversCell(zone: MapElementDto, gridX: number, gridY: number): boolean {
  const sizeFt = Number(zone.properties?.sizeFt) || 0;
  const cells = Math.max(0, Math.floor(sizeFt / FEET_PER_CELL));
  const ox = Math.round(zone.gridX);
  const oy = Math.round(zone.gridY);
  const cheb = Math.max(Math.abs(Math.round(gridX) - ox), Math.abs(Math.round(gridY) - oy));
  switch (zone.elementType) {
    case 'SPHERE':
    case 'CYLINDER':
    case 'AURA':
      return cheb <= cells; // sizeFt = radius
    case 'CUBE':
      return cheb <= Math.floor(cells / 2); // sizeFt = edge, origin = center
    default:
      return false; // cone/line difficult terrain is server-enforced, not previewed
  }
}
