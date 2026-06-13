import { Rune } from '@/components/ordo';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './DrillBlock.module.css';

interface DrillBlockProps {
  label: string;
  glyph: string;
  count?: number;
  to: string;
}

export function DrillBlock({ label, glyph, count, to }: DrillBlockProps) {
  const nav = useNavigate();
  const t = useT();
  return (
    <button onClick={() => nav(to)} className={cn('ao-panel', s.block)}>
      <div className={s.icon}>
        <Rune kind={glyph} size={18} color="var(--ink-quiet)" />
      </div>
      <div className={s.body}>
        <div className={s.title}>{label}</div>
        {count != null && <div className={cn('ao-codex', s.count)}>{t('cmp2.drill.entries', { count })}</div>}
      </div>
      <Rune kind="chev-r" size={14} color="var(--ink-faint)" />
    </button>
  );
}
