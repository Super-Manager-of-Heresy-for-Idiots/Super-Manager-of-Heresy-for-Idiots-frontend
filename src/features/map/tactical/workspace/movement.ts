/**
 * Pure tactical-movement logic for the unified workspace. No React: range from
 * speed, reachable-cell flood fill (respecting occupied cells + map bounds), and
 * path reconstruction are all unit-testable in isolation.
 *
 * The map-service does NOT enforce range/turn/occupancy on a move (it only guards
 * the revision + permissions), so these rules live on the frontend as movement
 * guards + preview. Coordinates are grid cells only — never pixels.
 */

import { getCalibrationDimensions } from '../../engine';
import type { CombatantTurnResponse } from '@/types';
import type { GridConfig, MapTokenDto } from '../../types';

export interface Cell {
  gridX: number;
  gridY: number;
}

/**
 * What the map center + action panel need to gate, preview and trigger the acting
 * combatant's default movement. Computed by the workspace from the battle (active
 * combatant) and the core current-turn detail (speeds); `null` when the viewer
 * cannot move the active combatant right now.
 */
export interface MovementConfig {
  activeTokenId: string;
  /** Walk range in cells (walk speed ÷ cell); 0 when none. */
  walkRangeCells: number;
  /** Fly range in cells (fly speed ÷ cell); 0 when the creature can't fly. */
  flyRangeCells: number;
  kind: 'CHARACTER' | 'MONSTER';
  /** `combatantId:round` — changing it resets the per-turn movement budget. */
  turnKey: string;
}

export interface MapCellBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function cellKey(gridX: number, gridY: number): string {
  return `${Math.round(gridX)},${Math.round(gridY)}`;
}

/** Movement range in cells: speed (ft) ÷ cell world size (ft per cell), floored. */
export function rangeCellsFromSpeed(speedFt: number, cellWorldSize: number): number {
  const perCell = cellWorldSize > 0 ? cellWorldSize : 5;
  return Math.max(0, Math.floor(speedFt / perCell));
}

function matchSpeed(turn: CombatantTurnResponse | null | undefined, test: (label: string) => boolean) {
  const speeds = turn?.monster?.speeds ?? [];
  const hit = speeds.find((sp) =>
    test(`${sp.movementType?.code ?? ''} ${sp.movementType?.nameRusloc ?? ''}`.toLowerCase()),
  );
  return typeof hit?.ft === 'number' && hit.ft > 0 ? hit.ft : null;
}

/** The active combatant's walking speed (ft) from the core current-turn detail. */
export function combatantSpeedFt(turn: CombatantTurnResponse | null | undefined): number | null {
  const charSpeed = turn?.character?.speed;
  if (typeof charSpeed === 'number' && charSpeed > 0) return charSpeed;
  const speeds = turn?.monster?.speeds ?? [];
  if (speeds.length === 0) return null;
  const walk = matchSpeed(turn, (l) => l.includes('walk') || l.includes('ходь') || l.includes('пеш') || l.includes('скор'));
  if (walk != null) return walk;
  const first = speeds[0];
  return typeof first?.ft === 'number' && first.ft > 0 ? first.ft : null;
}

/**
 * The active combatant's FLYING speed (ft), or null if it can't fly. Monsters carry
 * a `fly` movement type; characters expose only a single walk speed today (no FE fly
 * field), so they return null until the backend surfaces one.
 */
export function combatantFlySpeedFt(turn: CombatantTurnResponse | null | undefined): number | null {
  return matchSpeed(turn, (l) => l.includes('fly') || l.includes('полёт') || l.includes('полет') || l.includes('лет'));
}

/**
 * Token side length in cells for a D&D size category code. Tiny–Medium share one
 * cell; each larger step adds a cell per side (Large 2, Huge 3, Gargantuan 4).
 */
export function sizeToCells(sizeCode: string | null | undefined): number {
  switch ((sizeCode ?? '').toUpperCase()) {
    case 'LARGE':
      return 2;
    case 'HUGE':
      return 3;
    case 'GARGANTUAN':
      return 4;
    default:
      return 1; // TINY, SMALL, MEDIUM (and unknown) → 1×1
  }
}

/** Map bounds in whole cells, or null for image maps without a fixed grid extent. */
export function boundsFromGrid(grid: GridConfig): MapCellBounds | null {
  const dims = getCalibrationDimensions(grid.calibration);
  if (!dims) return null;
  return { minX: 0, maxX: dims.columns - 1, minY: 0, maxY: dims.rows - 1 };
}

/** Cells covered by other tokens' footprints (the moving token is excluded). */
export function occupiedCells(tokens: MapTokenDto[], excludeTokenId: string | null): Set<string> {
  const set = new Set<string>();
  for (const token of tokens) {
    if (token.id === excludeTokenId || !token.visible) continue;
    const x0 = Math.round(token.gridX);
    const y0 = Math.round(token.gridY);
    const w = Math.max(1, Math.round(token.widthCells || 1));
    const h = Math.max(1, Math.round(token.heightCells || 1));
    for (let dx = 0; dx < w; dx += 1) {
      for (let dy = 0; dy < h; dy += 1) set.add(cellKey(x0 + dx, y0 + dy));
    }
  }
  return set;
}

export interface ReachResult {
  /** cellKey → step distance from origin (includes the origin cell at distance 0). */
  distance: Map<string, number>;
  /** cellKey → predecessor cellKey on the shortest path (origin → null). */
  prev: Map<string, string | null>;
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/**
 * Optional terrain rules for {@link computeReach}. `elevationAt` returns a cell's
 * ground level; with it set (and `ignoreGround` false), a step from a lower cell to a
 * higher one is blocked (the "can't walk low→high ground" rule). Flying passes
 * `ignoreGround: true`. Today no terrain is wired, so callers omit `elevationAt` and
 * the rule is a no-op — the hook exists so high ground can be switched on later
 * without touching the flood fill.
 */
export interface ReachTerrainOptions {
  elevationAt?: (gridX: number, gridY: number) => number;
  ignoreGround?: boolean;
}

/**
 * Flood fill reachable cells within `range` steps (8-directional, each step costs 1
 * — D&D "every square is 5 ft"), blocked by occupied cells, the map bounds, and
 * (optionally) the low→high ground rule via {@link ReachTerrainOptions}.
 */
export function computeReach(
  origin: Cell,
  range: number,
  occupied: Set<string>,
  bounds: MapCellBounds | null,
  terrain?: ReachTerrainOptions,
): ReachResult {
  const distance = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const ox = Math.round(origin.gridX);
  const oy = Math.round(origin.gridY);
  const originKey = cellKey(ox, oy);
  distance.set(originKey, 0);
  prev.set(originKey, null);
  if (range <= 0) return { distance, prev };

  const queue: Array<[number, number]> = [[ox, oy]];
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head];
    head += 1;
    const d = distance.get(cellKey(cx, cy))!;
    if (d >= range) continue;
    for (const [dx, dy] of DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (bounds && (nx < bounds.minX || nx > bounds.maxX || ny < bounds.minY || ny > bounds.maxY)) {
        continue;
      }
      const nKey = cellKey(nx, ny);
      if (occupied.has(nKey) || distance.has(nKey)) continue;
      // Low→high ground rule (no-op until terrain is wired): can't step up.
      if (terrain?.elevationAt && !terrain.ignoreGround && terrain.elevationAt(nx, ny) > terrain.elevationAt(cx, cy)) {
        continue;
      }
      distance.set(nKey, d + 1);
      prev.set(nKey, cellKey(cx, cy));
      queue.push([nx, ny]);
    }
  }
  return { distance, prev };
}

/** True when `target` is a legal destination (reachable and not the origin). */
export function isReachable(reach: ReachResult, target: Cell): boolean {
  const key = cellKey(target.gridX, target.gridY);
  const d = reach.distance.get(key);
  return d != null && d > 0;
}

/** Shortest path origin → target as cells (inclusive of both); empty if unreachable. */
export function reconstructPath(reach: ReachResult, target: Cell): Cell[] {
  const targetKey = cellKey(target.gridX, target.gridY);
  if (!reach.prev.has(targetKey)) return [];
  const path: Cell[] = [];
  let cur: string | null = targetKey;
  while (cur) {
    const [x, y] = cur.split(',').map(Number);
    path.push({ gridX: x, gridY: y });
    cur = reach.prev.get(cur) ?? null;
  }
  return path.reverse();
}

/** Chebyshev (king-move) step count between two cells. */
export function stepDistance(a: Cell, b: Cell): number {
  return Math.max(
    Math.abs(Math.round(a.gridX) - Math.round(b.gridX)),
    Math.abs(Math.round(a.gridY) - Math.round(b.gridY)),
  );
}
