import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { useFeatureActions, useUseFeature } from '@/hooks/useFeatureRuntime';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FeatureRuntimePanels.module.css';

interface FeatureActionsPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Class actions from the feature-rules runtime (Reckless Attack, Stunning Strike, Channel Divinity…),
 * with their action/resource cost and availability. Renders nothing when the runtime is off / none exist.
 */
export function FeatureActionsPanel({ campaignId, characterId, canManage }: FeatureActionsPanelProps) {
  const t = useT();
  const { data: actions } = useFeatureActions(characterId);
  const useFeature = useUseFeature(campaignId, characterId);

  if (!actions || actions.length === 0) return null;

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('featureRuntime.actions.title')} sub={t('featureRuntime.actions.sub')} icon="feature-action" tone="arcane" />
      <div className={s.body}>
        {actions.map((a) => (
          <div key={a.featureId} className={s.effectRow}>
            <div className={s.effectMain}>
              <span className={s.name}>{a.featureName}</span>
              <span className={s.effectMeta}>
                {a.actionTypeLabel && <span className={s.concChip}>{a.actionTypeLabel}</span>}
                {a.resourceKey && a.resourceCost != null && (
                  <span className={s.rounds}>
                    {a.resourceKey} −{a.resourceCost}
                    {a.resourceRemaining != null ? ` (${a.resourceRemaining})` : ''}
                  </span>
                )}
                {!a.available && a.unavailableReason && (
                  <span className={s.rounds}>{a.unavailableReason}</span>
                )}
              </span>
            </div>
            {canManage && (
              <button
                className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary')}
                disabled={!a.available || useFeature.isPending}
                title={!a.available ? (a.unavailableReason ?? undefined) : undefined}
                onClick={() => useFeature.mutate(a.featureId)}
              >
                {t('featureRuntime.actions.use')}
              </button>
            )}
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}
