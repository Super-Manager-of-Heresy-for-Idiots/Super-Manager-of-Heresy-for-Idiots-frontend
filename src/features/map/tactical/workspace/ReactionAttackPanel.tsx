/**
 * GM resolution of a reaction / opportunity attack (Phase 2.8). Pick a reactor that still has its
 * reaction, then resolve one of its attacks against a target — out of turn, spending the reaction
 * (not an action) through the same core attack endpoint. Attacks for the (non-active) reactor are
 * fetched on demand via the combatant-turn endpoint.
 */

import { useMemo, useState } from 'react';
import { useCombatantTurn } from '@/hooks/useBattles';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import type { TacticalTokenView } from '../tacticalView';
import { AttackForm } from './AttackForm';
import { characterAttackOptions, liveTargets, monsterAttackOptions } from './combat';
import s from './workspace.module.css';

export function ReactionAttackPanel({
  campaignId,
  battle,
  tacticalTokens,
}: {
  campaignId: string;
  battle: BattleResponse;
  tacticalTokens: TacticalTokenView[];
}) {
  const t = useT();
  const { lang } = useI18n();
  const [reactorId, setReactorId] = useState('');

  // Any living combatant that has not yet used its reaction this round can make one.
  const reactors = battle.combatants.filter(
    (c) => !c.reactionUsed && (c.currentHp == null || c.currentHp > 0),
  );
  const reactor = reactors.find((c) => c.id === reactorId) ?? null;

  const { data: turn, isLoading } = useCombatantTurn(campaignId, battle.id, reactorId || undefined, !!reactorId);

  const attacks = useMemo(() => {
    if (!reactor) return [];
    return reactor.type === 'MONSTER' ? monsterAttackOptions(turn, lang) : characterAttackOptions(turn);
  }, [reactor, turn, lang]);

  const targets = useMemo(() => (reactor ? liveTargets(battle.combatants, reactor) : []), [battle.combatants, reactor]);

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.reaction.title')}</div>
      <div className={s.hint}>{t('battle.reaction.hint')}</div>

      <select
        className={cn('ao-input', s.condSelect, s.mt8)}
        value={reactorId}
        onChange={(e) => setReactorId(e.target.value)}
      >
        <option value="">{t('battle.reaction.pickReactor')}</option>
        {reactors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.displayName}
          </option>
        ))}
      </select>

      {reactor && isLoading && <div className={cn('ao-breathe', s.mt8)}>…</div>}
      {reactor && !isLoading && attacks.length === 0 && (
        <div className={cn(s.muted, s.mt8)}>{t('battle.reaction.noAttacks')}</div>
      )}
      {reactor && attacks.length > 0 && (
        <div className={s.mt8}>
          <AttackForm
            campaignId={campaignId}
            battleId={battle.id}
            attacks={attacks}
            targets={targets}
            tacticalTokens={tacticalTokens}
            attackerCombatantId={reactor.id}
            allowRangeOverride
            reaction
          />
        </div>
      )}
    </div>
  );
}
