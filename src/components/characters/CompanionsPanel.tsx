import { useMemo, useState } from 'react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { useCompanions, useCreateCompanion, useDismissCompanion } from '@/hooks/useCharacterForms';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { MonsterPickerModal, monsterDisplayName } from './MonsterPickerModal';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { Companion } from '@/api/characterForms.api';
import s from './FormsPanels.module.css';

interface CompanionsPanelProps {
  campaignId: string;
  characterId: string;
  canManage: boolean;
}

/**
 * Feature companions (Ranger's beast, Artificer's Steel Defender, familiars, Paladin's mount…) with their
 * computed HP/AC/attack. Summoning opens a bestiary picker. Renders when the character has companions.
 */
export function CompanionsPanel({ campaignId, characterId, canManage }: CompanionsPanelProps) {
  const t = useT();
  const { lang } = useI18n();
  const { data: companions } = useCompanions(characterId);
  const { data: monsters } = useCampaignMonsters(campaignId);
  const create = useCreateCompanion(campaignId, characterId);
  const dismiss = useDismissCompanion(campaignId, characterId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const monsterMap = useMemo(() => new Map((monsters ?? []).map((m) => [m.id, m])), [monsters]);
  const list = companions ?? [];
  const busy = create.isPending || dismiss.isPending;

  const displayName = (c: Companion) => {
    if (c.customName) return c.customName;
    const m = c.monsterId ? monsterMap.get(c.monsterId) : undefined;
    return m ? monsterDisplayName(m, lang) : t('forms.unknownMonster');
  };

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('companions.title')} sub={t('companions.sub')} icon="companion" tone="arcane" />
      <div className={s.body}>
        {list.length === 0 && <div className={s.hint}>{t('companions.empty')}</div>}
        {list.map((c) => (
          <div key={c.id} className={s.formRow}>
            <div className={s.formMain}>
              <span className={s.name}>{displayName(c)}</span>
              <span className={s.formMeta}>
                {c.hp != null && <span className={s.stat}>{t('companions.hp', { hp: c.hp })}</span>}
                {c.ac != null && <span className={s.stat}>{t('companions.ac', { ac: c.ac })}</span>}
                {c.attackBonus != null && (
                  <span className={s.stat}>
                    {t('companions.atk', { atk: c.attackBonus >= 0 ? `+${c.attackBonus}` : `${c.attackBonus}` })}
                  </span>
                )}
              </span>
            </div>
            {canManage && (
              <button className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--ghost')} disabled={busy} onClick={() => dismiss.mutate(c.id)}>
                {t('companions.dismiss')}
              </button>
            )}
          </div>
        ))}
        {canManage && (
          <button className={cn('ao-btn', 'ao-btn--sm', s.addBtn)} onClick={() => setPickerOpen(true)}>
            {t('companions.add')}
          </button>
        )}
      </div>
      <MonsterPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        campaignId={campaignId}
        title={t('companions.addTitle')}
        busy={create.isPending}
        onPick={(monsterId) => {
          create.mutate({ monsterId });
          setPickerOpen(false);
        }}
      />
    </OrdoPanel>
  );
}
