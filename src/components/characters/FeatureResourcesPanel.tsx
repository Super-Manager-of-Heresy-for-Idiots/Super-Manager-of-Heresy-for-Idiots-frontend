import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useFeatureResources, useSpendFeatureResource, useAdjustFeatureResource } from '@/hooks/useFeatureRuntime';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FeatureRuntimePanels.module.css';

interface FeatureResourcesPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Class resource counters from the feature-rules runtime (Rage, Ki, Channel Divinity, Sorcery Points,
 * Bardic Inspiration, Wild Shape uses…). Renders nothing when the runtime is off / no resources exist.
 */
export function FeatureResourcesPanel({ campaignId, characterId, canManage }: FeatureResourcesPanelProps) {
  const t = useT();
  const { data: resources } = useFeatureResources(characterId);
  const spend = useSpendFeatureResource(campaignId, characterId);
  const adjust = useAdjustFeatureResource(campaignId, characterId);

  if (!resources || resources.length === 0) return null;
  const busy = spend.isPending || adjust.isPending;

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('featureRuntime.resources.title')} sub={t('featureRuntime.resources.sub')} glyph="hex" tone="arcane" />
      <div className={s.body}>
        {resources.map((r) => {
          const max = r.maxValue ?? 0;
          const cur = r.currentValue ?? 0;
          const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((cur / max) * 100))) : 0;
          return (
            <div key={r.id} className={s.row}>
              <div className={s.rowHead}>
                <span className={s.name}>{r.displayName || r.resourceKey}</span>
                <span className={cn('ao-num', s.value)}>
                  {cur}
                  <span className={s.denom}>/{max}</span>
                </span>
              </div>
              <div className={s.bar}>
                <div className={s.barFill} style={{ width: `${pct}%` }} />
              </div>
              {canManage && (
                <div className={s.controls}>
                  <button
                    className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm')}
                    disabled={busy || cur <= 0}
                    onClick={() => spend.mutate({ resourceId: r.id, amount: 1 })}
                  >
                    −1
                  </button>
                  <button
                    className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm')}
                    disabled={busy || (max > 0 && cur >= max)}
                    onClick={() => adjust.mutate({ resourceId: r.id, value: Math.min(max, cur + 1) })}
                  >
                    +1
                  </button>
                  <button
                    className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm')}
                    disabled={busy || (max > 0 && cur >= max)}
                    onClick={() => adjust.mutate({ resourceId: r.id, value: max })}
                    title={t('featureRuntime.resources.restore')}
                  >
                    <Rune kind="diamond-fill" size={9} color="var(--gold-pale)" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </OrdoPanel>
  );
}
