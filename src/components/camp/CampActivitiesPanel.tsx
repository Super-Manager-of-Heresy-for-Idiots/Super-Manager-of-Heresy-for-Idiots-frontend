import { useEffect, useMemo, useState } from 'react';
import { OrdoDivider, OrdoField, OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import {
  useAssignCampActivity,
  useCampActivities,
  useCreateCampActivity,
  useDeleteCampActivity,
} from '@/hooks/useCamp';
import { useT } from '@/i18n/I18nContext';
import type { CampActivityKind, CampSessionResponse } from '@/types';
import s from './CampActivitiesPanel.module.css';

interface CampActivitiesPanelProps {
  campaignId: string;
  camp: CampSessionResponse;
  isGm: boolean;
  /** Персонажи текущего пользователя — для подсказки игроку, чем он занят. */
  ownCharacterIds: string[];
}

type Tab = 'ALL' | CampActivityKind;

const TABS: Tab[] = ['ALL', 'SYSTEM', 'CUSTOM'];

/**
 * Даунтайм-активности привала. Механических автоэффектов нет: система фиксирует,
 * чем занят персонаж, а награды мастер выдаёт обычными инструментами.
 */
export function CampActivitiesPanel({ campaignId, camp, isGm, ownCharacterIds }: CampActivitiesPanelProps) {
  const t = useT();
  const { data: activities } = useCampActivities(campaignId);
  const assignActivity = useAssignCampActivity();
  const createActivity = useCreateCampActivity();
  const deleteActivity = useDeleteCampActivity();

  const [tab, setTab] = useState<Tab>('ALL');
  const [selectedId, setSelectedId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [note, setNote] = useState('');
  const [customName, setCustomName] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  const rows = useMemo(
    () => (activities ?? []).filter((activity) => tab === 'ALL' || activity.kind === tab),
    [activities, tab],
  );

  const ownParticipants = camp.participants.filter(
    (participant) => ownCharacterIds.includes(participant.characterId),
  );

  // Состав привала меняется на лету: выбранный получатель должен оставаться
  // существующим участником, иначе select показывает первого, а отправился бы пустой id.
  useEffect(() => {
    const stillInParty = camp.participants.some((participant) => participant.characterId === targetId);
    if (!stillInParty) {
      setTargetId(camp.participants[0]?.characterId ?? '');
    }
  }, [camp.participants, targetId]);

  const assign = (clear = false) => {
    if (!targetId) return;
    assignActivity.mutate({
      campaignId,
      campId: camp.id,
      characterId: targetId,
      data: clear
        ? { activityId: null }
        : { activityId: selectedId || null, note: note.trim() || undefined },
    });
  };

  return (
    <OrdoPanel padding={0}>
      <PanelHeader
        title={t('campfire.activity.title')}
        sub={t('campfire.activity.sub')}
        glyph="book"
        right={isGm ? (
          <button className="ao-btn ao-btn--sm" onClick={() => setCustomOpen((prev) => !prev)}>
            <Rune kind="plus-sm" size={11} />
            {t('campfire.activity.custom')}
          </button>
        ) : undefined}
      />

      <div className={s.body}>
        <div className={s.tabs}>
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              className={`${s.tab} ${tab === key ? s.tabOn : ''}`}
              onClick={() => setTab(key)}
            >
              {t(`campfire.activity.tab.${key}`)}
            </button>
          ))}
        </div>

        <div className={s.grid}>
          {rows.length === 0 && (
            <span className={`ao-italic ${s.quiet}`}>{t('campfire.activity.empty')}</span>
          )}
          {rows.map((activity) => (
            <div
              key={activity.id}
              className={`${s.card} ${selectedId === activity.id ? s.cardOn : ''}`}
            >
              <button type="button" className={s.cardBody} onClick={() => setSelectedId(activity.id)}>
                <Rune
                  kind={activity.iconCode || 'book'}
                  size={13}
                  color={selectedId === activity.id ? 'var(--gold-pale)' : 'var(--ink-quiet)'}
                />
                <span className={s.cardText}>
                  <span className={s.cardName}>{activity.name}</span>
                  {activity.kind === 'CUSTOM' && (
                    <span className="ao-codex">{t('campfire.activity.customTag')}</span>
                  )}
                  {activity.description && (
                    <span className={`ao-italic ${s.cardDesc}`}>{activity.description}</span>
                  )}
                </span>
              </button>
              {isGm && activity.kind === 'CUSTOM' && (
                <button
                  className="ao-iconbtn"
                  title={t('campfire.activity.delete')}
                  disabled={deleteActivity.isPending}
                  onClick={() => deleteActivity.mutate({ campaignId, activityId: activity.id })}
                >
                  <Rune kind="minus" size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        {isGm && customOpen && (
          <div className={s.customForm}>
            <OrdoField label={t('campfire.activity.customName')} required>
              <input
                className="ao-input"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </OrdoField>
            <button
              className="ao-btn ao-btn--sm ao-btn--primary"
              disabled={!customName.trim() || createActivity.isPending}
              onClick={() => createActivity.mutate(
                { campaignId, data: { name: customName.trim() } },
                {
                  onSuccess: () => {
                    setCustomName('');
                    setCustomOpen(false);
                  },
                },
              )}
            >
              <Rune kind="check" size={11} />
              {t('campfire.activity.customSubmit')}
            </button>
          </div>
        )}

        {isGm ? (
          <>
            <OrdoDivider />
            <div className={s.assignRow}>
              <OrdoField label={t('campfire.activity.target')}>
                <select
                  className="ao-input"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                >
                  {camp.participants.map((participant) => (
                    <option key={participant.id} value={participant.characterId}>
                      {participant.characterName}
                    </option>
                  ))}
                </select>
              </OrdoField>
              <OrdoField label={t('campfire.activity.note')}>
                <input
                  className="ao-input"
                  value={note}
                  placeholder={t('campfire.activity.notePh')}
                  onChange={(event) => setNote(event.target.value)}
                />
              </OrdoField>
            </div>

            <p className={`ao-italic ${s.quiet}`}>{t('campfire.activity.noAutoEffects')}</p>

            <div className={s.assignActions}>
              <button
                className="ao-btn ao-btn--primary"
                disabled={!targetId || !selectedId || assignActivity.isPending}
                onClick={() => assign()}
              >
                <Rune kind="check" size={12} />
                {t('campfire.activity.assign')}
              </button>
              <button
                className="ao-btn ao-btn--ghost"
                disabled={!targetId || assignActivity.isPending}
                onClick={() => assign(true)}
              >
                <Rune kind="minus" size={12} />
                {t('campfire.activity.clear')}
              </button>
            </div>
          </>
        ) : (
          <p className={`ao-italic ${s.quiet}`}>
            {ownParticipants.length === 0
              ? t('campfire.activity.playerNone')
              : ownParticipants
                .map((participant) => t('campfire.activity.playerCurrent', {
                  character: participant.characterName,
                  activity: participant.activityName || t('campfire.party.noActivity'),
                }))
                .join(' · ')}
          </p>
        )}
      </div>
    </OrdoPanel>
  );
}
