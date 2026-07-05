import type { CSSProperties, ReactNode } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import { Rune } from './Rune';
import { entityIconForGlyph } from './entityIcons';

interface PanelHeaderProps {
  title: string;
  sub?: string;
  glyph?: string;
  icon?: OrdoInterfaceIconKey;
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
  icon,
  right,
  tone = 'gold',
}: PanelHeaderProps) {
  const accentColor = toneColors[tone];
  const interfaceIcon = icon ?? entityIconForGlyph(glyph);

  return (
    <div className="ao-phead" style={{ '--accent': accentColor } as CSSProperties}>
      {interfaceIcon ? (
        <OrdoInterfaceIcon icon={interfaceIcon} size={18} style={{ color: accentColor }} />
      ) : glyph ? (
        <Rune kind={glyph} size={18} color={accentColor} />
      ) : null}
      <div className="ao-phead-body">
        <div className="ao-engraved ao-phead-title">{title}</div>
        {sub && <div className="ao-italic ao-phead-sub">{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
