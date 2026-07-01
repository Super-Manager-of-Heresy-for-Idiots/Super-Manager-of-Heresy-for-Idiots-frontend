import type { BuffDebuffResponse } from '@/types';

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function effectNature(effect: BuffDebuffResponse): string {
  return effect.isBuff ? 'Buff' : 'Debuff';
}

export function effectSummary(effect: BuffDebuffResponse): string {
  const parts: string[] = [];
  if (effect.effectType) parts.push(effect.effectType);
  if (effect.modifierValue != null) {
    parts.push(`${signed(effect.modifierValue)}${effect.targetStatName ? ` ${effect.targetStatName}` : ''}`);
  }
  if (effect.durationRounds != null) parts.push(`${effect.durationRounds} rounds`);
  return parts.join(' · ');
}
