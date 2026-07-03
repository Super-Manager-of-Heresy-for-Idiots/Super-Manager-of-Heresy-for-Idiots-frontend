/**
 * Pure selection + combat-targeting logic for the tactical inspector (frontend
 * prompt 04). No React/zustand: the selection model, grid distance, and the core
 * battle request shapes are all unit-testable in isolation.
 *
 * Combat resolution ALWAYS goes through the core battle API — these helpers only
 * shape the request bodies. The map-service is never called for attacks/HP, and
 * the target is identified by `targetCombatantId` (resolved from the tokenCombatLink
 * via the derived view), never by a token id or grid coordinate.
 */

import type {
  BattleAttackRequest,
  ApplyCombatantHpRequest,
  CombatantTurnResponse,
} from '@/types';
import type { Lang } from '@/i18n/translations';
import { localizedName } from '@/lib/localized';
import type { TacticalTokenView } from './tacticalView';

/** What the inspector is currently looking at. Mirrors the prompt's discriminated union. */
export type SelectedMapTarget =
  | { kind: 'TOKEN'; tokenId: string; combatantId: string | null }
  | { kind: 'CELL'; gridX: number; gridY: number }
  | { kind: 'ELEMENT'; elementId: string }
  | { kind: 'NONE' };

export interface ResolveSelectedTargetInput {
  selectedTokenId: string | null;
  selectedCell: { gridX: number; gridY: number } | null;
  tokens: TacticalTokenView[];
}

/**
 * Resolve the active inspector target. A selected token wins over a selected cell;
 * with neither, the result is `NONE`. The token's `combatantId` is taken from the
 * derived view (i.e. from the tokenCombatLink), so attacks can address the combatant.
 */
export function resolveSelectedTarget({
  selectedTokenId,
  selectedCell,
  tokens,
}: ResolveSelectedTargetInput): SelectedMapTarget {
  if (selectedTokenId) {
    const view = tokens.find((tk) => tk.tokenId === selectedTokenId);
    if (view) {
      return { kind: 'TOKEN', tokenId: view.tokenId, combatantId: view.linkedCombatantId };
    }
    return { kind: 'TOKEN', tokenId: selectedTokenId, combatantId: null };
  }
  if (selectedCell) {
    return { kind: 'CELL', gridX: selectedCell.gridX, gridY: selectedCell.gridY };
  }
  return { kind: 'NONE' };
}

/**
 * Chebyshev (king-move) distance in cells — the 5e "every square counts as 5 ft"
 * rule. Returns whole cells; the caller multiplies by the grid's world size for feet.
 */
export function gridChebyshevDistance(
  a: { gridX: number; gridY: number },
  b: { gridX: number; gridY: number },
): number {
  return Math.max(Math.abs(a.gridX - b.gridX), Math.abs(a.gridY - b.gridY));
}

/**
 * Build the core attack request. Carries ONLY the target combatant id, attack name
 * and the d20 — never a token id or grid/pixel coordinate.
 */
export function buildAttackRequest(
  targetCombatantId: string,
  attackName: string,
  d20: number,
): BattleAttackRequest {
  return { targetCombatantId, attackName, d20 };
}

/** Build the GM HP-delta request (negative damages, positive heals). */
export function buildHpDeltaRequest(delta: number): ApplyCombatantHpRequest {
  return { delta };
}

/**
 * Attack names available to the active combatant, taken from the core current-turn
 * detail. Characters expose `attacks[].name`; monsters expose attack-typed
 * `features[].nameRusloc` (same source the core `/battle` screen uses). Returns an
 * empty list between turns or when the detail has not loaded — the names are passed
 * verbatim to the core attack endpoint, so this never invents map-side data.
 */
export function attackNamesFromTurn(turn: CombatantTurnResponse | null | undefined, lang: Lang = 'ru'): string[] {
  if (!turn) return [];
  const characterAttacks = (turn.character?.attacks ?? []).map((a) => a.name);
  const monsterAttacks = (turn.monster?.features ?? [])
    .filter((f) => f.attackType)
    .map((f) => localizedName(f, lang));
  const names = [...characterAttacks, ...monsterAttacks].filter((n): n is string => !!n);
  return Array.from(new Set(names));
}
