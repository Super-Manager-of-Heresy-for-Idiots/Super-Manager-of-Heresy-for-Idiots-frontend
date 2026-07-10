/**
 * GM monster runtime controls (Phase 2.9): legendary actions and Legendary Resistance. Legendary
 * actions are spent off-turn (in response to other creatures) from the round pool; Legendary
 * Resistance turns a failed save into an auto-success. Only monsters that have either are listed.
 */

import { useSpendAction } from '@/hooks/useBattles';
import { useLegendaryResistance } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from './workspace.module.css';

export function MonsterRuntimePanel({ campaignId, battle }: { campaignId: string; battle: BattleResponse }) {
  const t = useT();
  const spend = useSpendAction();
  const legendaryResistance = useLegendaryResistance();

  const monsters = battle.combatants.filter(
    (c) =>
      c.type === 'MONSTER' &&
      ((c.legendaryActionMax ?? 0) > 0 || (c.legendaryResistanceMax ?? 0) > 0) &&
      (c.currentHp == null || c.currentHp > 0),
  );
  if (monsters.length === 0) return null;

  const busy = spend.isPending || legendaryResistance.isPending;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.legendary.title')}</div>
      {monsters.map((c) => {
        const laMax = c.legendaryActionMax ?? 0;
        const laLeft = laMax - (c.legendaryActionSpent ?? 0);
        const lrMax = c.legendaryResistanceMax ?? 0;
        const lrLeft = lrMax - (c.legendaryResistanceUsed ?? 0);
        return (
          <div key={c.id} className={cn('ao-col ao-gap-4', s.mt8)}>
            <span className={s.optName}>{c.displayName}</span>
            <div className="ao-row ao-gap-4 ao-wrap">
              {laMax > 0 && (
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--ghost"
                  disabled={busy || laLeft <= 0}
                  onClick={() =>
                    spend.mutate({
                      campaignId,
                      battleId: battle.id,
                      combatantId: c.id,
                      data: { slot: 'LEGENDARY_ACTION' },
                    })
                  }
                >
                  {t('battle.legendary.action', { left: laLeft, max: laMax })}
                </button>
              )}
              {lrMax > 0 && (
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  disabled={busy || lrLeft <= 0}
                  onClick={() =>
                    legendaryResistance.mutate({ campaignId, battleId: battle.id, combatantId: c.id })
                  }
                >
                  {t('battle.legendary.resistance', { left: lrLeft, max: lrMax })}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
