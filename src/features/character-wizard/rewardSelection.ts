import {
  isContentGroupSatisfied,
  isContentRewardGroup,
  rewardGroupChoose,
  rewardGroupKey,
} from '@/lib/contentAdapters';
import {
  groupComplete,
  type ChildSelections,
} from '@/pages/gm/campaigns/contentLevelUp';
import type { RewardGroup } from '@/types';

/** Content-shaped reward groups that need rendering/validation. */
export function contentRewardGroupsOf(groups: RewardGroup[] | undefined): RewardGroup[] {
  return (groups ?? []).filter(isContentRewardGroup);
}

/** Initial character creation only commits level-1 reward groups. */
export function initialContentRewardGroupsOf(groups: RewardGroup[] | undefined): RewardGroup[] {
  return contentRewardGroupsOf(groups).filter((group) => (group.classLevel ?? 1) === 1);
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

/** True when every required reward group has a valid option selection. */
export function rewardSelectionsComplete(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
): boolean {
  return rewardGroupStatuses(groups, selections).every((s) => s.satisfied);
}

/** True when every level-1 group has valid option and child selections. */
export function initialRewardSelectionsComplete(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
  childSelections: ChildSelections,
): boolean {
  return initialContentRewardGroupsOf(groups)
    .every((group) => groupComplete(group, selections[rewardGroupKey(group)] ?? [], childSelections));
}

/** Number of reward groups still missing a required option selection. */
export function unsatisfiedRewardCount(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
): number {
  return rewardGroupStatuses(groups, selections).filter((s) => !s.satisfied).length;
}

/** Number of level-1 groups still missing required option or child selections. */
export function initialUnsatisfiedRewardCount(
  groups: RewardGroup[] | undefined,
  selections: Record<string, string[]>,
  childSelections: ChildSelections,
): number {
  return initialContentRewardGroupsOf(groups)
    .filter((group) => !groupComplete(group, selections[rewardGroupKey(group)] ?? [], childSelections))
    .length;
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
  if (selectedOptionIds.includes(optionId)) return true;
  const { max } = rewardGroupChoose(group);
  if (max <= 1) return true;
  return selectedOptionIds.length < max;
}
