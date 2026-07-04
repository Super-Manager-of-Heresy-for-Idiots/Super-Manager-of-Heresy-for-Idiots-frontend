import { useMemo, useState } from 'react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import {
  useKnownForms,
  useTransformation,
  useLearnForm,
  useApproveForm,
  useTransform,
  useEndTransformation,
} from '@/hooks/useCharacterForms';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { MonsterPickerModal, monsterDisplayName } from './MonsterPickerModal';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FormsPanels.module.css';

interface KnownFormsPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Wild Shape / known monster forms + the current transformation (Druid etc.). Lists the beasts the
 * character can turn into, with a transform/revert control and GM approval. Learning a new form opens a
 * bestiary picker (backend validates eligibility). Renders when the class can wild-shape.
 */
export function KnownFormsPanel({ campaignId, characterId, canManage }: KnownFormsPanelProps) {
  const t = useT();
  const { lang } = useI18n();
  const { data: forms } = useKnownForms(characterId);
  const { data: transformation } = useTransformation(characterId);
  const { data: monsters } = useCampaignMonsters(campaignId);
  const learn = useLearnForm(campaignId, characterId);
  const approve = useApproveForm(campaignId, characterId);
  const transform = useTransform(campaignId, characterId);
  const revert = useEndTransformation(campaignId, characterId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const monsterMap = useMemo(() => new Map((monsters ?? []).map((m) => [m.id, m])), [monsters]);
  const nameOf = (monsterId: string) => {
    const m = monsterMap.get(monsterId);
    return m ? monsterDisplayName(m, lang) : t('forms.unknownMonster');
  };

  const list = forms ?? [];
  const busy = learn.isPending || approve.isPending || transform.isPending || revert.isPending;

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('forms.title')} sub={t('forms.sub')} glyph="hex" tone="arcane" />
      <div className={s.body}>
        {transformation && (
          <div className={s.transformBar}>
            <Rune kind="hex" size={12} color="var(--arcane)" />
            <span className={s.transformLabel}>{t('forms.current', { name: nameOf(transformation.monsterId) })}</span>
            {canManage && (
              <button className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--ghost')} disabled={busy} onClick={() => revert.mutate()}>
                {t('forms.revert')}
              </button>
            )}
          </div>
        )}
        {list.length === 0 && !transformation && <div className={s.hint}>{t('forms.empty')}</div>}
        {list.map((f) => (
          <div key={f.id} className={s.formRow}>
            <div className={s.formMain}>
              <span className={s.name}>{nameOf(f.monsterId)}</span>
              <span className={s.formMeta}>
                {monsterMap.get(f.monsterId) && (
                  <span className={s.cr}>{t('forms.cr', { cr: monsterMap.get(f.monsterId)!.crRating })}</span>
                )}
                {!f.approvedByDm && <span className={s.pendingChip}>{t('forms.pending')}</span>}
              </span>
            </div>
            {canManage && (
              <div className={s.formControls}>
                {!f.approvedByDm && (
                  <button className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--ghost')} disabled={busy} onClick={() => approve.mutate(f.id)}>
                    {t('forms.approve')}
                  </button>
                )}
                <button
                  className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary')}
                  disabled={busy || !!transformation}
                  onClick={() => transform.mutate({ monsterId: f.monsterId, sourceFeatureId: f.sourceFeatureId ?? undefined })}
                >
                  {t('forms.transform')}
                </button>
              </div>
            )}
          </div>
        ))}
        {canManage && (
          <button className={cn('ao-btn', 'ao-btn--sm', s.addBtn)} onClick={() => setPickerOpen(true)}>
            {t('forms.learn')}
          </button>
        )}
      </div>
      <MonsterPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        campaignId={campaignId}
        title={t('forms.learnTitle')}
        sub={t('forms.learnSub')}
        busy={learn.isPending}
        onPick={(monsterId) => {
          learn.mutate({ monsterId });
          setPickerOpen(false);
        }}
      />
    </OrdoPanel>
  );
}
