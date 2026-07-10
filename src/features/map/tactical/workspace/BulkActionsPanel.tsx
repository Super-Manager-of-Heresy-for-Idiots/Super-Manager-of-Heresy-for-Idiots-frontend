/**
 * GM mass operations (Phase 2.4): pick several combatants, then damage or heal them in one shot —
 * "8 goblins take 12" in two clicks. Damage can carry a save-for-half (each target rolls its own,
 * server AUTO). Goes through the core `/bulk-action` endpoint, which reuses the same per-target
 * primitives (mitigation, save, HP) as the single-target flows. Bulk conditions are a follow-up
 * (they need the condition reference list, not yet on the FE).
 */

import { useMemo, useState } from 'react';
import { Rune } from '@/components/ordo';
import { useBulkAction } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from './workspace.module.css';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export function BulkActionsPanel({ campaignId, battle }: { campaignId: string; battle: BattleResponse }) {
  const t = useT();
  const bulk = useBulkAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'DAMAGE' | 'HEAL'>('DAMAGE');
  const [amountStr, setAmountStr] = useState('');
  const [saveOn, setSaveOn] = useState(false);
  const [dcStr, setDcStr] = useState('');
  const [ability, setAbility] = useState<(typeof ABILITIES)[number]>('dex');
  const [half, setHalf] = useState(true);

  const alive = useMemo(
    () => battle.combatants.filter((c) => c.currentHp == null || c.currentHp > 0),
    [battle.combatants],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectMonsters = () => setSelected(new Set(alive.filter((c) => c.type === 'MONSTER').map((c) => c.id)));
  const clear = () => setSelected(new Set());

  const amount = parseInt(amountStr, 10);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const dc = parseInt(dcStr, 10);
  const dcValid = !saveOn || (Number.isFinite(dc) && dc > 0);
  const canApply = selected.size > 0 && amountValid && dcValid && !bulk.isPending;

  const apply = () => {
    if (!canApply) return;
    bulk.mutate(
      {
        campaignId,
        battleId: battle.id,
        data: {
          combatantIds: [...selected],
          type: mode,
          amount,
          ...(mode === 'DAMAGE' && saveOn ? { saveDc: dc, saveAbility: ability, halfOnSave: half } : {}),
        },
      },
      { onSuccess: () => clear() },
    );
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.bulk.title')}</div>

      <div className="ao-row ao-gap-4 ao-wrap">
        <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={selectMonsters}>
          {t('tactical.bulk.selectMonsters')}
        </button>
        <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={clear} disabled={!selected.size}>
          {t('tactical.bulk.clear')}
        </button>
        <span className={cn('ao-num', s.economyNum)}>{t('tactical.bulk.count', { n: selected.size })}</span>
      </div>

      <div className={cn(s.optGrid, s.mt8)}>
        {alive.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(s.optBtn, selected.has(c.id) && s.optBtnActive)}
            onClick={() => toggle(c.id)}
          >
            <Rune
              kind={c.type === 'MONSTER' ? 'flame' : 'helm'}
              size={10}
              color={c.type === 'MONSTER' ? 'var(--ember)' : 'var(--gold)'}
            />
            <span className={s.optName}>{c.displayName}</span>
            {c.currentHp != null && c.maxHp != null && (
              <span className={s.optHp}>
                {c.currentHp}/{c.maxHp}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={cn('ao-row ao-gap-4 ao-wrap', s.mt12)}>
        <button
          type="button"
          className={cn('ao-btn ao-btn--sm', mode === 'DAMAGE' ? 'ao-btn--danger' : 'ao-btn--ghost')}
          onClick={() => setMode('DAMAGE')}
        >
          {t('tactical.bulk.damage')}
        </button>
        <button
          type="button"
          className={cn('ao-btn ao-btn--sm', mode === 'HEAL' ? 'ao-btn--primary' : 'ao-btn--ghost')}
          onClick={() => setMode('HEAL')}
        >
          {t('tactical.bulk.heal')}
        </button>
        <input
          className={cn('ao-input', s.numField)}
          inputMode="numeric"
          value={amountStr}
          placeholder={t('tactical.bulk.amount')}
          onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply();
          }}
        />
      </div>

      {mode === 'DAMAGE' && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <label className="ao-row ao-gap-8">
            <input type="checkbox" checked={saveOn} onChange={(e) => setSaveOn(e.target.checked)} />
            <span className={s.hint}>{t('tactical.bulk.save')}</span>
          </label>
          {saveOn && (
            <div className="ao-row ao-gap-4 ao-wrap">
              <input
                className={cn('ao-input', s.numField)}
                inputMode="numeric"
                value={dcStr}
                placeholder="DC"
                onChange={(e) => setDcStr(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <select
                className={cn('ao-input', s.sizeSelect)}
                value={ability}
                onChange={(e) => setAbility(e.target.value as (typeof ABILITIES)[number])}
              >
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {t(`tactical.bulk.ability.${a}`)}
                  </option>
                ))}
              </select>
              <label className="ao-row ao-gap-8">
                <input type="checkbox" checked={half} onChange={(e) => setHalf(e.target.checked)} />
                <span className={s.hint}>{t('tactical.bulk.half')}</span>
              </label>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt12)}
        onClick={apply}
        disabled={!canApply}
      >
        {t('tactical.bulk.apply')}
      </button>
    </div>
  );
}
