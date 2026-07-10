import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { coreTranslations, loadFeatureTranslations, type Dict, type Lang } from './translations';
import { LANG_STORAGE_KEY, DEFAULT_LANG, getStoredLang } from './lang';
import { I18nContext } from './I18nContext';

export function I18nProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [lang, setLangState] = useState<Lang>(getStoredLang);
  const [translations, setTranslations] = useState<Record<Lang, Dict>>(coreTranslations);

  useEffect(() => {
    let cancelled = false;

    void loadFeatureTranslations().then((loaded) => {
      if (!cancelled) {
        setTranslations({
          ru: { ...coreTranslations.ru, ...loaded.ru },
          en: { ...coreTranslations.en, ...loaded.en },
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    if (next === getStoredLang()) return;
    localStorage.setItem(LANG_STORAGE_KEY, next);
    document.documentElement.lang = next;
    setLangState(next);
    void queryClient.invalidateQueries();
  }, [queryClient]);

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
    [lang, translations],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
