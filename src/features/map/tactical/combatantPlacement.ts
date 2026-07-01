/**
 * Pure logic for placing battle combatants onto the tactical map as linked tokens
 * (frontend prompt 03). No React/zustand here so the placement contract — GM gating,
 * grid-only payload, monster-by-instance linkage — is trivially unit-testable.
 *
 * Key invariants the tests pin down:
 *  - the placement request carries grid coordinates ONLY (never pixel/image/viewport);
 *  - monster instances link by `combatantId` (per-instance `BattleCombatant.id`),
 *    never by the shared `monsterId`;
 *  - players cannot place monsters (MVP: placement is GM-only).
 */

import type { CreateTokenFromCombatantRequest } from '../types';
import type { PlacementState } from '../state';

/** Minimal grid cell the map viewport reports on click (extra fields are ignored). */
export interface PlacementCell {
  gridX: number;
  gridY: number;
}

/** Roles allowed to manage the tactical map; mirrors `canManageBattleMaps`. */
export function canPlaceCombatant(role: string | null | undefined): boolean {
  return role === 'GAME_MASTER' || role === 'ADMIN';
}

/**
 * Enter placement mode for one combatant (drives the next empty-cell click).
 * `widthCells`/`heightCells` carry the GM-chosen creature size (square; default 1×1).
 */
export function enterPlacement(
  combatantId: string,
  widthCells = 1,
  heightCells = 1,
): PlacementState {
  return { mode: 'PLACE_COMBATANT', combatantId, widthCells, heightCells };
}

/**
 * Build the `from-combatant` request body from the clicked grid cell. Carries grid
 * coordinates ONLY (never pixel/image/screen), plus the optional GM-chosen token size.
 */
export function buildFromCombatantRequest(
  battleId: string,
  combatantId: string,
  cell: PlacementCell,
  size?: { widthCells?: number; heightCells?: number },
): CreateTokenFromCombatantRequest {
  return {
    battleId,
    combatantId,
    gridX: cell.gridX,
    gridY: cell.gridY,
    ...(size?.widthCells ? { widthCells: size.widthCells } : {}),
    ...(size?.heightCells ? { heightCells: size.heightCells } : {}),
  };
}
