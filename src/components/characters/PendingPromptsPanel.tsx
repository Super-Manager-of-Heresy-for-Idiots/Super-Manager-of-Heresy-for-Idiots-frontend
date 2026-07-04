import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { usePendingPrompts, useResolvePrompt, useDeclinePrompt } from '@/hooks/useFeatureRuntime';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FeatureRuntimePanels.module.css';

interface PendingPromptsPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Durable reaction / optional-trigger prompts awaiting the player's decision (e.g. "use your reaction?").
 * These survive reloads (persisted server-side). Accept resolves the trigger (spends reaction/resource);
 * decline dismisses it. Renders when the character has pending prompts.
 */
export function PendingPromptsPanel({ campaignId, characterId, canManage }: PendingPromptsPanelProps) {
  const t = useT();
  const { data: prompts } = usePendingPrompts(characterId);
  const resolve = useResolvePrompt(campaignId, characterId);
  const decline = useDeclinePrompt(campaignId, characterId);

  if (!prompts || prompts.length === 0) return null;
  const busy = resolve.isPending || decline.isPending;

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('featureRuntime.prompts.title')} sub={t('featureRuntime.prompts.sub')} glyph="flame" tone="ember" />
      <div className={s.body}>
        {prompts.map((p) => (
          <div key={p.id} className={s.effectRow}>
            <div className={s.effectMain}>
              <span className={s.name}>{t('featureRuntime.prompts.generic')}</span>
              {p.promptType && <span className={s.rounds}>{p.promptType}</span>}
            </div>
            {canManage && (
              <div className={s.controls}>
                <button
                  className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary')}
                  disabled={busy}
                  onClick={() => resolve.mutate(p.id)}
                >
                  {t('featureRuntime.prompts.accept')}
                </button>
                <button
                  className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--ghost')}
                  disabled={busy}
                  onClick={() => decline.mutate(p.id)}
                >
                  {t('featureRuntime.prompts.decline')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}
