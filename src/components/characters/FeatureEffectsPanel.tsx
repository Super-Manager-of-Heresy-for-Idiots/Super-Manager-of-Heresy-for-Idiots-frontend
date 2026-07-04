import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { useFeatureEffects, useEndFeatureEffect } from '@/hooks/useFeatureRuntime';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FeatureRuntimePanels.module.css';

interface FeatureEffectsPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Active feature effects from the runtime (auras, marks, buffs/debuffs) with remaining rounds and
 * concentration. Renders nothing when the runtime is off / no effects exist. GM can end an effect.
 */
export function FeatureEffectsPanel({ campaignId, characterId, canManage }: FeatureEffectsPanelProps) {
  const t = useT();
  const { data: effects } = useFeatureEffects(characterId);
  const end = useEndFeatureEffect(campaignId, characterId);

  if (!effects || effects.length === 0) return null;

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('featureRuntime.effects.title')} sub={t('featureRuntime.effects.sub')} glyph="hex" tone="arcane" />
      <div className={s.body}>
        {effects.map((e) => (
          <div key={e.id} className={s.effectRow}>
            <div className={s.effectMain}>
              <span className={s.name}>{e.displayName || e.effectKey}</span>
              <span className={s.effectMeta}>
                {e.concentrationRequired && (
                  <span className={s.concChip}>{t('featureRuntime.effects.concentration')}</span>
                )}
                {e.remainingRounds != null && (
                  <span className={s.rounds}>{t('featureRuntime.effects.rounds', { rounds: e.remainingRounds })}</span>
                )}
              </span>
            </div>
            {canManage && (
              <button
                className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm')}
                disabled={end.isPending}
                onClick={() => end.mutate(e.id)}
              >
                {t('featureRuntime.effects.end')}
              </button>
            )}
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}
