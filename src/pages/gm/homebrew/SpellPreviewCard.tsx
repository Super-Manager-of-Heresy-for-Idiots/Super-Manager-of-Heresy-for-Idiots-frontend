import { SpellCardView, type SpellCardModel } from '@/components/spells/SpellCardView';
import { castingTimeText, rangeText, durationText, areaText } from '@/lib/spellDisplay';

export interface SpellPreviewInput {
  name: string;
  level: number;
  schoolName?: string;
  castingActionSlug?: string;
  castingTimeAmount?: number;
  castingTimeUnit?: string;
  reactionTriggerName?: string;
  ritual?: boolean;
  rangeType?: string;
  rangeDistance?: number;
  durationType?: string;
  durationAmount?: number;
  durationUnit?: string;
  concentration?: boolean;
  areaShape?: string;
  areaSizeFt?: number;
  zonePersists?: boolean;
  hasDamage?: boolean;
  damageDice?: string;
  damageTypeName?: string;
  saveAbility?: string;
  requiresAttackHit?: boolean;
  hasHealing?: boolean;
  healingFormula?: string;
  description?: string;
  higherLevels?: string;
  unnamedLabel: string;
}

/**
 * Живое превью карточки заклинания в конструкторе (HB_UX Фаза 6). Строит {@link SpellCardModel} из состояния
 * формы (строки каста/дистанции/длительности/области ГЕНЕРИРУЮТСЯ теми же функциями, что зеркалят сервер) и
 * рендерит ТОТ ЖЕ {@link SpellCardView}, что и лист персонажа — поэтому превью визуально идентично игре.
 */
export function SpellPreviewCard(input: SpellPreviewInput) {
  const isReaction = input.castingActionSlug === 'reaction';
  const model: SpellCardModel = {
    name: input.name.trim() || input.unnamedLabel,
    source: 'HOMEBREW',
    level: input.level,
    schoolName: input.schoolName,
    castingTime: castingTimeText(input),
    reactionNote: isReaction ? input.reactionTriggerName : undefined,
    range: rangeText(input),
    duration: durationText(input),
    area: input.areaShape ? areaText(input) : undefined,
    concentration: input.concentration,
    ritual: input.ritual,
    saveAbility: input.saveAbility || undefined,
    attackRoll: input.requiresAttackHit,
    damage: input.hasDamage && input.damageDice
      ? [{ dice: input.damageDice, damageTypeName: input.damageTypeName }]
      : [],
    healing: input.hasHealing && input.healingFormula ? [{ dice: input.healingFormula }] : [],
    description: input.description?.trim() || undefined,
    higherLevels: input.higherLevels?.trim() || undefined,
  };
  return <SpellCardView model={model} />;
}
