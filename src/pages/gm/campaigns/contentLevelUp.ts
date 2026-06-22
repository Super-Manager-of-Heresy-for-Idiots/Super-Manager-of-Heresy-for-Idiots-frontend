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
  ContentLevelUpChildSelections,
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

/** Whether a SPELL grant is a fixed grant (auto-learned), needing no client pick. */
function isFixedSpellGrant(grant: ContentRewardGrant): boolean {
  if (grant.mode) return grant.mode.toUpperCase() === 'FIXED';
  // Legacy/fixture shape with no mode: a single concrete spell and no choose count.
  return !!grant.spell && !((grant.chooseCount ?? 0) > 0);
}

/** Whether a grant needs a per-grant child decision (ability / skill / spell pick). */
export function grantNeedsChild(grant: ContentRewardGrant): boolean {
  switch (grantKind(grant.grantType)) {
    case 'ABILITY':
      return (grant.abilityOptions?.length ?? 0) > 0 || (grant.abilityOptionIds?.length ?? 0) > 0;
    case 'SKILL':
      // No pick for fixed grants (concrete skill or fixed id-list).
      if (grant.fixedSkill || (grant.skillIds?.length ?? 0) > 0) return false;
      // A pick is needed for ANY mode, or when there's a concrete candidate pool.
      return grant.anySkill === true
        || (grant.skillOptions?.length ?? 0) > 0
        || (grant.skillOptionIds?.length ?? 0) > 0;
    case 'SPELL':
      // CHOICE spell grants need a pick (candidates resolved client-side by level/class).
      return !isFixedSpellGrant(grant) && (grant.chooseCount ?? 1) > 0;
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

function collectChild(grants: ContentRewardGrant[], child: ChildSelections): ContentLevelUpChildSelections | undefined {
  const abilityScores: NonNullable<ContentLevelUpChildSelections['abilityScores']> = [];
  const skillIds: NonNullable<ContentLevelUpChildSelections['skillIds']> = [];
  const spellIds: NonNullable<ContentLevelUpChildSelections['spellIds']> = [];
  for (const g of grants) {
    const c = child[g.id];
    if (!c) continue;
    if (c.abilities) {
      for (const [abilityScoreId, amount] of Object.entries(c.abilities)) {
        if (amount > 0) abilityScores.push({ abilityScoreId, amount });
      }
    }
    if (c.skills) skillIds.push(...c.skills);
    if (c.spells) spellIds.push(...c.spells);
  }
  const payload: ContentLevelUpChildSelections = {};
  if (abilityScores.length) payload.abilityScores = abilityScores;
  if (skillIds.length) payload.skillIds = [...new Set(skillIds)];
  if (spellIds.length) payload.spellIds = [...new Set(spellIds)];
  return Object.keys(payload).length ? payload : undefined;
}

/** Builds the final ContentLevelUpRequest from option + child selections. */
export function buildContentLevelUpRequest(
  classId: string,
  groups: RewardGroup[],
  options: OptionSelections,
  child: ChildSelections,
): ContentLevelUpRequest {
  const selections: ContentLevelUpRequest['selections'] = [];
  for (const g of groups.filter(isContentRewardGroup)) {
    const rewardGroupId = g.id;
    if (!rewardGroupId) continue;
    const optionIds = options[rewardGroupKey(g)] ?? [];
    const hasOptions = (g.options?.length ?? 0) > 0;
    // Child picks come from direct grants plus the grants of any selected option.
    const childSelections = collectChild(activeGrants(g, optionIds), child);
    if (hasOptions) {
      selections.push({
        rewardGroupId,
        optionIds,
        ...(childSelections ? { childSelections } : {}),
      });
    } else if (childSelections) {
      // AUTO group whose direct grants require a pick (e.g. "learn a new cantrip").
      selections.push({ rewardGroupId, optionIds: [], childSelections });
    }
  }
  return { classId, selections };
}
