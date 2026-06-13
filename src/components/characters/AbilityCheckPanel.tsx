import { OrdoPanel, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './AbilityCheckPanel.module.css';

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
      <OrdoPanel frame className={s.panel}>
        <div className={s.empty}>{t('cmp.ability.empty')}</div>
      </OrdoPanel>
    );
  }

  return (
    <OrdoPanel frame className={s.panel}>
      <div className={s.body}>
        <div className={cn('ao-overline', s.statName)}>{result.statName}</div>

        <div className={s.total}>
          {result.total >= 0 ? '+' : ''}
          {result.total}
        </div>

        <OrdoDivider glyph="diamond" color="var(--rule)" />

        <div className={s.breakdown}>
          {result.breakdown.map((entry, idx) => (
            <div key={idx} className={s.row}>
              <span className={s.source}>{entry.source}</span>
              <span className={cn(s.value, entry.value >= 0 ? s.pos : s.neg)}>
                {entry.value >= 0 ? '+' : ''}
                {entry.value}
              </span>
            </div>
          ))}
        </div>

        <OrdoDivider glyph="diamond" color="var(--rule)" />

        <div className={s.totalRow}>
          <span className={cn('ao-overline', s.totalLabel)}>{t('cmp.ability.total')}</span>
          <span className={s.totalValue}>
            {result.total >= 0 ? '+' : ''}
            {result.total}
          </span>
        </div>
      </div>
    </OrdoPanel>
  );
}
