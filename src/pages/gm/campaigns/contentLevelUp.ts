// ============================================================
// Level-up — content reward selection model, validation & request builder
// (Phase 7). Pure logic, no JSX.
//
// Assembles the final ContentLevelUpRequest from:
//   - option selections per group (groupKey -> optionIds), and
//   - typed-grant child selections (grantId -> abilities/skills/spells).
// ============================================================
import { isContentRewardGroup, rewardGroupChoose, rewardGroupKey } from '@/lib/contentAdapters';
import { grantKind } from '@/components/content-rewards/grants';
import type {
  ContentLevelUpRequest,
  ContentRewardGrant,
  ContentRewardSelection,
  RewardGroup,
} from '@/types';

/** Per-grant child picks (which abilities/skills/spells inside a chosen grant). */
export interface GrantChildSelection {
  /** abilityScoreId -> bonus amount. */
  abilities?: Record<string, number>;
  /** chosen skillIds. */
  skills?: string[];
  /** chosen spellIds. */
  spells?: string[];
}

/** groupKey -> selected option ids. */
export type OptionSelections = Record<string, string[]>;
/** grantId -> child selection. */
export type ChildSelections = Record<string, GrantChildSelection>;

/** Total ability bonus an ABILITY_SCORE grant must distribute. */
export function abilityTotalRequired(grant: ContentRewardGrant): number {
  return grant.totalBonus ?? (grant.chooseCount ?? 1) * (grant.bonusPerChoice ?? 1);
}

/** Whether a grant needs a per-grant child decision (ability / skill / spell pick). */
export function grantNeedsChild(grant: ContentRewardGrant): boolean {
  switch (grantKind(grant.grantType)) {
    case 'ABILITY':
      return (grant.abilityOptions?.length ?? 0) > 0;
    case 'SKILL':
      // Only when there's a concrete candidate list to pick from on the client.
      return !grant.fixedSkill && (grant.skillOptions?.length ?? 0) > 0;
    // SPELL grants carry no candidate list on the client — spell picks stay a
    // manual / dedicated-spell-step concern, not an inline grant child.
    default:
      return false;
  }
}

/** Whether a grant's child selection is complete/valid. */
export function grantChildSatisfied(grant: ContentRewardGrant, child?: GrantChildSelection): boolean {
  if (!grantNeedsChild(grant)) return true;
  switch (grantKind(grant.grantType)) {
    case 'ABILITY': {
      const points = Object.values(child?.abilities ?? {});
      const total = points.reduce((sum, v) => sum + v, 0);
      if (total !== abilityTotalRequired(grant)) return false;
      const maxPer = grant.maxPerAbility ?? grant.bonusPerChoice ?? total;
      return points.every((v) => v >= 0 && v <= maxPer);
    }
    case 'SKILL':
      return (child?.skills?.length ?? 0) === (grant.chooseCount ?? 1);
    case 'SPELL':
      return (child?.spells?.length ?? 0) === (grant.chooseCount ?? 1);
    default:
      return true;
  }
}

/** Grants in effect for a group given the currently-selected options (direct + option grants). */
export function activeGrants(group: RewardGroup, optionIds: string[]): ContentRewardGrant[] {
  const direct = group.grants ?? [];
  const fromOptions = (group.options ?? [])
    .filter((o) => optionIds.includes(o.id))
    .flatMap((o) => o.grants ?? []);
  return [...direct, ...fromOptions];
}

/** Whether one group's option rule and all active child choices are satisfied. */
export function groupComplete(
  group: RewardGroup,
  optionIds: string[],
  child: ChildSelections,
): boolean {
  if ((group.options?.length ?? 0) > 0) {
    const { min, max } = rewardGroupChoose(group);
    if (optionIds.length < min) return false;
    if (max > 0 && optionIds.length > max) return false;
  }
  return activeGrants(group, optionIds).every((g) => grantChildSatisfied(g, child[g.id]));
}

/** Whether every content reward group is fully resolved. */
export function contentLevelUpComplete(
  groups: RewardGroup[],
  options: OptionSelections,
  child: ChildSelections,
): boolean {
  return groups
    .filter(isContentRewardGroup)
    .every((g) => groupComplete(g, options[rewardGroupKey(g)] ?? [], child));
}

type ChildPayload = Pick<
  ContentRewardSelection,
  'abilityScoreSelections' | 'skillSelections' | 'spellSelections'
>;

function collectChild(grants: ContentRewardGrant[], child: ChildSelections): ChildPayload {
  const abilityScoreSelections: NonNullable<ContentRewardSelection['abilityScoreSelections']> = [];
  const skillSelections: NonNullable<ContentRewardSelection['skillSelections']> = [];
  const spellSelections: NonNullable<ContentRewardSelection['spellSelections']> = [];
  for (const g of grants) {
    const c = child[g.id];
    if (!c) continue;
    if (c.abilities) {
      for (const [abilityScoreId, bonusAmount] of Object.entries(c.abilities)) {
        if (bonusAmount > 0) abilityScoreSelections.push({ grantId: g.id, abilityScoreId, bonusAmount });
      }
    }
    if (c.skills) for (const skillId of c.skills) skillSelections.push({ grantId: g.id, skillId });
    if (c.spells) for (const spellId of c.spells) spellSelections.push({ grantId: g.id, spellId });
  }
  return {
    abilityScoreSelections: abilityScoreSelections.length ? abilityScoreSelections : undefined,
    skillSelections: skillSelections.length ? skillSelections : undefined,
    spellSelections: spellSelections.length ? spellSelections : undefined,
  };
}

/** Builds the final ContentLevelUpRequest from option + child selections. */
export function buildContentLevelUpRequest(
  classId: string,
  groups: RewardGroup[],
  options: OptionSelections,
  child: ChildSelections,
): ContentLevelUpRequest {
  const rewardSelections: ContentRewardSelection[] = [];
  for (const g of groups.filter(isContentRewardGroup)) {
    const groupId = g.id;
    if (!groupId) continue;
    const optionIds = options[rewardGroupKey(g)] ?? [];
    if ((g.options?.length ?? 0) > 0) {
      for (const optId of optionIds) {
        const opt = g.options!.find((o) => o.id === optId);
        rewardSelections.push({ groupId, optionId: optId, ...collectChild(opt?.grants ?? [], child) });
      }
    } else {
      const payload = collectChild(g.grants ?? [], child);
      if (payload.abilityScoreSelections || payload.skillSelections || payload.spellSelections) {
        rewardSelections.push({ groupId, ...payload });
      }
    }
  }
  return { classId, rewardSelections };
}
