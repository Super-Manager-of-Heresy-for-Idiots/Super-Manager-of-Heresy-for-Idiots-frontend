import { useMemo, useRef, useState } from 'react';
import { useFormulaVocabulary, useResourceKeys } from '@/hooks/useFeatureRules';
import { useGlobalReferenceContent } from '@/hooks/useTemplates';
import type { FormulaVocabEntry } from '@/api/featureRules.api';
import s from './FormulaInput.module.css';

/**
 * Formula text input with DSL autocomplete. The vocabulary (functions + scalars) comes from the backend
 * (`/admin/feature-formulas/vocabulary`, sourced from the evaluator allowlist — never hardcoded). Type the
 * first letters of a token → matching functions/scalars are suggested; inside a keyed function's string
 * argument (e.g. `ability_mod("…")`) the relevant dynamic list is suggested (abilities, class names,
 * resource keys).
 */
interface Suggestion {
  insert: string;
  label: string;
  hint?: string;
  /** When true, keep the caret inside the surrounding quotes (argument completion). */
  arg?: boolean;
}

interface FormulaInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

/** The identifier word ending at `caret`, plus its start index. */
function wordBefore(text: string, caret: number): { word: string; start: number } {
  let start = caret;
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start -= 1;
  return { word: text.slice(start, caret), start };
}

/** If the caret sits inside a string literal, return the open-quote index and the string typed so far. */
function stringContext(text: string, caret: number): { openQuote: number; partial: string } | null {
  let quote: string | null = null;
  let openIdx = -1;
  for (let i = 0; i < caret; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
        openIdx = -1;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      openIdx = i;
    }
  }
  if (quote && openIdx >= 0) {
    return { openQuote: openIdx, partial: text.slice(openIdx + 1, caret) };
  }
  return null;
}

/** The function name immediately preceding an opening quote at `openQuote` (e.g. `ability_mod(` → ability_mod). */
function functionBeforeQuote(text: string, openQuote: number): string | null {
  let i = openQuote - 1;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  if (i < 0 || text[i] !== '(') return null;
  i -= 1;
  let end = i + 1;
  while (i >= 0 && /[A-Za-z0-9_]/.test(text[i])) i -= 1;
  const name = text.slice(i + 1, end);
  return name || null;
}

export default function FormulaInput({ value, onChange, placeholder, className }: FormulaInputProps) {
  const { data: vocab } = useFormulaVocabulary();
  const { data: resourceKeys } = useResourceKeys();
  const { data: refContent } = useGlobalReferenceContent();
  const inputRef = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const classNames = useMemo(
    () => (refContent?.classes ?? []).map((c) => c.name).filter(Boolean) as string[],
    [refContent],
  );

  const argValues = (argKind?: string | null): string[] => {
    switch (argKind) {
      case 'ability':
        return vocab?.abilityCodes ?? [];
      case 'class':
        return classNames;
      case 'resource_key':
        return resourceKeys ?? [];
      default:
        return [];
    }
  };

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!vocab) return [];
    const str = stringContext(value, caret);
    if (str) {
      const fnName = functionBeforeQuote(value, str.openQuote);
      const entry = fnName ? vocab.functions.find((f) => f.name === fnName) : null;
      const values = argValues(entry?.argKind);
      if (!values.length) return [];
      const p = str.partial.toLowerCase();
      return values
        .filter((v) => v.toLowerCase().startsWith(p))
        .slice(0, 12)
        .map((v) => ({ insert: v, label: v, arg: true }));
    }
    const { word } = wordBefore(value, caret);
    if (!word) return [];
    const p = word.toLowerCase();
    const all: FormulaVocabEntry[] = [...vocab.functions, ...vocab.scalars];
    return all
      .filter((e) => e.name.toLowerCase().startsWith(p))
      .slice(0, 12)
      .map((e) => ({ insert: e.insertText, label: e.signature || e.name, hint: e.description ?? undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocab, value, caret, resourceKeys, classNames]);

  const apply = (sug: Suggestion) => {
    const input = inputRef.current;
    const pos = input ? input.selectionStart ?? caret : caret;
    let next: string;
    let nextCaret: number;
    if (sug.arg) {
      const str = stringContext(value, pos);
      if (!str) return;
      const start = str.openQuote + 1;
      next = value.slice(0, start) + sug.insert + value.slice(pos);
      nextCaret = start + sug.insert.length;
    } else {
      const { start } = wordBefore(value, pos);
      next = value.slice(0, start) + sug.insert + value.slice(pos);
      nextCaret = start + sug.insert.length;
    }
    onChange(next);
    setOpen(false);
    // Restore caret after React re-renders the controlled value.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
        setCaret(nextCaret);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      apply(suggestions[Math.min(active, suggestions.length - 1)]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const sync = () => {
    const el = inputRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  };

  return (
    <div className={s.wrap}>
      <input
        ref={inputRef}
        className={className ?? 'ao-input'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
          setOpen(true);
          setActive(0);
        }}
        onKeyUp={sync}
        onClick={sync}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        autoComplete="off"
        spellCheck={false}
      />
      {open && suggestions.length > 0 && (
        <ul className={s.menu}>
          {suggestions.map((sug, i) => (
            <li
              key={sug.insert + i}
              className={i === active ? `${s.item} ${s.itemActive}` : s.item}
              onMouseDown={(e) => {
                e.preventDefault();
                apply(sug);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className={s.itemLabel}>{sug.label}</span>
              {sug.hint && <span className={s.itemHint}>{sug.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
