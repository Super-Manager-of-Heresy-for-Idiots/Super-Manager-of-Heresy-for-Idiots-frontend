/**
 * Pure combat-targeting helpers shared by the unified tactical workspace tabs.
 * No React: target filtering and attack-option extraction are derived from the
 * core current-turn detail, never from map-side data.
 */

import type { BattleCombatantResponse, CombatantTurnResponse } from '@/types';
import type { Lang } from '@/i18n/translations';
import { localizedName } from '@/lib/localized';
import type { TacticalTokenView } from '../tacticalView';

export interface AttackOption {
  name: string;
  damage?: string | null;
  damageType?: string | null;
}

/** Grid positions + melee-threat flag fed to the core range gate (Phase 2.5). */
export interface RangeFields {
  attackerCol?: number;
  attackerRow?: number;
  targetCol?: number;
  targetRow?: number;
  attackerInMeleeThreat?: boolean;
  attackerElevationFt?: number;
  targetElevationFt?: number;
}

/**
 * Derive the range fields for an attack from the placed tokens: attacker & target grid squares,
 * and whether an opposing combatant stands within one square of the attacker (ranged-in-melee).
 * Returns {} when either token is unplaced — the server then skips the range gate.
 */
export function buildRangeFields(
  tokens: TacticalTokenView[],
  attackerCombatantId: string | null | undefined,
  targetCombatantId: string,
): RangeFields {
  if (!attackerCombatantId) return {};
  const atk = tokens.find((tk) => tk.linkedCombatantId === attackerCombatantId);
  const tgt = tokens.find((tk) => tk.linkedCombatantId === targetCombatantId);
  if (!atk || !tgt) return {};
  const atkType = atk.combatant?.type;
  const inMelee =
    !!atkType &&
    tokens.some(
      (tk) =>
        !!tk.linkedCombatantId &&
        tk.linkedCombatantId !== attackerCombatantId &&
        !!tk.combatant?.type &&
        tk.combatant.type !== atkType &&
        (tk.combatant.currentHp == null || tk.combatant.currentHp > 0) &&
        Math.max(Math.abs(tk.gridX - atk.gridX), Math.abs(tk.gridY - atk.gridY)) <= 1,
    );
  return {
    attackerCol: atk.gridX,
    attackerRow: atk.gridY,
    targetCol: tgt.gridX,
    targetRow: tgt.gridY,
    attackerInMeleeThreat: inMelee,
    // 3D distance (Phase 2.13): elevations let the range gate account for flying targets.
    attackerElevationFt: atk.elevationFt,
    targetElevationFt: tgt.elevationFt,
  };
}

/**
 * Valid attack targets for `attacker`: the opposing side only (characters strike
 * monsters and vice versa), excluding downed combatants — same rule the core
 * `/battle` screen uses so a GM-driven monster never defaults to another monster.
 */
export function liveTargets(
  combatants: BattleCombatantResponse[],
  attacker: BattleCombatantResponse,
): BattleCombatantResponse[] {
  return combatants.filter(
    (c) =>
      c.id !== attacker.id &&
      c.type !== attacker.type &&
      (c.currentHp == null || c.currentHp > 0),
  );
}

/**
 * The name to show for a combatant (Phase 2.10): the GM always sees the real name; players see the
 * generic public label when the monster's identity is hidden.
 */
export function combatantLabel(c: BattleCombatantResponse, isGm: boolean): string {
  if (!isGm && c.identityHidden) return c.publicName ?? '???';
  return c.displayName;
}

/** A character's attacks from the current-turn detail. */
export function characterAttackOptions(
  turn: CombatantTurnResponse | null | undefined,
): AttackOption[] {
  return (turn?.character?.attacks ?? []).map((a) => ({
    name: a.name,
    damage: a.damage,
    damageType: a.damageType,
  }));
}

/** A monster's attack-typed features from the current-turn detail. */
export function monsterAttackOptions(
  turn: CombatantTurnResponse | null | undefined,
  lang: Lang,
): AttackOption[] {
  return (turn?.monster?.features ?? [])
    .filter((f) => f.attackType)
    .map((f) => ({
      name: localizedName(f, lang),
      damage: f.damages?.[0]?.dice ?? null,
      damageType: localizedName(f.damages?.[0]?.damageType, lang) || null,
    }));
}
