import { useEffect, useState } from 'react';
import { Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface EditableSheetFieldProps {
  /** Current persisted value (null/empty → placeholder). */
  value: string | null;
  /** Maximum input length; absent means unbounded. */
  maxLength?: number;
  /** `text` for single-line input, `multiline` for textarea. */
  variant?: 'text' | 'multiline';
  placeholder: string;
  saving?: boolean;
  /** Triggers persistence. Empty string clears the field on the backend. */
  onSave: (next: string) => void;
}

/**
 * Read-only display that flips into an inline editor on click. Used for the
 * three free-text sheet fields (playerName / proficiencies / equipment) on
 * both the campaign Folio and the standalone template sheet.
 */
export function EditableSheetField({
  value,
  maxLength,
  variant = 'multiline',
  placeholder,
  saving,
  onSave,
}: EditableSheetFieldProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  if (!editing) {
    const empty = !value;
    return (
      <div
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
        style={{ cursor: 'pointer', minHeight: empty ? 96 : undefined }}
        title={t('common.edit') as string}
      >
        {empty ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <Sigil size={36} glyph="sigil-1" color="var(--ink-faint)" />
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
              {placeholder}
            </p>
          </div>
        ) : (
          <p className="ao-italic" style={{ padding: 14, fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}>
            {value}
          </p>
        )}
      </div>
    );
  }

  const overflow = maxLength != null && draft.length > maxLength;

  const commit = () => {
    if (overflow) return;
    const next = draft.trim();
    if (next === (value ?? '')) {
      setEditing(false);
      return;
    }
    onSave(next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {variant === 'multiline' ? (
        <textarea
          autoFocus
          className="ao-input"
          rows={5}
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
        />
      ) : (
        <input
          autoFocus
          className="ao-input"
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.preventDefault(); cancel(); } }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        {maxLength != null ? (
          <span className="ao-codex" style={{ fontSize: 10, color: overflow ? 'var(--ember)' : 'var(--ink-faint)' }}>
            {draft.length} / {maxLength}
          </span>
        ) : <span />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={cancel} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={commit} disabled={saving || overflow}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
