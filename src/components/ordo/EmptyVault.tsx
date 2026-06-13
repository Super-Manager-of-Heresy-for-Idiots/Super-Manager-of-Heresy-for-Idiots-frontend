import type { ReactNode } from 'react';
import { Sigil } from './Sigil';
import type { GlyphKind } from './Rune';

interface EmptyVaultProps {
  glyph?: GlyphKind;
  overline?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyVault({ glyph = 'sigil-1', overline, title, body, action }: EmptyVaultProps) {
  return (
    <div className="ao-empty">
      <Sigil size={56} glyph={glyph} color="var(--ink-faint)" />
      {overline && <div className="ao-overline ao-empty-overline">{overline}</div>}
      <div className="ao-h5 ao-empty-title">{title}</div>
      {body && <div className="ao-italic ao-empty-body">{body}</div>}
      {action && <div className="ao-empty-action">{action}</div>}
    </div>
  );
}
