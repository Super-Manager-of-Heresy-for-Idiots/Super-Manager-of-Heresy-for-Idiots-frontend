import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { translations, type Lang } from './translations';
import { LANG_STORAGE_KEY, DEFAULT_LANG, getStoredLang } from './lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key, with optional `{name}` interpolation values. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(LANG_STORAGE_KEY, next);
    document.documentElement.lang = next;
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang];
      let value = dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replace(
            new RegExp(`\\{${name}\\}`, 'g'),
            String(replacement),
          );
        }
      }
      return value;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

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
