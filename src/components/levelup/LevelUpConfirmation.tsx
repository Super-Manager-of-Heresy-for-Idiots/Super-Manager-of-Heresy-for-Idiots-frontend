import { Panel, PanelHeader, Button, Rune, Chip, Divider, Sigil } from '@/components/ao';
import type { LevelUpClassOption, Reward, RewardGroup } from '@/types';

interface LevelUpConfirmationProps {
  selectedClass: LevelUpClassOption;
  selectedRewards: Reward[];
  automaticRewards: Reward[];
  currentTotalLevel: number;
  newTotalLevel: number;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function LevelUpConfirmation({
  selectedClass,
  selectedRewards,
  automaticRewards,
  currentTotalLevel,
  newTotalLevel,
  onConfirm,
  onBack,
  isSubmitting,
}: LevelUpConfirmationProps) {
  const allRewards = [...automaticRewards, ...selectedRewards];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Panel frame padding={28}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Sigil size={48} />
          <div className="ao-overline" style={{ color: 'var(--gold)', marginTop: 8 }}>
            Seal the Rite
          </div>
          <div className="ao-h3" style={{ margin: '4px 0 0' }}>
            Level {currentTotalLevel} &rarr; {newTotalLevel}
          </div>
        </div>

        <Divider />

        <div style={{ margin: '16px 0' }}>
          <div className="ao-overline" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>Class</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rune kind="sigil-3" size={16} color="var(--gold)" />
            <span style={{ fontWeight: 600 }}>{selectedClass.className}</span>
            <Chip tone="gold">
              Lv. {selectedClass.currentClassLevel} &rarr; {selectedClass.newClassLevel}
            </Chip>
          </div>
        </div>

        <Divider />

        {allRewards.length > 0 && (
          <div style={{ margin: '16px 0' }}>
            <div className="ao-overline" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>
              Rewards ({allRewards.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {automaticRewards.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rune kind="check" size={14} color="var(--arcane)" />
                  <span style={{ fontSize: 13 }}>{r.name}</span>
                  <Chip tone="muted" style={{ fontSize: 10 }}>{r.rewardType}</Chip>
                </div>
              ))}
              {selectedRewards.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rune kind="diamond-fill" size={14} color="var(--gold)" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                  <Chip tone="gold" style={{ fontSize: 10 }}>{r.rewardType}</Chip>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divider />

        <div className="ao-dialog__actions" style={{ marginTop: 20 }}>
          <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isSubmitting}
            icon={isSubmitting ? <Rune kind="sigil-3" size={14} className="ao-spin" /> : <Rune kind="check" size={14} />}
          >
            {isSubmitting ? 'Sealing...' : 'Seal the Rite'}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
