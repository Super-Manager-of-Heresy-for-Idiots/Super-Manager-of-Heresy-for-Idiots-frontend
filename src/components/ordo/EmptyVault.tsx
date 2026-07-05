import type { ReactNode } from 'react';
import { Sigil } from './Sigil';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import type { GlyphKind } from './Rune';
import { entityIconForGlyph } from './entityIcons';

interface EmptyVaultProps {
  glyph?: GlyphKind;
  icon?: OrdoInterfaceIconKey;
  overline?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyVault({ glyph = 'sigil-1', icon, overline, title, body, action }: EmptyVaultProps) {
  const interfaceIcon = icon ?? entityIconForGlyph(glyph) ?? 'empty-state';

  return (
    <div className="ao-empty">
      {interfaceIcon ? (
        <OrdoInterfaceIcon icon={interfaceIcon} size={56} style={{ color: 'var(--ink-faint)' }} />
      ) : (
        <Sigil size={56} glyph={glyph} color="var(--ink-faint)" />
      )}
      {overline && <div className="ao-overline ao-empty-overline">{overline}</div>}
      <div className="ao-h5 ao-empty-title">{title}</div>
      {body && <div className="ao-italic ao-empty-body">{body}</div>}
      {action && <div className="ao-empty-action">{action}</div>}
    </div>
  );
}
