/**
 * GM "Ход" tab — the active combatant's turn. When a monster is up, the GM drives
 * its attack through the shared AttackForm (core battle API). When a character is
 * up, the player controls it from their own device, so the GM only sees a note.
 * Turn advancement lives in the command bar.
 */

import { useMemo } from 'react';
import { useBattleCurrentTurn } from '@/hooks/useBattles';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import { AttackForm } from '../AttackForm';
import { DefaultActions } from '../DefaultActions';
import { liveTargets, monsterAttackOptions } from '../combat';
import type { MovementConfig } from '../movement';
import { currentTurnCombatant } from '../../tacticalView';
import s from '../workspace.module.css';

interface TurnTabProps {
  campaignId: string;
  battle: BattleResponse;
  movement: MovementConfig | null;
}

export function TurnTab({ campaignId, battle, movement }: TurnTabProps) {
  const t = useT();
  const { lang } = useI18n();
  const current = currentTurnCombatant(battle.combatants);
  const isMonsterTurn = current?.type === 'MONSTER';
  const { data: turn } = useBattleCurrentTurn(campaignId, battle.id, !!isMonsterTurn);

  const attacks = useMemo(() => monsterAttackOptions(turn, lang), [lang, turn]);
  const targets = useMemo(
    () => (current ? liveTargets(battle.combatants, current) : []),
    [battle.combatants, current],
  );

  if (!current) {
    return (
      <div className={s.tabPad}>
        <p className="ao-italic">{t('tactical.turn.empty')}</p>
      </div>
    );
  }

  return (
    <div className={s.tabPad}>
      <p className={cn('ao-overline', s.emberOverline)}>
        {isMonsterTurn ? t('battle.gm.npcControl') : t('tactical.turn.overline')}
      </p>
      <h4 className={cn('ao-h4', s.tabTitle)}>{current.displayName}</h4>
      <p className={cn('ao-italic', s.tabSub)}>
        {isMonsterTurn ? t('tactical.turn.monsterHint') : t('tactical.turn.charHint')}
      </p>
      <DefaultActions movement={movement} />
      {isMonsterTurn && (
        <AttackForm campaignId={campaignId} battleId={battle.id} attacks={attacks} targets={targets} />
      )}
    </div>
  );
}
