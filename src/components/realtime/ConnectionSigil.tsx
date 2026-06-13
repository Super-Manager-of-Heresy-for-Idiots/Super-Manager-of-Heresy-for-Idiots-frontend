import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './ConnectionSigil.module.css';

type SigilState = 'connected' | 'reconnecting' | 'offline';

interface ConnectionSigilProps {
  state?: SigilState;
}

const CONFIG: Record<SigilState, { glyph: string; color: string; labelKey: string }> = {
  connected:    { glyph: 'cir-dot',  color: 'var(--verdigris)',  labelKey: 'cmp2.conn.connected' },
  reconnecting: { glyph: 'cir',      color: 'var(--gold)',       labelKey: 'cmp2.conn.reconnecting' },
  offline:      { glyph: 'cir',      color: 'var(--ink-ghost)',  labelKey: 'cmp2.conn.offline' },
};

export function ConnectionSigil({ state = 'offline' }: ConnectionSigilProps) {
  const t = useT();
  const cfg = CONFIG[state];
  const label = t(cfg.labelKey);

  return (
    <div className={s.sigil} style={{ '--tone': cfg.color } as CSSProperties} title={label}>
      <div className={cn(s.iconbox, state === 'reconnecting' && 'ao-breathe')}>
        <Rune kind={cfg.glyph} size={14} color={cfg.color} />
      </div>

      <span className={cn('ao-overline', s.label)}>{label}</span>
    </div>
  );
}
