import { Rune } from '@/components/ordo';

type SigilState = 'connected' | 'reconnecting' | 'offline';

interface ConnectionSigilProps {
  state?: SigilState;
}

const CONFIG: Record<SigilState, { glyph: string; color: string; label: string }> = {
  connected:    { glyph: 'cir-dot',  color: 'var(--verdigris)',  label: 'Connected' },
  reconnecting: { glyph: 'cir',      color: 'var(--gold)',       label: 'Reconnecting' },
  offline:      { glyph: 'cir',      color: 'var(--ink-ghost)',  label: 'Offline' },
};

export function ConnectionSigil({ state = 'offline' }: ConnectionSigilProps) {
  const cfg = CONFIG[state];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      title={cfg.label}
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
        {cfg.label}
      </span>
    </div>
  );
}
