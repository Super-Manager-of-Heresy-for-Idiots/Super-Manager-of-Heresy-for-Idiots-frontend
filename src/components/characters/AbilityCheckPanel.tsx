import { OrdoPanel, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface BreakdownEntry {
  source: string;
  value: number;
}

interface AbilityCheckResult {
  statName: string;
  total: number;
  breakdown: BreakdownEntry[];
}

interface AbilityCheckPanelProps {
  result: AbilityCheckResult | null;
}

export function AbilityCheckPanel({ result }: AbilityCheckPanelProps) {
  const t = useT();
  if (!result) {
    return (
      <OrdoPanel frame style={{ width: 380 }}>
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--ink-faint)',
            fontSize: 12,
            fontStyle: 'italic',
          }}
        >
          {t('cmp.ability.empty')}
        </div>
      </OrdoPanel>
    );
  }

  return (
    <OrdoPanel frame style={{ width: 380 }}>
      <div style={{ padding: '20px 24px' }}>
        {/* Stat name overline */}
        <div
          className="ao-overline"
          style={{
            color: 'var(--gold)',
            letterSpacing: '0.2em',
            marginBottom: 8,
          }}
        >
          {result.statName}
        </div>

        {/* Large total modifier */}
        <div
          style={{
            fontSize: 56,
            fontFamily: 'var(--font-display)',
            color: 'var(--ink-bright)',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          {result.total >= 0 ? '+' : ''}
          {result.total}
        </div>

        <OrdoDivider glyph="diamond" color="var(--rule)" />

        {/* Breakdown rows */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.breakdown.map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--ink-quiet)',
                }}
              >
                {entry.source}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: entry.value >= 0 ? '#7a9866' : '#c9803a',
                  fontWeight: 600,
                }}
              >
                {entry.value >= 0 ? '+' : ''}
                {entry.value}
              </span>
            </div>
          ))}
        </div>

        <OrdoDivider glyph="diamond" color="var(--rule)" />

        {/* Total row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0 4px',
          }}
        >
          <span
            className="ao-overline"
            style={{
              color: 'var(--gold)',
              letterSpacing: '0.16em',
            }}
          >
            {t('cmp.ability.total')}
          </span>
          <span
            style={{
              fontSize: 20,
              fontFamily: 'var(--font-display)',
              color: 'var(--gold)',
            }}
          >
            {result.total >= 0 ? '+' : ''}
            {result.total}
          </span>
        </div>
      </div>
    </OrdoPanel>
  );
}
