/**
 * GM falling (Phase 3.4): apply fall damage to a combatant that drops from a height — 1d6 per 10ft
 * (cap 20d6) + prone. The core rolls the dice (or the GM can enter a ready total), applies the damage
 * through the shared HP primitive, knocks the target prone, and clears its flying flag. Typical trigger:
 * a flying creature loses flight over open air, or the GM adjudicates a shove off a ledge.
 */

import { useState } from 'react';
import { useFall } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from './workspace.module.css';

export function FallPanel({
  campaignId,
  battle,
}: {
  campaignId: string;
  battle: BattleResponse;
}) {
  const t = useT();
  const fall = useFall();
  const [combatantId, setCombatantId] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [manualStr, setManualStr] = useState('');
  const [prone, setProne] = useState(true);

  const alive = battle.combatants.filter((c) => c.currentHp == null || c.currentHp > 0);

  const trigger = () => {
    const heightFt = parseInt(heightStr, 10);
    if (!combatantId || !heightStr || Number.isNaN(heightFt)) return;
    const manual = parseInt(manualStr, 10);
    fall.mutate({
      campaignId,
      battleId: battle.id,
      data: {
        combatantId,
        heightFt,
        manualTotal: manualStr && !Number.isNaN(manual) ? manual : undefined,
        applyProne: prone,
      },
    });
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.fall.title')}</div>
      <div className={cn('ao-col ao-gap-4', s.mt8)}>
        <select
          className={cn('ao-input', s.condSelect)}
          value={combatantId}
          onChange={(e) => setCombatantId(e.target.value)}
        >
          <option value="">{t('tactical.fall.pickTarget')}</option>
          {alive.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
        <div className="ao-row ao-gap-4 ao-wrap">
          <input
            className={cn('ao-input', s.numField)}
            inputMode="numeric"
            value={heightStr}
            placeholder={t('tactical.fall.height')}
            onChange={(e) => setHeightStr(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <input
            className={cn('ao-input', s.numField)}
            inputMode="numeric"
            value={manualStr}
            placeholder={t('tactical.fall.manual')}
            onChange={(e) => setManualStr(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <label className="ao-row ao-gap-8">
          <input type="checkbox" checked={prone} onChange={(e) => setProne(e.target.checked)} />
          <span className={s.hint}>{t('tactical.fall.prone')}</span>
        </label>
        <button
          type="button"
          className="ao-btn ao-btn--sm ao-btn--danger"
          disabled={!combatantId || !heightStr || fall.isPending}
          onClick={trigger}
        >
          {t('tactical.fall.trigger')}
        </button>
      </div>
    </div>
  );
}
