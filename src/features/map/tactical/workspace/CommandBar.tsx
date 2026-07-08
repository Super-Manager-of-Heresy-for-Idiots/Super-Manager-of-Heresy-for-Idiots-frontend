/**
 * Top command bar of the unified workspace: encounter identity, a read-only phase
 * indicator (Подготовка → Бой → Итоги, driven by battle status), round + current
 * turn, and the phase-appropriate actions. GM: start battle (prep) / next turn +
 * end battle (combat), plus the tactical-map attach button. Player: a turn-status
 * badge. All actions go through the existing core battle hooks.
 */

import { useState } from 'react';
import { Rune } from '@/components/ordo';
import { useEndBattle, useEndTurn, useStartBattle } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import { BattleTacticalMapButton } from '../BattleTacticalMapButton';
import { currentTurnCombatant } from '../tacticalView';
import s from './workspace.module.css';

interface CommandBarProps {
  campaignId: string;
  battle: BattleResponse;
  isGm: boolean;
  currentUserId: string | null;
}

const PHASES = ['ASSEMBLING', 'ACTIVE', 'COMPLETED'] as const;
const PHASE_LABEL: Record<(typeof PHASES)[number], string> = {
  ASSEMBLING: 'tactical.phase.prep',
  ACTIVE: 'tactical.phase.combat',
  COMPLETED: 'tactical.phase.done',
};

export function CommandBar({ campaignId, battle, isGm, currentUserId }: CommandBarProps) {
  const t = useT();
  const startBattle = useStartBattle();
  const endTurn = useEndTurn();
  const endBattle = useEndBattle();
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const isAssembling = battle.status === 'ASSEMBLING';
  const isActive = battle.status === 'ACTIVE';
  const phaseIndex = PHASES.indexOf(battle.status as (typeof PHASES)[number]);
  const current = currentTurnCombatant(battle.combatants);
  const isMyTurn = current?.type === 'CHARACTER' && current.ownerUserId === currentUserId;

  return (
    <header className={cn('ao-panel', s.command, isActive && s.commandCombat)}>
      <div className={s.commandId}>
        <p className={cn('ao-overline', s.goldOverline)}>
          {isGm ? t('tactical.cmd.kickerGm') : t('tactical.cmd.kickerPlayer')}
        </p>
        <h3 className={cn('ao-h3', s.commandName)}>{battle.name}</h3>
      </div>

      <div className={cn('ao-row ao-gap-4', s.steps)} aria-hidden="true">
        {PHASES.map((p, i) => (
          <span key={p} className={s.stepWrap}>
            {i > 0 && <span className={s.stepDash} />}
            <span className={cn(s.step, i === phaseIndex && s.stepActive, i < phaseIndex && s.stepDone)}>
              {i + 1} · {t(PHASE_LABEL[p])}
            </span>
          </span>
        ))}
      </div>

      <div className={cn('ao-row ao-gap-16', s.commandMeta)}>
        {isActive && (
          <>
            <span className={s.metaStat}>
              <span className={cn('ao-overline', s.metaLbl)}>{t('tactical.cmd.round')}</span>
              <span className={s.metaVal}>{battle.roundNumber}</span>
            </span>
            <span className={cn(s.metaStat, s.metaTurn)}>
              <span className={cn('ao-overline', s.metaLbl)}>{t('tactical.cmd.turnLabel')}</span>
              <span className={s.metaVal}>{current?.displayName ?? '—'}</span>
            </span>
          </>
        )}

        {isGm ? (
          <div className={cn('ao-row ao-gap-8', s.gmActions)}>
            {isAssembling && (
              <button
                className="ao-btn ao-btn--primary"
                onClick={() => startBattle.mutate({ campaignId, battleId: battle.id })}
                disabled={battle.monsterCount === 0 || startBattle.isPending}
                title={battle.monsterCount === 0 ? t('tactical.cmd.needMonsters') : undefined}
              >
                <Rune kind="sword" size={14} color="currentColor" />
                <span className={s.ml6}>{t('tactical.cmd.startCombat')}</span>
              </button>
            )}
            {isActive && (
              <>
                <button
                  className="ao-btn ao-btn--primary"
                  onClick={() => endTurn.mutate({ campaignId, battleId: battle.id })}
                  disabled={!current || endTurn.isPending}
                >
                  <Rune kind="arrow-r" size={14} color="currentColor" />
                  <span className={s.ml6}>{t('tactical.cmd.nextTurn')}</span>
                </button>
                {confirmingEnd ? (
                  <span className="ao-row ao-gap-4">
                    <button
                      className="ao-btn ao-btn--danger"
                      onClick={() => endBattle.mutate({ campaignId, battleId: battle.id })}
                      disabled={endBattle.isPending}
                    >
                      {t('tactical.cmd.endCombat')}
                    </button>
                    <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmingEnd(false)}>
                      {t('tactical.cmd.cancel')}
                    </button>
                  </span>
                ) : (
                  <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmingEnd(true)}>
                    {t('tactical.cmd.endCombat')}
                  </button>
                )}
              </>
            )}
            {battle.status !== 'COMPLETED' && (
              <BattleTacticalMapButton
                campaignId={campaignId}
                battleId={battle.id}
                battleName={battle.name}
              />
            )}
          </div>
        ) : (
          <span className={cn(s.playerStatus, isActive && s.playerStatusActive)}>
            {isActive
              ? isMyTurn
                ? t('battle.action.title')
                : t('tactical.cmd.currentTurn', { name: current?.displayName ?? '—' })
              : t('tactical.cmd.waiting')}
          </span>
        )}
      </div>
    </header>
  );
}
