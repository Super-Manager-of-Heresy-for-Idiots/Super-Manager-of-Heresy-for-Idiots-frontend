import type { Lang } from './translations';

/** localStorage key under which the active UI language is persisted. */
export const LANG_STORAGE_KEY = 'lang';

/** Language used when nothing valid is stored. */
export const DEFAULT_LANG: Lang = 'ru';

/**
 * Active UI language read straight from localStorage. Safe to call outside the
 * React tree (e.g. in the axios layer): it never throws and falls back to the
 * default when storage is empty/unavailable. Kept in sync by `I18nProvider`.
 */
export function getStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return DEFAULT_LANG;
}
