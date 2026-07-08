import { describe, it, expect } from 'vitest';
import type { CombatantTurnResponse } from '@/types';
import type { GridConfig, MapTokenDto } from '../../types';
import {
  boundsFromGrid,
  cellKey,
  combatantFlySpeedFt,
  combatantSpeedFt,
  computeReach,
  isReachable,
  occupiedCells,
  rangeCellsFromSpeed,
  reconstructPath,
  sizeToCells,
  stepDistance,
} from './movement';

function boundsGrid(columns = 10, rows = 10, cellWorldSize = 5): GridConfig {
  return {
    type: 'SQUARE',
    cellWorldSize,
    cellWorldUnit: 'ft',
    calibration: {
      mode: 'BOUNDS',
      topLeft: { imageX: 0, imageY: 0 },
      bottomRight: { imageX: 50 * columns, imageY: 50 * rows },
      columns,
      rows,
    },
  };
}

function simpleGrid(): GridConfig {
  return {
    type: 'SQUARE',
    cellWorldSize: 5,
    cellWorldUnit: 'ft',
    calibration: { mode: 'SIMPLE', origin: { imageX: 0, imageY: 0 }, cellWidthPx: 50, cellHeightPx: 50, rotationDeg: 0 },
  };
}

function token(over: Partial<MapTokenDto>): MapTokenDto {
  return {
    id: 't',
    mapSessionId: 's',
    characterId: null,
    ownerUserId: null,
    name: 'X',
    tokenType: 'CHARACTER',
    gridX: 0,
    gridY: 0,
    widthCells: 1,
    heightCells: 1,
    visible: true,
    locked: false,
    elevationFt: 0,
    gmName: null,
    gmNotes: null,
    data: {},
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

describe('rangeCellsFromSpeed', () => {
  it('divides speed by the cell world size and floors', () => {
    expect(rangeCellsFromSpeed(30, 5)).toBe(6);
    expect(rangeCellsFromSpeed(25, 5)).toBe(5);
    expect(rangeCellsFromSpeed(30, 10)).toBe(3);
    expect(rangeCellsFromSpeed(7, 5)).toBe(1);
  });
  it('falls back to a 5ft cell and never goes negative', () => {
    expect(rangeCellsFromSpeed(30, 0)).toBe(6);
    expect(rangeCellsFromSpeed(0, 5)).toBe(0);
  });
});

describe('combatantSpeedFt', () => {
  it('uses the character speed when present', () => {
    const turn = { character: { speed: 30 } } as unknown as CombatantTurnResponse;
    expect(combatantSpeedFt(turn)).toBe(30);
  });
  it('prefers the monster walk speed over other movement types', () => {
    const turn = {
      monster: {
        speeds: [
          { movementType: { code: 'fly' }, ft: 60 },
          { movementType: { code: 'walk' }, ft: 30 },
        ],
      },
    } as unknown as CombatantTurnResponse;
    expect(combatantSpeedFt(turn)).toBe(30);
  });
  it('falls back to the first monster speed when there is no walk entry', () => {
    const turn = {
      monster: { speeds: [{ movementType: { code: 'fly' }, ft: 60 }] },
    } as unknown as CombatantTurnResponse;
    expect(combatantSpeedFt(turn)).toBe(60);
  });
  it('returns null when no speed is available', () => {
    expect(combatantSpeedFt(null)).toBeNull();
    expect(combatantSpeedFt({ monster: { speeds: [] } } as unknown as CombatantTurnResponse)).toBeNull();
  });
});

describe('combatantFlySpeedFt', () => {
  it('reads a monster fly speed', () => {
    const turn = {
      monster: {
        speeds: [
          { movementType: { code: 'walk' }, ft: 30 },
          { movementType: { code: 'fly' }, ft: 60 },
        ],
      },
    } as unknown as CombatantTurnResponse;
    expect(combatantFlySpeedFt(turn)).toBe(60);
  });
  it('is null without a fly speed (e.g. a plain character)', () => {
    expect(combatantFlySpeedFt({ character: { speed: 30 } } as unknown as CombatantTurnResponse)).toBeNull();
    expect(
      combatantFlySpeedFt({ monster: { speeds: [{ movementType: { code: 'walk' }, ft: 30 }] } } as unknown as CombatantTurnResponse),
    ).toBeNull();
  });
});

describe('sizeToCells', () => {
  it('maps D&D size categories to a square side in cells', () => {
    expect(sizeToCells('TINY')).toBe(1);
    expect(sizeToCells('SMALL')).toBe(1);
    expect(sizeToCells('MEDIUM')).toBe(1);
    expect(sizeToCells('LARGE')).toBe(2);
    expect(sizeToCells('HUGE')).toBe(3);
    expect(sizeToCells('GARGANTUAN')).toBe(4);
  });
  it('is case-insensitive and defaults unknown/empty to 1', () => {
    expect(sizeToCells('large')).toBe(2);
    expect(sizeToCells(null)).toBe(1);
    expect(sizeToCells('???')).toBe(1);
  });
});

describe('boundsFromGrid', () => {
  it('derives inclusive cell bounds from a calibration with dimensions', () => {
    expect(boundsFromGrid(boundsGrid(10, 8))).toEqual({ minX: 0, maxX: 9, minY: 0, maxY: 7 });
  });
  it('returns null for image maps without fixed dimensions', () => {
    expect(boundsFromGrid(simpleGrid())).toBeNull();
  });
});

describe('occupiedCells', () => {
  it('collects every other token footprint and excludes the mover', () => {
    const occ = occupiedCells(
      [
        token({ id: 'a', gridX: 2, gridY: 2 }),
        token({ id: 'b', gridX: 5, gridY: 5, widthCells: 2, heightCells: 2 }),
      ],
      'a',
    );
    expect(occ.has(cellKey(2, 2))).toBe(false); // the mover is excluded
    expect(occ.has(cellKey(5, 5))).toBe(true);
    expect(occ.has(cellKey(6, 6))).toBe(true);
    expect(occ.has(cellKey(6, 5))).toBe(true);
  });
});

describe('computeReach', () => {
  it('flood-fills cells within range (8-directional, each step = 1 cell)', () => {
    const reach = computeReach({ gridX: 0, gridY: 0 }, 2, new Set(), boundsFromGrid(boundsGrid()));
    expect(isReachable(reach, { gridX: 2, gridY: 2 })).toBe(true);
    expect(isReachable(reach, { gridX: 2, gridY: 0 })).toBe(true);
    expect(isReachable(reach, { gridX: 3, gridY: 0 })).toBe(false); // out of range
    expect(isReachable(reach, { gridX: 0, gridY: 0 })).toBe(false); // origin is not a move
  });

  it('treats occupied cells as impassable', () => {
    const occupied = new Set([cellKey(1, 0)]);
    const reach = computeReach({ gridX: 0, gridY: 0 }, 2, occupied, boundsFromGrid(boundsGrid()));
    expect(isReachable(reach, { gridX: 1, gridY: 0 })).toBe(false); // blocked
    expect(isReachable(reach, { gridX: 2, gridY: 0 })).toBe(true); // reached around the block
  });

  it('respects map bounds', () => {
    const reach = computeReach({ gridX: 0, gridY: 0 }, 5, new Set(), boundsFromGrid(boundsGrid(3, 3)));
    expect(isReachable(reach, { gridX: 2, gridY: 2 })).toBe(true);
    expect(isReachable(reach, { gridX: 3, gridY: 3 })).toBe(false); // off the 3×3 map
  });

  it('blocks stepping low→high ground when terrain is supplied (walk)', () => {
    // Cell (1,1) sits on high ground; the rest is low.
    const elevationAt = (x: number, y: number) => (x === 1 && y === 1 ? 1 : 0);
    const walk = computeReach({ gridX: 0, gridY: 0 }, 3, new Set(), null, { elevationAt });
    expect(isReachable(walk, { gridX: 1, gridY: 1 })).toBe(false); // can't climb up
    expect(isReachable(walk, { gridX: 2, gridY: 0 })).toBe(true); // low ground still reachable
  });

  it('flight ignores the low→high ground rule', () => {
    const elevationAt = (x: number, y: number) => (x === 1 && y === 1 ? 1 : 0);
    const fly = computeReach({ gridX: 0, gridY: 0 }, 3, new Set(), null, { elevationAt, ignoreGround: true });
    expect(isReachable(fly, { gridX: 1, gridY: 1 })).toBe(true);
  });
});

describe('reconstructPath', () => {
  it('returns an inclusive origin→target path for a reachable cell', () => {
    const reach = computeReach({ gridX: 0, gridY: 0 }, 3, new Set(), null);
    const path = reconstructPath(reach, { gridX: 2, gridY: 0 });
    expect(path[0]).toEqual({ gridX: 0, gridY: 0 });
    expect(path[path.length - 1]).toEqual({ gridX: 2, gridY: 0 });
    expect(path.length).toBe(3);
  });
  it('returns an empty path for an unreachable cell', () => {
    const reach = computeReach({ gridX: 0, gridY: 0 }, 1, new Set(), null);
    expect(reconstructPath(reach, { gridX: 5, gridY: 5 })).toEqual([]);
  });
});

describe('stepDistance', () => {
  it('is the Chebyshev (king-move) distance', () => {
    expect(stepDistance({ gridX: 0, gridY: 0 }, { gridX: 3, gridY: 1 })).toBe(3);
    expect(stepDistance({ gridX: 1, gridY: 1 }, { gridX: 4, gridY: 5 })).toBe(4);
  });
});
