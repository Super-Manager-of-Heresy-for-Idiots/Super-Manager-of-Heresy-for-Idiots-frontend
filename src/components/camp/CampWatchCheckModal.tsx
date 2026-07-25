import { useEffect, useMemo, useState } from 'react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useCreateRollPrompts } from '@/hooks/useRollPrompts';
import { useT } from '@/i18n/I18nContext';
import type { RollAdvantageMode } from '@/types';
import s from './CampWatchCheckModal.module.css';

interface CampWatchCheckModalProps {
  open: boolean;
  campaignId: string;
  characterId?: string;
  characterName?: string;
  slot?: number;
  onOpenChange: (open: boolean) => void;
}

const ADVANTAGE_MODES: RollAdvantageMode[] = ['NORMAL', 'ADVANTAGE', 'DISADVANTAGE'];

/**
 * Запрос проверки дозорному. Никакой отдельной механики лагерь не вводит:
 * создаётся обычный ROLL_PROMPT, окно броска открывается у владельца персонажа.
 * Характеристика выбирается мастером из справочника кампании, а не задана в коде.
 */
export function CampWatchCheckModal({
  open,
  campaignId,
  characterId,
  characterName,
  slot,
  onOpenChange,
}: CampWatchCheckModalProps) {
  const t = useT();
  const { data: characters } = useCampaignCharacters(campaignId);
  const createPrompts = useCreateRollPrompts();

  const [statTypeId, setStatTypeId] = useState('');
  const [dc, setDc] = useState('');
  const [hideDc, setHideDc] = useState(true);
  const [advantage, setAdvantage] = useState<RollAdvantageMode>('NORMAL');

  // Справочник характеристик берётся из листа персонажа — в лагере он не дублируется.
  const statOptions = useMemo(() => {
    const target = (characters ?? []).find((character) => character.id === characterId);
    const source = target?.stats?.length
      ? target
      : (characters ?? []).find((character) => character.stats?.length);
    return (source?.stats ?? []).map((stat) => ({ id: stat.statTypeId, name: stat.statTypeName }));
  }, [characters, characterId]);

  useEffect(() => {
    if (open && !statTypeId && statOptions.length > 0) {
      setStatTypeId(statOptions[0].id);
    }
  }, [open, statTypeId, statOptions]);

  const submit = () => {
    if (!characterId || !statTypeId) return;
    createPrompts.mutate(
      {
        campaignId,
        data: {
          characterIds: [characterId],
          rollType: 'ABILITY_CHECK',
          statTypeId,
          dc: dc ? Number(dc) : undefined,
          hideDc,
          advantageMode: advantage,
          description: slot != null ? t('campfire.watch.checkDescription', { slot }) : undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      overline={t('campfire.watch.title')}
      title={t('campfire.watch.checkTitle')}
      sub={characterName}
      rune="hex"
      width={520}
      footer={(
        <div className={s.footer}>
          <button className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)}>
            {t('campfire.setup.cancel')}
          </button>
          <button
            className="ao-btn ao-btn--primary"
            disabled={!characterId || !statTypeId || createPrompts.isPending}
            onClick={submit}
          >
            <Rune kind="hex" size={12} />
            {t('campfire.watch.checkSubmit')}
          </button>
        </div>
      )}
    >
      <div className={s.body}>
        <OrdoField label={t('campfire.watch.checkStat')} required>
          <select
            className="ao-input"
            value={statTypeId}
            onChange={(event) => setStatTypeId(event.target.value)}
          >
            {statOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </OrdoField>

        <div className={s.row}>
          <OrdoField label={t('campfire.watch.checkDc')}>
            <input
              className="ao-input"
              type="number"
              min={1}
              value={dc}
              onChange={(event) => setDc(event.target.value)}
            />
          </OrdoField>

          <OrdoField label={t('campfire.watch.checkAdvantage')}>
            <select
              className="ao-input"
              value={advantage}
              onChange={(event) => setAdvantage(event.target.value as RollAdvantageMode)}
            >
              {ADVANTAGE_MODES.map((mode) => (
                <option key={mode} value={mode}>{t(`campfire.watch.advantage.${mode}`)}</option>
              ))}
            </select>
          </OrdoField>
        </div>

        <label className={s.toggle}>
          <input type="checkbox" checked={hideDc} onChange={(event) => setHideDc(event.target.checked)} />
          <span className="ao-italic">{t('campfire.watch.checkHideDc')}</span>
        </label>
      </div>
    </ModalScene>
  );
}
