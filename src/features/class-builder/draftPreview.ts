// Best-effort adapter: ClassWriteRequest draft graph -> read-model RewardGroup[]
// so the builder can preview reward groups with the real player component
// (RewardGroupView). Resolves ids/keys to display names where possible.
import type {
  ClassWriteRequest,
  ContentLabel,
  ContentRewardGrant,
  ContentRewardOption,
  GrantInput,
  RewardGroup,
  RewardGroupInput,
} from '@/types';
import type { RefOption } from './refData';

export interface PreviewCtx {
  abilities: RefOption[];
  skills: RefOption[];
  feats: RefOption[];
  spells: RefOption[];
  subclasses: { id?: string; key?: string; name: string }[];
  features: { id?: string; key?: string; title: string }[];
}

const byId = (list: RefOption[], id?: string): string | undefined => list.find((o) => o.id === id)?.name;
const label = (id: string, name: string): ContentLabel => ({ id, name });
const labelsFrom = (list: RefOption[], ids?: string[]): ContentLabel[] =>
  (ids ?? []).map((id) => label(id, byId(list, id) ?? id));

function grantToContent(grant: GrantInput, idx: number, ctx: PreviewCtx): ContentRewardGrant {
  const base: ContentRewardGrant = {
    id: grant.id ?? `g-${idx}`,
    grantType: grant.grantType,
    label: grant.label,
    description: grant.description,
    sortOrder: grant.sortOrder,
  };
  const p = grant.payload as Record<string, unknown>;
  switch (grant.grantType) {
    case 'FEATURE': {
      const inline = p.inline as { title?: string; description?: string } | undefined;
      const refTitle = ctx.features.find((f) => (f.key && f.key === p.featureKey) || (f.id && f.id === p.featureId))?.title;
      const title = inline?.title || refTitle || grant.label || 'Умение';
      return { ...base, feature: { id: base.id, level: 0, title, description: inline?.description } };
    }
    case 'SUBCLASS': {
      const name = ctx.subclasses.find((s) => (s.key && s.key === p.subclassKey) || (s.id && s.id === p.subclassId))?.name
        || grant.label || 'Сабкласс';
      return { ...base, subclass: label(String(p.subclassId ?? p.subclassKey ?? base.id), name) };
    }
    case 'FEAT': {
      if (p.mode === 'ANY') return { ...base, label: grant.label || 'Черта на выбор', chooseCount: Number(p.chooseCount) || 1 };
      const inlineFeat = p.inlineFeat as { name?: string } | undefined;
      const name = byId(ctx.feats, p.featId as string) || inlineFeat?.name || grant.label || 'Черта';
      return { ...base, feat: label(String(p.featId ?? base.id), name) };
    }
    case 'SPELL':
      return { ...base, spellLevel: p.spellLevel as number | undefined, chooseCount: Number(p.chooseCount) || undefined };
    case 'SKILL_PROFICIENCY': {
      if (p.mode === 'FIXED' && Array.isArray(p.skillIds) && p.skillIds.length === 1) {
        return { ...base, fixedSkill: labelsFrom(ctx.skills, p.skillIds as string[])[0] };
      }
      return {
        ...base,
        anySkill: p.mode === 'ANY',
        skillOptions: labelsFrom(ctx.skills, p.skillOptionIds as string[]),
        chooseCount: Number(p.chooseCount) || 1,
      };
    }
    case 'ABILITY_SCORE':
      return {
        ...base,
        abilityOptions: labelsFrom(ctx.abilities, p.abilityOptionIds as string[]),
        bonusPerChoice: p.bonusPerChoice as number | undefined,
        chooseCount: p.chooseCount as number | undefined,
        totalBonus: p.totalBonus as number | undefined,
        maxPerAbility: p.maxPerAbility as number | undefined,
        maxScore: p.maxScore as number | undefined,
      };
    case 'NUMERIC_MODIFIER':
      return {
        ...base,
        modifierKey: p.modifierKey as string | undefined,
        amount: p.amount as number | undefined,
        unitText: p.unitText as string | undefined,
        durationText: p.durationText as string | undefined,
      };
    default:
      return { ...base, title: p.title as string | undefined, body: p.body as string | undefined };
  }
}

function optionToContent(option: RewardGroupInput['options'][number], ctx: PreviewCtx): ContentRewardOption {
  return {
    id: option.id ?? option.key ?? option.optionKey,
    optionKey: option.optionKey,
    label: option.label || option.optionKey,
    labelRu: option.labelRu,
    labelEn: option.labelEn,
    description: option.description,
    recommended: option.recommended,
    sortOrder: option.sortOrder,
    grants: option.grants.map((g, i) => grantToContent(g, i, ctx)),
  };
}

export function draftGroupToRewardGroup(group: RewardGroupInput, ctx: PreviewCtx): RewardGroup {
  const key = group.id ?? group.key ?? `lvl${group.classLevel}`;
  return {
    id: key,
    classLevel: group.classLevel,
    groupKind: group.groupKind,
    prompt: group.prompt,
    description: group.description,
    chooseMin: group.chooseMin,
    chooseMax: group.chooseMax,
    repeatable: group.repeatable,
    sortOrder: group.sortOrder,
    groupKey: key,
    grants: group.grants.map((g, i) => grantToContent(g, i, ctx)),
    options: group.groupKind === 'AUTO' ? [] : group.options.map((o) => optionToContent(o, ctx)),
  };
}

export function draftToRewardGroups(draft: ClassWriteRequest, ctx: PreviewCtx): RewardGroup[] {
  return [...draft.rewardGroups]
    .sort((a, b) => a.classLevel - b.classLevel || a.sortOrder - b.sortOrder)
    .map((g) => draftGroupToRewardGroup(g, ctx));
}
