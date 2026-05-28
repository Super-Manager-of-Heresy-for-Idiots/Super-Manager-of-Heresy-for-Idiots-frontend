import { useNavigate } from 'react-router-dom';
import { Panel, Button, Rune, Sigil } from '@/components/ao';

interface LevelUpBannerProps {
  characterId: string;
  currentLevel: number;
}

export function LevelUpBanner({ characterId, currentLevel }: LevelUpBannerProps) {
  const navigate = useNavigate();

  return (
    <Panel
      frame
      className="ao-breathe"
      style={{
        background: 'linear-gradient(135deg, var(--gold-dim) 0%, var(--panel) 50%, var(--gold-dim) 100%)',
        textAlign: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.15 }}>
        <Sigil size={80} />
      </div>
      <Rune kind="sigil-2" size={32} color="var(--gold)" style={{ marginBottom: 8 }} />
      <div className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 4 }}>
        Rite of Ascent Available
      </div>
      <div className="ao-h4" style={{ margin: '0 0 4px' }}>
        Level {currentLevel} &rarr; {currentLevel + 1}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>
        Your character has earned enough experience to advance.
      </p>
      <Button
        variant="primary"
        icon={<Rune kind="arrow-up" size={14} />}
        onClick={() => navigate(`/characters/${characterId}/level-up`)}
      >
        Begin Ascent
      </Button>
    </Panel>
  );
}
