/**
 * Pure combat-targeting helpers shared by the unified tactical workspace tabs.
 * No React: target filtering and attack-option extraction are derived from the
 * core current-turn detail, never from map-side data.
 */

import type { BattleCombatantResponse, CombatantTurnResponse } from '@/types';

export interface AttackOption {
  name: string;
  damage?: string | null;
  damageType?: string | null;
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
): AttackOption[] {
  return (turn?.monster?.features ?? [])
    .filter((f) => f.attackType)
    .map((f) => ({
      name: f.nameRusloc,
      damage: f.damages?.[0]?.dice ?? null,
      damageType: f.damages?.[0]?.damageType?.nameRusloc ?? null,
    }));
}
