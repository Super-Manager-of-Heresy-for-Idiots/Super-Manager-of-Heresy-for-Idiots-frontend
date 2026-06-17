// ============================================================
// Character Wizard — content reward selection model & validation
// (Phase 5). Pure logic, no JSX.
//
// The wizard stores level-1 content reward picks as a flat map:
//   groupKey -> selected option ids
// (see WizardChar.contentRewardSelections). These helpers validate those picks
// against the class detail's reward groups: chooseMin / chooseMax rules, and
// surface which groups still need a decision so the step can gate "Next".
//
// Child choices (which skills/abilities/spells inside a granted option) are a
// commit-time concern (Phase 6–7); this module covers the read-flow gating.
// ============================================================
import {
  isContentGroupSatisfied,
  isContentRewardGroup,
  rewardGroupChoose,
  rewardGroupKey,
} from '@/lib/contentAdapters';
import type { RewardGroup } from '@/types';

/** Content-shaped (grants/options payload) reward groups that need rendering/validation. */
export function contentRewardGroupsOf(groups: RewardGroup[] | undefined): RewardGroup[] {
  return (groups ?? []).filter(isContentRewardGroup);
}

export interface RewardGroupStatus {
  group: RewardGroup;
  key: string;
  /** Effective choose-min / choose-max for this group's options. */
  min: number;
  max: number;
  selectedCount: number;
  satisfied: boolean;
}

/** Per-group selection status for the given selections map (groupKey -> optionIds). */
export function rewardGroupStatuses(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
): RewardGroupStatus[] {
  return contentRewardGroupsOf(groups).map((group) => {
    const key = rewardGroupKey(group);
    const selected = selections[key] ?? [];
    const { min, max } = rewardGroupChoose(group);
    return {
      group,
      key,
      min,
      max,
      selectedCount: selected.length,
      satisfied: isContentGroupSatisfied(group, selected),
    };
  });
}

/** True when every required reward group has a valid selection. */
export function rewardSelectionsComplete(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
): boolean {
  return rewardGroupStatuses(groups, selections).every((s) => s.satisfied);
}

/** Number of reward groups still missing a required selection. */
export function unsatisfiedRewardCount(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
): number {
  return rewardGroupStatuses(groups, selections).filter((s) => !s.satisfied).length;
}

/**
 * Whether an option can still be toggled ON given current picks. Used to disable
 * extra options once chooseMax is reached (single-choice groups always allow swap).
 */
export function isOptionSelectable(
  group: RewardGroup,
  selectedOptionIds: string[],
  optionId: string,
): boolean {
  if (selectedOptionIds.includes(optionId)) return true; // can always toggle off
  const { max } = rewardGroupChoose(group);
  if (max <= 1) return true; // radio: selecting swaps the single pick
  return selectedOptionIds.length < max;
}
