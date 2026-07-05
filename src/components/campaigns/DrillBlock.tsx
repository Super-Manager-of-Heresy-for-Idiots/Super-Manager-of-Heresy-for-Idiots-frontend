import { OrdoInterfaceIcon, Rune, entityIconForGlyph, type OrdoInterfaceIconKey } from '@/components/ordo';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './DrillBlock.module.css';

interface DrillBlockProps {
  label: string;
  glyph: string;
  icon?: OrdoInterfaceIconKey;
  count?: number;
  to: string;
}

export function DrillBlock({ label, glyph, icon, count, to }: DrillBlockProps) {
  const nav = useNavigate();
  const t = useT();
  const interfaceIcon = icon ?? entityIconForGlyph(glyph);

  return (
    <button onClick={() => nav(to)} className={cn('ao-panel', s.block)}>
      <div className={s.icon}>
        {interfaceIcon ? (
          <OrdoInterfaceIcon icon={interfaceIcon} size={18} style={{ color: 'var(--ink-quiet)' }} />
        ) : (
          <Rune kind={glyph} size={18} color="var(--ink-quiet)" />
        )}
      </div>
      <div className={s.body}>
        <div className={s.title}>{label}</div>
        {count != null && <div className={cn('ao-codex', s.count)}>{t('cmp2.drill.entries', { count })}</div>}
      </div>
      <Rune kind="chev-r" size={14} color="var(--ink-faint)" />
    </button>
  );
}
