import { createContext, useContext } from 'react';
import type { Lang } from './translations';

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key, with optional `{name}` interpolation values. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useT() {
  return useI18n().t;
}


