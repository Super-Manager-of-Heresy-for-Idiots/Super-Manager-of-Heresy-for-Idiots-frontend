import type { ReactNode } from 'react';
import { Sigil } from './Sigil';
import type { GlyphKind } from './Rune';

interface ErrorAltarProps {
  glyph?: GlyphKind;
  overline?: string;
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export function ErrorAltar({
  glyph = 'cross-pat',
  overline,
  title,
  body,
  onRetry,
  retryLabel,
  action,
}: ErrorAltarProps) {
  return (
    <div className="ao-empty ao-error">
      <Sigil size={56} glyph={glyph} color="var(--ember-pale)" />
      {overline && <div className="ao-overline ao-error-overline">{overline}</div>}
      <div className="ao-h5 ao-empty-title">{title}</div>
      {body && <div className="ao-italic ao-empty-body">{body}</div>}
      {action ? (
        <div className="ao-empty-action">{action}</div>
      ) : onRetry ? (
        <div className="ao-empty-action">
          <button className="ao-btn" onClick={onRetry}>{retryLabel}</button>
        </div>
      ) : null}
    </div>
  );
}
