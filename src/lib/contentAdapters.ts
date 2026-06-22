import type {
  AvailableClassOption,
  BackgroundDetail,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ContentLabel,
  ContentRewardGrant,
  LevelUpOptionsResponse,
  ProficiencySkillResponse,
  RewardGroup,
  SpeciesDetail,
  SpellDetail,
  SpellReferenceResponse,
} from '@/types';
import type { Lang } from '@/i18n/translations';

const fallbackText = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

export function rewardGroupKey(group: Pick<RewardGroup, 'id' | 'groupKey' | 'groupKind'>): string {
  return group.groupKey || group.id || group.groupKind || 'group';
}

export function rewardGroupLabel(group: Pick<RewardGroup, 'prompt' | 'groupKind'>): string {
  return fallbackText(group.prompt, group.groupKind || 'REWARD');
}

/**
 * Flattens a single backend grant's nested {@code payload} onto the grant itself (id-lists +
 * scalars). Jackson nests the typed fields under {@code grant.payload} (EXTERNAL_PROPERTY
 * keyed by grantType). Existing top-level values win, so fixtures that already carry the
 * flattened shape (no payload) pass through untouched. Components resolve the ids to labels.
 */
export function normalizeRewardGrant(grant: ContentRewardGrant): ContentRewardGrant {
  const payload = grant.payload;
  if (!payload) return grant;
  const isSkill = (grant.grantType ?? '').toUpperCase().includes('SKILL');
  return {
    ...grant,
    mode: grant.mode ?? payload.mode,
    chooseCount: grant.chooseCount ?? payload.chooseCount,
    bonusPerChoice: grant.bonusPerChoice ?? payload.bonusPerChoice,
    totalBonus: grant.totalBonus ?? payload.totalBonus,
    maxPerAbility: grant.maxPerAbility ?? payload.maxPerAbility,
    maxScore: grant.maxScore ?? payload.maxScore,
    spellLevel: grant.spellLevel ?? payload.spellLevel,
    minLevel: grant.minLevel ?? payload.minLevel,
    maxLevel: grant.maxLevel ?? payload.maxLevel,
    abilityOptionIds: grant.abilityOptionIds ?? payload.abilityOptionIds,
    skillIds: grant.skillIds ?? payload.skillIds,
    skillOptionIds: grant.skillOptionIds ?? payload.skillOptionIds,
    grantsExpertise: grant.grantsExpertise ?? payload.grantsExpertise,
    fixedSpellIds: grant.fixedSpellIds ?? payload.fixedSpellIds,
    schoolIds: grant.schoolIds ?? payload.schoolIds,
    spellListId: grant.spellListId ?? payload.spellListId,
    classSpellListId: grant.classSpellListId ?? payload.classSpellListId,
    allowReplaceOnLevelUp: grant.allowReplaceOnLevelUp ?? payload.allowReplaceOnLevelUp,
    featId: grant.featId ?? payload.featId,
    anySkill: grant.anySkill ?? (isSkill && payload.mode === 'ANY' ? true : undefined),
  };
}

export function normalizeRewardGroup(group: RewardGroup): RewardGroup {
  const optionCount = group.options?.length ?? 0;
  const chooseMax = group.chooseMax ?? (optionCount > 0 ? 1 : 0);

  return {
    ...group,
    grants: (group.grants ?? []).map(normalizeRewardGrant),
    options: (group.options ?? []).map((opt) => ({
      ...opt,
      grants: (opt.grants ?? []).map(normalizeRewardGrant),
    })),
    chooseMin: group.chooseMin ?? (optionCount > 0 ? 1 : 0),
    chooseMax,
    repeatable: group.repeatable ?? false,
    groupKey: rewardGroupKey(group),
  };
}

export function normalizeLevelUpOptions(options: LevelUpOptionsResponse): LevelUpOptionsResponse {
  return {
    ...options,
    availableClasses: options.availableClasses.map(normalizeAvailableClassOption),
  };
}

export function normalizeAvailableClassOption(option: AvailableClassOption): AvailableClassOption {
  return {
    ...option,
    rewardGroups: (option.rewardGroups ?? []).map(normalizeRewardGroup),
  };
}

export function normalizeClassDetail(detail: CharacterClassDetailResponse): CharacterClassDetailResponse {
  return {
    ...detail,
    primaryAbilities: detail.primaryAbilities ?? singleAbility(detail.primaryAbilityStatId),
    savingThrows: detail.savingThrows ?? namesToLabels(detail.savingThrowStatNames),
    skillOptions: detail.skillOptions ?? skillsToLabels(detail.skillChoiceOptions),
    skillChoiceAny: detail.skillChoiceAny ?? false,
    rewardGroups: detail.rewardGroups?.map(normalizeRewardGroup),
    spellcasting: detail.spellcasting
      ? {
          ...detail.spellcasting,
          // The backend emits a non-null spellcasting block ONLY for casters
          // (mapSpellcasting returns null otherwise) and never sets an explicit
          // isSpellcaster flag — the block's presence IS the signal, so default true.
          isSpellcaster: detail.spellcasting.isSpellcaster ?? detail.spellcasting.spellcaster ?? true,
          isHalfCaster: detail.spellcasting.isHalfCaster ?? detail.spellcasting.halfCaster,
        }
      : undefined,
  };
}

function singleAbility(id: string | undefined): ContentLabel[] {
  return id ? [{ id, name: id }] : [];
}

function namesToLabels(names: string[] | undefined): ContentLabel[] {
  return (names ?? []).map((name) => ({ id: name, name }));
}

function skillsToLabels(skills: ProficiencySkillResponse[] | undefined): ContentLabel[] {
  return (skills ?? []).map((skill) => ({ id: skill.id, name: skill.name }));
}

/**
 * Adapts a new-model BackgroundDetail (Content Catalog) to the lightweight
 * BackgroundResponse the character wizard consumes. The legacy reference
 * background endpoints were superseded by the normalized content model, so the
 * wizard now sources backgrounds from the catalog and maps to its existing shape.
 * `grantedExtras` surfaces the 2024 origin feat as the headline "also grants".
 */
export function backgroundDetailToResponse(detail: BackgroundDetail): BackgroundResponse {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description ?? undefined,
    skillProficiencyNames: (detail.skillProficiencies ?? []).map((s) => s.name),
    grantedExtras: detail.grantedFeat?.name ?? undefined,
  };
}

/**
 * Adapts a new-model SpeciesDetail (2024 race replacement) to the lightweight
 * CharacterRaceDetailResponse the character wizard consumes. In the 2024 model
 * ability bonuses and subraces no longer live on the species (bonuses come from
 * Background), so those collapse to empty — the wizard renders them as "—".
 */
export function speciesDetailToRaceResponse(detail: SpeciesDetail): CharacterRaceDetailResponse {
  const walk = detail.speeds.find((s) => s.type === 'walk') ?? detail.speeds[0];
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description ?? undefined,
    speed: walk?.amountFt ?? undefined,
    abilityScoreIncreases: [],
    traits: detail.traits.map((tr) => tr.name).filter((n): n is string => !!n),
    subraces: [],
  };
}

/**
 * Adapts a new-model SpellDetail (Content Catalog) to the wizard's lightweight
 * SpellReferenceResponse. Class availability is flattened to ids so the wizard's
 * client-side per-class filter keeps working.
 */
export function spellDetailToReference(detail: SpellDetail): SpellReferenceResponse {
  return {
    id: detail.id,
    name: detail.name,
    nameEn: detail.nameEn ?? undefined,
    level: detail.level ?? 0,
    school: detail.school?.name ?? undefined,
    description: detail.description ?? undefined,
    availableToClassIds: detail.classes.map((c) => c.id),
  };
}

/** Picks the locale-appropriate name for a content label, falling back to the base name. */
export function localizedName(
  label: Pick<ContentLabel, 'name' | 'nameRu' | 'nameEn'>,
  lang: Lang,
): string {
  const localized = lang === 'ru' ? label.nameRu : label.nameEn;
  return localized?.trim() ? localized : label.name;
}

/** A reward group is "content-shaped" when it carries the new grants/options payload. */
export function isContentRewardGroup(group: Pick<RewardGroup, 'grants' | 'options'>): boolean {
  return (group.grants?.length ?? 0) > 0 || (group.options?.length ?? 0) > 0;
}

/** Resolves the effective choose-min / choose-max for a group's options. */
export function rewardGroupChoose(
  group: Pick<RewardGroup, 'chooseMin' | 'chooseMax' | 'options'>,
): { min: number; max: number } {
  const optionCount = group.options?.length ?? 0;
  const max = group.chooseMax ?? (optionCount > 0 ? 1 : 0);
  const min = group.chooseMin ?? max;
  return { min, max };
}

/** Whether the current option selection satisfies a content group's choose rule. */
export function isContentGroupSatisfied(group: RewardGroup, selectedOptionIds: string[]): boolean {
  const optionCount = group.options?.length ?? 0;
  if (optionCount === 0) return true; // automatic group: direct grants only
  const { min, max } = rewardGroupChoose(group);
  const count = selectedOptionIds.length;
  if (count < min) return false;
  if (max > 0 && count > max) return false;
  return true;
}
