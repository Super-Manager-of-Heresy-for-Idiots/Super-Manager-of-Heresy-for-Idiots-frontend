import { useMemo, useState } from 'react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useCampaignLocations } from '@/hooks/useLocations';
import { useT } from '@/i18n/I18nContext';
import type { CampWatchSlotRequest, CreateCampRequest } from '@/types';
import { CampSafetyBadge } from './CampBadges';
import s from './CampSetupModal.module.css';

interface CampSetupModalProps {
  open: boolean;
  campaignId: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCampRequest) => void;
}

/** Слоты дозора создаются по числу, заданному мастером: значений по умолчанию нет. */
const DEFAULT_WATCH_SLOTS = 0;

/**
 * Разбивка лагеря: локация с её меткой безопасности, состав отряда и первичное
 * расписание дозора. Привал создаётся в статусе SETTING_UP.
 */
export function CampSetupModal({ open, campaignId, busy, onOpenChange, onSubmit }: CampSetupModalProps) {
  const t = useT();
  const { data: characters } = useCampaignCharacters(campaignId);
  const { data: locations } = useCampaignLocations(campaignId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [locationId, setLocationId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [slotCount, setSlotCount] = useState(DEFAULT_WATCH_SLOTS);
  const [slots, setSlots] = useState<Record<number, CampWatchSlotRequest>>({});

  const location = useMemo(
    () => locations?.find((item) => item.id === locationId),
    [locations, locationId],
  );
  const chosenCharacters = useMemo(
    () => (characters ?? []).filter((character) => selected.includes(character.id)),
    [characters, selected],
  );
  const safetyHint = location?.restSafety && location.restSafety !== 'SAFE'
    ? t(`campfire.safety.hint.${location.restSafety}`)
    : null;

  const toggleCharacter = (characterId: string) => {
    setSelected((prev) => (prev.includes(characterId)
      ? prev.filter((id) => id !== characterId)
      : [...prev, characterId]));
  };

  const patchSlot = (slot: number, patch: Partial<CampWatchSlotRequest>) => {
    setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], slot, ...patch } }));
  };

  const submit = () => {
    const watchSchedule = Array.from({ length: slotCount }, (_, index) => index + 1)
      .map((slot) => slots[slot] ?? { slot })
      // Персонаж, выбывший из состава после назначения, в дозор не попадает.
      .map((entry) => (entry.characterId && !selected.includes(entry.characterId)
        ? { ...entry, characterId: null }
        : entry));

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      dayNumber: dayNumber ? Number(dayNumber) : undefined,
      locationId: locationId || undefined,
      participantCharacterIds: selected,
      watchSlotCount: slotCount,
      watchSchedule,
    });
  };

  const canSubmit = !busy && name.trim().length > 0 && selected.length > 0;

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      overline={t('campfire.overline')}
      title={t('campfire.setup.title')}
      sub={t('campfire.setup.sub')}
      rune="flame"
      width={880}
      footer={(
        <div className={s.footer}>
          <button className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)}>
            {t('campfire.setup.cancel')}
          </button>
          <button
            className="ao-btn ao-btn--primary ao-btn--lg"
            data-testid="camp-setup-submit"
            disabled={!canSubmit}
            onClick={submit}
          >
            <Rune kind="flame" size={13} />
            {t('campfire.setup.submit')}
          </button>
        </div>
      )}
    >
      <div className={s.grid}>
        <div className={s.column}>
          <OrdoField label={t('campfire.setup.name')} required>
            <input
              className="ao-input"
              data-testid="camp-setup-name"
              value={name}
              placeholder={t('campfire.setup.namePh')}
              onChange={(event) => setName(event.target.value)}
            />
          </OrdoField>

          <OrdoField label={t('campfire.setup.description')}>
            <textarea
              className="ao-input"
              rows={2}
              value={description}
              placeholder={t('campfire.setup.descriptionPh')}
              onChange={(event) => setDescription(event.target.value)}
            />
          </OrdoField>

          <div className={s.row}>
            <OrdoField label={t('campfire.setup.day')}>
              <input
                className="ao-input"
                type="number"
                min={1}
                value={dayNumber}
                onChange={(event) => setDayNumber(event.target.value)}
              />
            </OrdoField>
            <OrdoField label={t('campfire.setup.watchCount')}>
              <input
                className="ao-input"
                type="number"
                min={0}
                max={12}
                value={slotCount}
                onChange={(event) => setSlotCount(Math.max(0, Math.min(12, Number(event.target.value) || 0)))}
              />
            </OrdoField>
          </div>

          <OrdoField label={t('campfire.setup.location')}>
            <select
              className="ao-input"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">{t('campfire.setup.locationNone')}</option>
              {(locations ?? []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </OrdoField>

          {location?.restSafety && (
            <div className={s.safetyRow}>
              <CampSafetyBadge level={location.restSafety} />
              {safetyHint && <span className={`ao-italic ${s.hint}`}>{safetyHint}</span>}
            </div>
          )}
        </div>

        <div className={s.column}>
          <OrdoField
            label={t('campfire.setup.party', {
              chosen: selected.length,
              total: characters?.length ?? 0,
            })}
            required
          >
            <div className={s.party}>
              {(characters ?? []).length === 0 && (
                <span className={`ao-italic ${s.hint}`}>{t('campfire.setup.noCharacters')}</span>
              )}
              {(characters ?? []).map((character) => {
                const on = selected.includes(character.id);
                return (
                  <button
                    key={character.id}
                    type="button"
                    className={`${s.partyRow} ${on ? s.partyRowOn : ''}`}
                    data-testid="camp-setup-character"
                    data-selected={on}
                    onClick={() => toggleCharacter(character.id)}
                  >
                    <span className={s.check}>
                      {on && <Rune kind="check" size={10} color="var(--gold-pale)" />}
                    </span>
                    <span className={s.partyName}>{character.name}</span>
                    <span className="ao-codex">{character.totalLevel}</span>
                  </button>
                );
              })}
            </div>
          </OrdoField>

          {slotCount > 0 && (
            <OrdoField label={t('campfire.setup.watch')} hint={t('campfire.setup.watchHint')}>
              <div className={s.watch}>
                {Array.from({ length: slotCount }, (_, index) => index + 1).map((slot) => (
                  <div key={slot} className={s.watchRow}>
                    <span className="ao-num">{slot}</span>
                    <input
                      className="ao-input"
                      value={slots[slot]?.label ?? ''}
                      placeholder={t('campfire.setup.watchLabelPh')}
                      onChange={(event) => patchSlot(slot, { label: event.target.value })}
                    />
                    <select
                      className="ao-input"
                      value={slots[slot]?.characterId ?? ''}
                      onChange={(event) => patchSlot(slot, { characterId: event.target.value || null })}
                    >
                      <option value="">{t('campfire.setup.watchNone')}</option>
                      {chosenCharacters.map((character) => (
                        <option key={character.id} value={character.id}>{character.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </OrdoField>
          )}
        </div>
      </div>
    </ModalScene>
  );
}
