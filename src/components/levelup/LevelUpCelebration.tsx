import { Panel, Button, Rune, Sigil, Divider, Chip } from '@/components/ao';
import type { LevelUpClassOption, Reward } from '@/types';

interface LevelUpCelebrationProps {
  selectedClass: LevelUpClassOption;
  newTotalLevel: number;
  allRewards: Reward[];
  onReturn: () => void;
}

export function LevelUpCelebration({
  selectedClass,
  newTotalLevel,
  allRewards,
  onReturn,
}: LevelUpCelebrationProps) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <Panel frame padding={40}>
        <div className="ao-breathe" style={{ marginBottom: 16 }}>
          <Sigil size={72} />
        </div>

        <div className="ao-overline ao-flicker" style={{ color: 'var(--gold)', marginBottom: 4 }}>
          Ascension Complete
        </div>
        <div className="ao-h2" style={{ margin: '0 0 8px', color: 'var(--gold)' }}>
          Level {newTotalLevel}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
          {selectedClass.className} — Class Level {selectedClass.newClassLevel}
        </div>

        {allRewards.length > 0 && (
          <>
            <Divider />
            <div className="ao-overline" style={{ color: 'var(--ink-muted)', margin: '16px 0 12px' }}>
              Acquired Rites
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {allRewards.map((r) => (
                <Chip key={r.id} tone="gold" glyph="diamond-fill">
                  {r.name}
                </Chip>
              ))}
            </div>
          </>
        )}

        <Divider />

        <Button
          variant="primary"
          onClick={onReturn}
          icon={<Rune kind="arrow-l" size={14} />}
          style={{ marginTop: 20 }}
        >
          Return to Folio
        </Button>
      </Panel>
    </div>
  );
}
