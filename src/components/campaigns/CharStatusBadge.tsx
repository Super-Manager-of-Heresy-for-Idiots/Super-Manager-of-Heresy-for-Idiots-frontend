import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface CharStatusBadgeProps {
  status: string;
}

const MAP = {
  ACTIVE:  { labelKey: 'cmp2.charStatus.ACTIVE',  color: '#7a9866', glyph: 'cir-dot' },
  DEAD:    { labelKey: 'cmp2.charStatus.DEAD',    color: '#b06a6a', glyph: 'x' },
  RESERVE: { labelKey: 'cmp2.charStatus.RESERVE', color: 'var(--ink-faint)', glyph: 'cir' },
  DOWN:    { labelKey: 'cmp2.charStatus.DOWN',    color: '#c9803a', glyph: 'minus' },
};

export function CharStatusBadge({ status }: CharStatusBadgeProps) {
  const t = useT();
  const m = MAP[status as keyof typeof MAP] || MAP.ACTIVE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', background: 'rgba(0,0,0,0.45)',
      border: `1px solid ${m.color}44`, fontFamily: 'var(--font-display)',
      fontSize: 9, letterSpacing: '0.16em', color: m.color, textTransform: 'uppercase',
    }}>
      <Rune kind={m.glyph} size={8} color={m.color} />{t(m.labelKey)}
    </span>
  );
}
