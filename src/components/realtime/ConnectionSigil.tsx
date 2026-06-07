import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

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
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      title={label}
    >
      <div
        className={state === 'reconnecting' ? 'ao-breathe' : undefined}
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Rune kind={cfg.glyph} size={14} color={cfg.color} />
      </div>

      <span
        className="ao-overline"
        style={{ color: cfg.color, fontSize: 10 }}
      >
        {label}
      </span>
    </div>
  );
}
