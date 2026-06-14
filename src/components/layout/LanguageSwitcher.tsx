import { useI18n } from '@/i18n/I18nContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import s from './LanguageSwitcher.module.css';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div role="group" aria-label={t('lang.label')} className={s.group}>
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            title={opt.label}
            className={cn(s.btn, active && s.active)}
          >
            {opt.value.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
