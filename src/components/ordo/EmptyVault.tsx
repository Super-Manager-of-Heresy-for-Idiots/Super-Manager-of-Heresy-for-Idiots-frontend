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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      <Sigil size={56} glyph={glyph} color="var(--ink-faint)" />
      {overline && <div className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{overline}</div>}
      <div className="ao-h5" style={{ color: 'var(--ink-quiet)' }}>{title}</div>
      {body && <div className="ao-italic" style={{ fontSize: 14, color: 'var(--ink-faint)', maxWidth: 320 }}>{body}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
