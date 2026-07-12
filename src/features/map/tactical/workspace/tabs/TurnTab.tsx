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
import { StandardActionsPanel } from '../StandardActionsPanel';
import { ReactionAttackPanel } from '../ReactionAttackPanel';
import { MonsterRuntimePanel } from '../MonsterRuntimePanel';
import { ForcedMovementPanel } from '../ForcedMovementPanel';
import { AuraPanel } from '../AuraPanel';
import { TrapPanel } from '../TrapPanel';
import { DoorPanel } from '../DoorPanel';
import { BulkActionsPanel } from '../BulkActionsPanel';
import { DefaultActions } from '../DefaultActions';
import { liveTargets, monsterAttackOptions } from '../combat';
import type { MovementConfig } from '../movement';
import { currentTurnCombatant, type TacticalTokenView } from '../../tacticalView';
import s from '../workspace.module.css';

interface TurnTabProps {
  campaignId: string;
  battle: BattleResponse;
  movement: MovementConfig | null;
  tacticalTokens: TacticalTokenView[];
  mapSessionId?: string | null;
}

export function TurnTab({ campaignId, battle, movement, tacticalTokens, mapSessionId }: TurnTabProps) {
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
      <DefaultActions movement={movement} tacticalTokens={tacticalTokens} />
      {isMonsterTurn && (
        <>
          {current.attacksRemaining != null && (
            <p className={cn('ao-num', s.tabSub)}>
              {t('battle.multiattack.remaining', { n: current.attacksRemaining })}
            </p>
          )}
          <AttackForm
            campaignId={campaignId}
            battleId={battle.id}
            attacks={attacks}
            targets={targets}
            tacticalTokens={tacticalTokens}
            attackerCombatantId={current.id}
            allowRangeOverride
            isGm
          />
          <StandardActionsPanel campaignId={campaignId} battle={battle} combatant={current} />
        </>
      )}
      <ReactionAttackPanel campaignId={campaignId} battle={battle} tacticalTokens={tacticalTokens} />
      <MonsterRuntimePanel campaignId={campaignId} battle={battle} />
      <ForcedMovementPanel campaignId={campaignId} battle={battle} tacticalTokens={tacticalTokens} />
      {mapSessionId && <AuraPanel sessionId={mapSessionId} tacticalTokens={tacticalTokens} />}
      {mapSessionId && <TrapPanel campaignId={campaignId} sessionId={mapSessionId} battle={battle} />}
      {mapSessionId && <DoorPanel sessionId={mapSessionId} />}
      <BulkActionsPanel campaignId={campaignId} battle={battle} />
    </div>
  );
}
