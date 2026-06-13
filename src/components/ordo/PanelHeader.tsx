import type { CSSProperties, ReactNode } from 'react';
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
    <div className="ao-phead" style={{ '--accent': accentColor } as CSSProperties}>
      {glyph && <Rune kind={glyph} size={18} color={accentColor} />}
      <div className="ao-phead-body">
        <div className="ao-engraved ao-phead-title">{title}</div>
        {sub && <div className="ao-italic ao-phead-sub">{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
