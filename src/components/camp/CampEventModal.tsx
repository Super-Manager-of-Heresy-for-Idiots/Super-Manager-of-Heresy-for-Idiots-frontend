import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { useI18n, useT } from '@/i18n/I18nContext';
import type { CampEventType, CampMonsterEntry, CreateCampEventRequest } from '@/types';
import s from './CampEventModal.module.css';

const EVENT_TYPES: { type: CampEventType; tone: string; glyph: string }[] = [
  { type: 'AMBUSH',    tone: 'var(--ember)',     glyph: 'sword' },
  { type: 'ENCOUNTER', tone: 'var(--gold)',      glyph: 'helm' },
  { type: 'STORY',     tone: 'var(--arcane)',    glyph: 'scroll' },
  { type: 'WEATHER',   tone: '#7fa8c4',          glyph: 'tri' },
  { type: 'CUSTOM',    tone: 'var(--ink-quiet)', glyph: 'diamond' },
];

interface CampEventModalProps {
  open: boolean;
  campaignId: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCampEventRequest) => void;
}

/**
 * Запись события журнала. Механических автоэффектов у события нет; исключение —
 * засада, из которой мастер может создать бой: тогда привал перейдёт в INTERRUPTED.
 */
export function CampEventModal({ open, campaignId, busy, onOpenChange, onSubmit }: CampEventModalProps) {
  const t = useT();
  const { lang } = useI18n();
  const { data: monsters } = useCampaignMonsters(campaignId);

  const [type, setType] = useState<CampEventType>('STORY');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occurredLabel, setOccurredLabel] = useState('');
  const [triggerNow, setTriggerNow] = useState(true);
  const [createBattle, setCreateBattle] = useState(false);
  const [battleName, setBattleName] = useState('');
  const [entries, setEntries] = useState<CampMonsterEntry[]>([]);

  const monsterOptions = useMemo(
    () => (monsters ?? []).map((monster) => ({
      id: monster.id,
      name: (lang === 'ru' ? monster.nameRusloc : monster.nameEngloc || monster.nameRusloc)
        || monster.name
        || monster.slug,
    })),
    [monsters, lang],
  );

  const ambush = type === 'AMBUSH';
  const withBattle = ambush && createBattle;
  const canSubmit = !busy
    && title.trim().length > 0
    && (!withBattle || entries.some((entry) => entry.monsterId && entry.count > 0));

  const addEntry = () => setEntries((prev) => [...prev, { monsterId: '', count: 1 }]);
  const patchEntry = (index: number, patch: Partial<CampMonsterEntry>) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };
  const removeEntry = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const submit = () => {
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      occurredLabel: occurredLabel.trim() || undefined,
      triggerNow,
      createBattle: withBattle,
      battleName: withBattle ? (battleName.trim() || undefined) : undefined,
      monsters: withBattle
        ? entries.filter((entry) => entry.monsterId && entry.count > 0)
        : undefined,
    });
  };

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      overline={t('campfire.log.title')}
      title={t('campfire.log.add')}
      sub={t('campfire.log.addSub')}
      rune="scroll"
      danger={ambush}
      width={620}
      footer={(
        <div className={s.footer}>
          <button className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)}>
            {t('campfire.setup.cancel')}
          </button>
          <button
            className={`ao-btn ${ambush ? 'ao-btn--danger' : 'ao-btn--primary'}`}
            disabled={!canSubmit}
            onClick={submit}
          >
            <Rune kind={ambush ? 'sword' : 'check'} size={12} />
            {t(withBattle ? 'campfire.log.submitWithBattle' : 'campfire.log.submit')}
          </button>
        </div>
      )}
    >
      <div className={s.body}>
        <OrdoField label={t('campfire.log.type')}>
          <div className={s.types}>
            {EVENT_TYPES.map((option) => (
              <button
                key={option.type}
                type="button"
                className={`${s.typeBtn} ${type === option.type ? s.typeBtnOn : ''}`}
                style={{ '--tone': option.tone } as CSSProperties}
                onClick={() => setType(option.type)}
              >
                <Rune
                  kind={option.glyph}
                  size={12}
                  color={type === option.type ? option.tone : 'var(--ink-ghost)'}
                />
                {t(`campfire.event.${option.type}`)}
              </button>
            ))}
          </div>
        </OrdoField>

        <div className={s.row}>
          <div className={s.time}>
            <OrdoField label={t('campfire.log.time')}>
              <input
                className="ao-input"
                value={occurredLabel}
                placeholder={t('campfire.log.timePh')}
                onChange={(event) => setOccurredLabel(event.target.value)}
              />
            </OrdoField>
          </div>
          <div className={s.grow}>
            <OrdoField label={t('campfire.log.titleField')} required>
              <input
                className="ao-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </OrdoField>
          </div>
        </div>

        <OrdoField label={t('campfire.log.description')} hint={t('campfire.log.descriptionHint')}>
          <textarea
            className="ao-input"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </OrdoField>

        <label className={s.toggle}>
          <input
            type="checkbox"
            checked={triggerNow}
            onChange={(event) => setTriggerNow(event.target.checked)}
          />
          <span className="ao-italic">{t('campfire.log.triggerNow')}</span>
        </label>

        {ambush && (
          <div className={s.ambush}>
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={createBattle}
                onChange={(event) => setCreateBattle(event.target.checked)}
              />
              <span className="ao-italic">{t('campfire.log.createBattle')}</span>
            </label>

            {createBattle && (
              <>
                <OrdoField label={t('campfire.log.battleName')}>
                  <input
                    className="ao-input"
                    value={battleName}
                    onChange={(event) => setBattleName(event.target.value)}
                  />
                </OrdoField>

                <OrdoField label={t('campfire.log.monsters')} required>
                  <div className={s.entries}>
                    {entries.map((entry, index) => (
                      <div key={index} className={s.entry}>
                        <select
                          className="ao-input"
                          value={entry.monsterId}
                          onChange={(event) => patchEntry(index, { monsterId: event.target.value })}
                        >
                          <option value="">{t('campfire.log.monsterNone')}</option>
                          {monsterOptions.map((monster) => (
                            <option key={monster.id} value={monster.id}>{monster.name}</option>
                          ))}
                        </select>
                        <input
                          className={`ao-input ${s.count}`}
                          type="number"
                          min={1}
                          max={50}
                          value={entry.count}
                          onChange={(event) => patchEntry(index, {
                            count: Math.max(1, Math.min(50, Number(event.target.value) || 1)),
                          })}
                        />
                        <button
                          className="ao-iconbtn"
                          title={t('campfire.log.monsterRemove')}
                          onClick={() => removeEntry(index)}
                        >
                          <Rune kind="minus" size={11} />
                        </button>
                      </div>
                    ))}
                    <button className="ao-btn ao-btn--sm" onClick={addEntry}>
                      <Rune kind="plus-sm" size={11} />
                      {t('campfire.log.monsterAdd')}
                    </button>
                  </div>
                </OrdoField>

                <p className={`ao-italic ${s.hint}`}>{t('campfire.log.battleHint')}</p>
              </>
            )}
          </div>
        )}
      </div>
    </ModalScene>
  );
}
