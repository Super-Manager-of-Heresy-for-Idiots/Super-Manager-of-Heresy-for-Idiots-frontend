import type { ReactNode } from 'react';
import { Sigil } from './Sigil';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import type { GlyphKind } from './Rune';
import { entityIconForGlyph } from './entityIcons';
import { isRetryableError } from '@/lib/errors';

interface ErrorAltarProps {
  glyph?: GlyphKind;
  icon?: OrdoInterfaceIconKey;
  overline?: string;
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  /**
   * The error that triggered this altar. When provided, the retry button is
   * suppressed for non-retryable outcomes (4xx — permission/not-found/validation),
   * since retrying those changes nothing. Omit to keep the legacy behaviour
   * (retry always offered when `onRetry` is set).
   */
  error?: unknown;
}

export function ErrorAltar({
  glyph = 'cross-pat',
  icon,
  overline,
  title,
  body,
  onRetry,
  retryLabel,
  action,
  error,
}: ErrorAltarProps) {
  const showRetry = !!onRetry && isRetryableError(error);
  const interfaceIcon = icon ?? entityIconForGlyph(glyph) ?? 'error-state';

  return (
    <div className="ao-empty ao-error">
      {interfaceIcon ? (
        <OrdoInterfaceIcon icon={interfaceIcon} size={56} style={{ color: 'var(--ember-pale)' }} />
      ) : (
        <Sigil size={56} glyph={glyph} color="var(--ember-pale)" />
      )}
      {overline && <div className="ao-overline ao-error-overline">{overline}</div>}
      <div className="ao-h5 ao-empty-title">{title}</div>
      {body && <div className="ao-italic ao-empty-body">{body}</div>}
      {action ? (
        <div className="ao-empty-action">{action}</div>
      ) : showRetry ? (
        <div className="ao-empty-action">
          <button className="ao-btn" onClick={onRetry}>{retryLabel}</button>
        </div>
      ) : null}
    </div>
  );
}
