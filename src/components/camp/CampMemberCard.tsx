import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampParticipantResponse } from '@/types';
import { CampRestStateTag } from './CampBadges';
import s from './CampMemberCard.module.css';

interface CampMemberCardProps {
  participant: CampParticipantResponse;
  /** Компактный вариант для архива и приглушённого состояния ошибки. */
  dense?: boolean;
}

/**
 * Карточка участника привала: хиты, кости хитов, состояние отдыха, дозор и активность.
 * Ошибка транзакции живёт здесь же — отдых применяется per-character.
 */
export function CampMemberCard({ participant, dense }: CampMemberCardProps) {
  const t = useT();
  const failed = participant.state === 'FAILED';
  const rested = participant.state === 'RESTED';
  const hp = participant.currentHp ?? 0;
  const maxHp = participant.maxHp ?? 0;
  const hpPercent = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const hitDiceRemaining = (participant.hitDice ?? []).reduce((sum, die) => sum + die.remaining, 0);
  const hitDiceTotal = (participant.hitDice ?? []).reduce((sum, die) => sum + die.total, 0);
  const classes = (participant.classLevels ?? [])
    .map((cl) => `${cl.className ?? ''} ${cl.classLevel}`.trim())
    .join(' · ');

  return (
    <div
      className={`${s.card} ${dense ? s.dense : ''} ${failed ? s.failed : ''} ${rested ? s.rested : ''}`}
      data-testid="camp-member"
      data-state={participant.state}
    >
      <div className={s.portrait}>
        {participant.avatarUrl
          ? <img className={s.avatar} src={participant.avatarUrl} alt="" />
          : <Rune kind="helm" size={dense ? 20 : 24} color="var(--ink-quiet)" />}
      </div>

      <div className={s.body}>
        <div className={s.titleRow}>
          <span className="ao-h6">{participant.characterName}</span>
          {classes && <span className="ao-codex">{classes}</span>}
          <span className={s.spacer} />
          <CampRestStateTag state={participant.state} onWatch={participant.watchSlot != null} />
        </div>

        <div className={s.stats}>
          <span className={s.stat}>
            <span className="ao-overline">{t('campfire.party.hp')}</span>
            <span className="ao-num">{hp}<span className={s.statMax}>/{maxHp}</span></span>
            <span className={s.bar}>
              <span className={s.barFill} style={{ '--fill': `${hpPercent}%` } as CSSProperties} />
            </span>
          </span>

          {hitDiceTotal > 0 && (
            <span className={s.stat}>
              <span className="ao-overline">{t('campfire.party.hitDice')}</span>
              <span className="ao-num">
                {hitDiceRemaining}<span className={s.statMax}>/{hitDiceTotal}</span>
              </span>
            </span>
          )}
        </div>

        {failed && participant.restErrorCode && (
          <div className={s.error}>
            <span className="ao-codex">{participant.restErrorCode}</span>
            <div className={s.errorText}>
              {participant.restErrorMessage || t(`campfire.restError.${participant.restErrorCode}`)}
            </div>
          </div>
        )}

        <div className={s.tags}>
          <span className={`${s.tag} ${participant.watchSlot != null ? s.tagOn : ''}`}>
            <Rune
              kind="eye"
              size={11}
              color={participant.watchSlot != null ? 'var(--gold-pale)' : 'var(--ink-ghost)'}
            />
            {participant.watchSlot != null
              ? `${t('campfire.party.watch', { slot: participant.watchSlot })}${
                participant.watchSlotLabel ? ` · ${participant.watchSlotLabel}` : ''}`
              : t('campfire.party.noWatch')}
          </span>

          <span className={`${s.tag} ${participant.activityName ? s.tagArcane : ''}`}>
            <Rune
              kind={participant.activityIconCode || 'book'}
              size={11}
              color={participant.activityName ? 'var(--arcane)' : 'var(--ink-ghost)'}
            />
            {participant.activityName || t('campfire.party.noActivity')}
          </span>
        </div>

        {participant.activityNote && (
          <div className={`ao-italic ${s.note}`}>{participant.activityNote}</div>
        )}
      </div>
    </div>
  );
}
