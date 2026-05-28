import { Panel, PanelHeader, Rune, Chip, Button, Divider } from '@/components/ao';
import type { LevelUpClassOption } from '@/types';

interface ClassSelectionProps {
  classes: LevelUpClassOption[];
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
}

export function ClassSelection({ classes, selectedClassId, onSelect }: ClassSelectionProps) {
  return (
    <div>
      <PanelHeader title="Choose Your Path" glyph="sigil-1" tone="gold" />
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: '8px 0 20px' }}>
        Select a class to advance. You may continue with an existing class or begin a new one.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.classId;
          return (
            <Panel
              key={cls.classId}
              frame
              className={isSelected ? '' : 'ao-rise'}
              onClick={() => onSelect(cls.classId)}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--gold)' : undefined,
                background: isSelected ? 'var(--gold-dim)' : undefined,
              }}
              padding={20}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="ao-h4" style={{ margin: 0 }}>{cls.className}</div>
                {cls.isNewClass && <Chip tone="arcane">New Class</Chip>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Chip tone="gold">
                  Lv. {cls.currentClassLevel} &rarr; {cls.newClassLevel}
                </Chip>
              </div>

              {cls.rewardGroups.length > 0 && (
                <>
                  <Divider />
                  <div className="ao-overline" style={{ color: 'var(--ink-muted)', margin: '10px 0 6px' }}>
                    Rewards at this level
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cls.rewardGroups.map((group, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Rune
                          kind={group.isChoice ? 'diamond' : 'check'}
                          size={12}
                          color={group.isChoice ? 'var(--arcane)' : 'var(--gold)'}
                        />
                        <span style={{ color: 'var(--ink)' }}>
                          {group.rewardType}
                          {group.isChoice && ` (choose ${group.rewards.length > 1 ? '1' : ''})`}
                          {!group.isChoice && ` (${group.rewards.length} granted)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {isSelected && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <Rune kind="check" size={20} color="var(--gold)" />
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
