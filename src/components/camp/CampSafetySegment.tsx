import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { LocationRestSafety } from '@/types';
import s from './CampSafetySegment.module.css';

const OPTIONS: { level: LocationRestSafety; tone: string; glyph: string }[] = [
  { level: 'SAFE',      tone: '#7a9866',      glyph: 'shield' },
  { level: 'RISKY',     tone: 'var(--gold)',  glyph: 'eye' },
  { level: 'DANGEROUS', tone: 'var(--ember)', glyph: 'sword' },
];

interface CampSafetySegmentProps {
  value: LocationRestSafety;
  onChange: (value: LocationRestSafety) => void;
  size?: 'sm' | 'md';
}

/**
 * Сегментированный выбор метки безопасности привала для локации (rest_safety).
 * Значение механику не меняет — оно управляет подсказками мастеру на экране лагеря.
 */
export function CampSafetySegment({ value, onChange, size = 'md' }: CampSafetySegmentProps) {
  const t = useT();

  return (
    <div className={`${s.segment} ${size === 'sm' ? s.segmentSm : ''}`}>
      {OPTIONS.map((option) => {
        const on = value === option.level;
        return (
          <button
            key={option.level}
            type="button"
            title={t(`campfire.safety.${option.level}`)}
            className={`${s.option} ${on ? s.optionOn : ''}`}
            style={{ '--tone': option.tone } as CSSProperties}
            onClick={() => onChange(option.level)}
          >
            <Rune kind={option.glyph} size={size === 'sm' ? 10 : 12} color={on ? option.tone : 'var(--ink-ghost)'} />
            {t(`campfire.safety.${option.level}`)}
          </button>
        );
      })}
    </div>
  );
}
