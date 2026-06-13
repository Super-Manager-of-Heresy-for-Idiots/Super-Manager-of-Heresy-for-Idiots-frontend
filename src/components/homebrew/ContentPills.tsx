import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './ContentPills.module.css';

interface ContentPillsProps {
  items?: number;
  classes?: number;
  skills?: number;
  feats?: number;
  compact?: boolean;
}

export function ContentPills({ items = 0, classes = 0, skills = 0, feats = 0, compact = false }: ContentPillsProps) {
  const t = useT();
  const data = [
    { label: t('cmp2.pills.items'),   v: items,   g: 'sword' },
    { label: t('cmp2.pills.classes'), v: classes, g: 'helm' },
    { label: t('cmp2.pills.skills'),  v: skills,  g: 'eye' },
    { label: t('cmp2.pills.feats'),   v: feats,   g: 'sigil-3' },
  ];

  return (
    <div className={cn(s.wrap, compact && s.compact)}>
      {data.map((d) => (
        <div key={d.label} className={s.pill}>
          <Rune kind={d.g} size={compact ? 9 : 11} color={d.v ? 'var(--gold-pale)' : 'var(--ink-ghost)'} />
          <span className={cn('ao-num', s.num, !d.v && s.zero)}>{d.v}</span>
          <span className={cn('ao-codex', s.label)}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
