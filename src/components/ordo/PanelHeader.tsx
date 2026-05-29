import type { ReactNode } from 'react';
import { Rune } from './Rune';

interface PanelHeaderProps {
  title: string;
  sub?: string;
  glyph?: string;
  right?: ReactNode;
  tone?: 'gold' | 'arcane' | 'ember';
}

const toneColors: Record<string, string> = {
  gold: 'var(--gold)',
  arcane: 'var(--arcane)',
  ember: 'var(--ember)',
};

export function PanelHeader({
  title,
  sub,
  glyph,
  right,
  tone = 'gold',
}: PanelHeaderProps) {
  const accentColor = toneColors[tone];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--rule)',
        background: 'var(--abyss)',
      }}
    >
      {glyph && <Rune kind={glyph} size={18} color={accentColor} />}
      <div style={{ flex: 1 }}>
        <div
          className="ao-engraved"
          style={{ fontSize: 'var(--t-micro)', color: accentColor }}
        >
          {title}
        </div>
        {sub && (
          <div
            className="ao-italic"
            style={{ fontSize: 'var(--t-micro)', marginTop: 2 }}
          >
            {sub}
          </div>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
