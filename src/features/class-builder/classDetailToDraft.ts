// Adapts a saved ContentClassDetailResponse (read model) back into an editable
// ClassDraft so the builder can edit existing classes. Best-effort: maps the
// fields the builder owns; unknown grant payload nuances fall back to CUSTOM_TEXT.
import type {
  CharacterClassDetailResponse,
  ClassWriteRequest,
  ContentRewardGrant,
  GrantInput,
  GrantPayload,
  RewardGroupInput,
  RewardOptionInput,
} from '@/types';
import { emptyDraft } from './classDraft';

function grantToInput(grant: ContentRewardGrant, sortOrder: number): GrantInput {
  const gType = grant.grantType;
  let payload: GrantPayload;
  switch (gType) {
    case 'FEATURE':
      payload = grant.feature
        ? { inline: { title: grant.feature.title, description: grant.feature.description } }
        : { inline: { title: grant.label ?? '' } };
      break;
    case 'SUBCLASS':
      payload = { subclassId: grant.subclass?.id };
      break;
    case 'FEAT':
      payload = grant.feat ? { mode: 'FIXED', featId: grant.feat.id } : { mode: 'ANY', chooseCount: grant.chooseCount ?? 1 };
      break;
    case 'SPELL':
      payload = { mode: 'CHOICE', spellLevel: grant.spellLevel, chooseCount: grant.chooseCount ?? 1 };
      break;
    case 'SKILL_PROFICIENCY':
      payload = grant.fixedSkill
        ? { mode: 'FIXED', skillIds: [grant.fixedSkill.id] }
        : grant.anySkill
          ? { mode: 'ANY', chooseCount: grant.chooseCount ?? 1 }
          : { mode: 'CHOICE', skillOptionIds: (grant.skillOptions ?? []).map((s) => s.id), chooseCount: grant.chooseCount ?? 1 };
      break;
    case 'ABILITY_SCORE':
      payload = {
        abilityOptionIds: (grant.abilityOptions ?? []).map((a) => a.id),
        chooseCount: grant.chooseCount ?? 1,
        bonusPerChoice: grant.bonusPerChoice ?? 1,
        totalBonus: grant.totalBonus,
        maxPerAbility: grant.maxPerAbility,
        maxScore: grant.maxScore,
      };
      break;
    case 'NUMERIC_MODIFIER':
      payload = {
        modifierKey: grant.modifierKey ?? '',
        amount: grant.amount ?? 0,
        unitText: grant.unitText,
        durationText: grant.durationText,
      };
      break;
    default:
      payload = { title: grant.title, body: grant.body };
  }
  return {
    id: grant.id,
    grantType: gType,
    label: grant.label,
    description: grant.description,
    sortOrder,
    payload,
  };
}

export function classDetailToDraft(detail: CharacterClassDetailResponse): ClassWriteRequest {
  const groups: RewardGroupInput[] = (detail.rewardGroups ?? []).map((g, gi) => {
    const options: RewardOptionInput[] = (g.options ?? []).map((o, oi) => ({
      id: o.id,
      optionKey: o.optionKey,
      label: o.label,
      labelRu: o.labelRu,
      labelEn: o.labelEn,
      description: o.description,
      recommended: o.recommended,
      sortOrder: o.sortOrder ?? oi,
      grants: (o.grants ?? []).map((gr, ki) => grantToInput(gr, ki)),
    }));
    return {
      id: g.id,
      classLevel: g.classLevel ?? 1,
      groupKind: g.groupKind ?? (options.length ? 'CHOICE' : 'AUTO'),
      prompt: g.prompt,
      description: g.description,
      chooseMin: g.chooseMin ?? (options.length ? 1 : 0),
      chooseMax: g.chooseMax ?? (options.length ? 1 : 0),
      repeatable: g.repeatable ?? false,
      sortOrder: g.sortOrder ?? gi,
      options,
      grants: (g.grants ?? []).map((gr, ki) => grantToInput(gr, ki)),
    };
  });

  return {
    ...emptyDraft(),
    name: detail.name,
    nameRu: detail.nameRu,
    nameEn: detail.nameEn,
    slug: detail.slug,
    subtitle: detail.subtitle,
    description: detail.description,
    hitDie: detail.hitDie ?? 8,
    primaryAbilityIds: (detail.primaryAbilities ?? []).map((a) => a.id),
    savingThrowIds: (detail.savingThrows ?? []).map((a) => a.id),
    skillChoiceCount: detail.skillChoiceCount ?? 0,
    skillChoiceAny: detail.skillChoiceAny ?? false,
    skillOptionIds: (detail.skillOptions ?? []).map((s) => s.id),
    armorProficiencyText: detail.armorProficiencyText,
    weaponProficiencyText: detail.weaponProficiencyText,
    toolProficiencyText: detail.toolProficiencyText,
    spellcasting: detail.spellcasting?.isSpellcaster
      ? {
          casterProgression: detail.spellcasting.isHalfCaster ? 'HALF' : 'FULL',
          spellcastingAbilityId: detail.spellcasting.spellcastingAbility?.id ?? detail.spellcasting.spellcastingStatId ?? '',
          preparation: 'KNOWN',
          ritualCasting: false,
        }
      : null,
    features: (detail.features ?? []).map((f, i) => ({
      id: f.id,
      level: f.level,
      sortOrder: f.sortOrder ?? i,
      title: f.title,
      description: f.description,
      subclassId: f.subclassId,
    })),
    rewardGroups: groups,
  };
}
