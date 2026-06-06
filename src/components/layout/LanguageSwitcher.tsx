import { useI18n } from '@/i18n/I18nContext';
import type { Lang } from '@/i18n/translations';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      style={{
        display: 'inline-flex',
        border: '1px solid var(--rule)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            style={{
              padding: '3px 9px',
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: active ? 'rgba(176, 141, 78, 0.16)' : 'transparent',
              color: active ? 'var(--gold-pale)' : 'var(--ink-faint)',
              border: 'none',
              cursor: active ? 'default' : 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--ink-quiet)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--ink-faint)';
            }}
          >
            {opt.value.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
