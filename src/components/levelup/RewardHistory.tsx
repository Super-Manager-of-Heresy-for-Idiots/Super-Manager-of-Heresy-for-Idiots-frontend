import { Panel, PanelHeader, Chip, Rune, Divider } from '@/components/ao';
import { formatDate } from '@/lib/ao-utils';
import { useAcquiredRewards } from '@/hooks/useLevelUp';
import type { AcquiredReward } from '@/types';

const rewardTypeTone: Record<string, 'gold' | 'arcane' | 'ember' | 'muted'> = {
  FEAT: 'gold',
  SUBCLASS: 'arcane',
  SKILL: 'ember',
};

interface RewardHistoryProps {
  characterId: string;
}

export function RewardHistory({ characterId }: RewardHistoryProps) {
  const { data: rewards, isLoading } = useAcquiredRewards(characterId);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ao-skeleton" style={{ height: 48, width: '100%' }} />
        ))}
      </div>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)' }}>
        <Rune kind="scroll" size={32} color="var(--ink-faint)" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 14 }}>No acquired rewards yet.</p>
      </div>
    );
  }

  // Group by class entry
  const grouped = new Map<string, AcquiredReward[]>();
  for (const reward of rewards) {
    const key = `${reward.classEntry.className} Lv.${reward.classEntry.classLevel}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(reward);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from(grouped.entries()).map(([classKey, classRewards]) => (
        <Panel key={classKey} inset padding={16}>
          <div className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 10 }}>
            {classKey}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classRewards.map((ar) => (
              <div
                key={ar.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rune kind="diamond-fill" size={12} color="var(--gold)" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ar.reward.name}</span>
                  <Chip tone={rewardTypeTone[ar.rewardType] || 'muted'} style={{ fontSize: 10 }}>
                    {ar.rewardType}
                  </Chip>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {formatDate(ar.acquiredAt)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
