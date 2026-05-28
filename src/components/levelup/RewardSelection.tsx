import { Panel, PanelHeader, Rune, Chip, Divider } from '@/components/ao';
import type { RewardGroup, Reward } from '@/types';

interface RewardSelectionProps {
  rewardGroups: RewardGroup[];
  selectedRewardIds: Set<string>;
  onToggleReward: (rewardId: string, groupIndex: number) => void;
}

const rewardTypeTone: Record<string, 'gold' | 'arcane' | 'ember' | 'muted'> = {
  FEAT: 'gold',
  SUBCLASS: 'arcane',
  SKILL: 'ember',
};

export function RewardSelection({ rewardGroups, selectedRewardIds, onToggleReward }: RewardSelectionProps) {
  if (rewardGroups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)' }}>
        <Rune kind="check" size={32} color="var(--gold)" style={{ marginBottom: 8 }} />
        <div className="ao-h4">No Choices Required</div>
        <p style={{ fontSize: 13 }}>All rewards at this level are granted automatically.</p>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader title="Select Rewards" glyph="sigil-2" tone="gold" />
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: '8px 0 20px' }}>
        Some rewards are granted automatically. For others, you must choose.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rewardGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Chip tone={rewardTypeTone[group.rewardType] || 'muted'}>
                {group.rewardType}
              </Chip>
              {group.isChoice ? (
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                  — Choose one
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                  — Granted automatically
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {group.rewards.map((reward) => {
                const isSelected = selectedRewardIds.has(reward.id);
                const isAutomatic = !group.isChoice;

                return (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    isSelected={isSelected}
                    isAutomatic={isAutomatic}
                    onClick={group.isChoice ? () => onToggleReward(reward.id, groupIdx) : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RewardCardProps {
  reward: Reward;
  isSelected: boolean;
  isAutomatic: boolean;
  onClick?: () => void;
}

function RewardCard({ reward, isSelected, isAutomatic, onClick }: RewardCardProps) {
  return (
    <Panel
      frame={isSelected || isAutomatic}
      inset={!isSelected && !isAutomatic}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderColor: isSelected ? 'var(--gold)' : isAutomatic ? 'var(--arcane)' : undefined,
        background: isSelected ? 'var(--gold-dim)' : isAutomatic ? 'rgba(var(--arcane-rgb, 138,96,208), 0.05)' : undefined,
        opacity: isAutomatic ? 0.85 : 1,
      }}
      padding={16}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{reward.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.4 }}>
            {reward.description}
          </div>
        </div>
        {isSelected && <Rune kind="check" size={16} color="var(--gold)" />}
        {isAutomatic && <Rune kind="check" size={16} color="var(--arcane)" />}
      </div>
    </Panel>
  );
}
