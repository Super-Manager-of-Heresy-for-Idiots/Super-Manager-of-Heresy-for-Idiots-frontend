import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { useCharacterChoices, useChooseFeature, useRemoveChoice } from '@/hooks/useCharacterChoices';
import { useGlobalReferenceContent } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FormsPanels.module.css';

interface FeatureChoicesPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

const KNOWN_OPTION_TYPES = ['spell', 'skill', 'language', 'proficiency', 'monster', 'item', 'feature', 'damage_type'];

function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Feature choices a character makes (Fighting Style, Expertise skills, Metamagic, …): shows each group's
 * remaining picks, current selections (removable) and available options. Skill options resolve to skill
 * names; other option types show a typed label. Renders when the character has unresolved feature choices.
 */
export function FeatureChoicesPanel({ campaignId, characterId, canManage }: FeatureChoicesPanelProps) {
  const t = useT();
  const { data: groups } = useCharacterChoices(characterId);
  const { data: refContent } = useGlobalReferenceContent();
  const choose = useChooseFeature(campaignId, characterId);
  const remove = useRemoveChoice(campaignId, characterId);

  if (!groups || groups.length === 0) return null;
  const busy = choose.isPending || remove.isPending;

  const optionLabel = (optionType: string, targetEntityId?: string | null): string => {
    if (optionType === 'skill' && targetEntityId) {
      const name = (refContent?.skills ?? []).find((sk) => sk.id === targetEntityId)?.name;
      if (name) return name;
    }
    return KNOWN_OPTION_TYPES.includes(optionType) ? t(`choices.optionType.${optionType}`) : humanizeKey(optionType);
  };

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('choices.title')} sub={t('choices.sub')} icon="feature-choice" tone="arcane" />
      <div className={s.body}>
        {groups.map((g) => {
          const chosenTargets = new Set(g.selections.map((sel) => sel.targetEntityId));
          const openOptions = g.options.filter((o) => !o.targetEntityId || !chosenTargets.has(o.targetEntityId));
          return (
            <div key={g.groupId} className={s.choiceGroup}>
              <div className={s.choiceHead}>
                <span className={s.name}>{humanizeKey(g.choiceKey)}</span>
                <span className={s.cr}>{t('choices.remaining', { remaining: g.remaining, max: g.maxChoices })}</span>
              </div>
              {g.selections.map((sel) => (
                <div key={sel.id} className={s.formRow}>
                  <span className={s.name}>{optionLabel(sel.optionType, sel.targetEntityId)}</span>
                  {canManage && (
                    <button
                      className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm')}
                      disabled={busy}
                      title={t('choices.remove')}
                      onClick={() => remove.mutate(sel.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {canManage && g.remaining > 0 &&
                openOptions.map((o) => (
                  <div key={o.id} className={s.optionRow}>
                    <span className={s.optName}>{optionLabel(o.optionType, o.targetEntityId)}</span>
                    <button
                      className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary')}
                      disabled={busy}
                      onClick={() =>
                        choose.mutate({ groupId: g.groupId, optionType: o.optionType, targetEntityId: o.targetEntityId ?? undefined })
                      }
                    >
                      {t('choices.pick')}
                    </button>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </OrdoPanel>
  );
}
