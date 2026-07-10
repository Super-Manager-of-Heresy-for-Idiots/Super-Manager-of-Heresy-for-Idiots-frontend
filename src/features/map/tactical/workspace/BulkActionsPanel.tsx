/**
 * GM mass operations (Phase 2.4): pick several combatants, then damage or heal them in one shot —
 * "8 goblins take 12" in two clicks. Damage can carry a save-for-half (each target rolls its own,
 * server AUTO). Goes through the core `/bulk-action` endpoint, which reuses the same per-target
 * primitives (mitigation, save, HP) as the single-target flows. Bulk conditions are a follow-up
 * (they need the condition reference list, not yet on the FE).
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Rune } from '@/components/ordo';
import { useBulkAction, useGroupInitiative } from '@/hooks/useBattles';
import { referenceApi } from '@/api/reference.api';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse, ContentLabel } from '@/types';
import s from './workspace.module.css';

const labelName = (c: ContentLabel, lang: string) =>
  (lang === 'ru' ? c.nameRu : c.nameEn) ?? c.name;

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export function BulkActionsPanel({ campaignId, battle }: { campaignId: string; battle: BattleResponse }) {
  const t = useT();
  const { lang } = useI18n();
  const bulk = useBulkAction();
  const groupInit = useGroupInitiative();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'DAMAGE' | 'HEAL' | 'CONDITION'>('DAMAGE');
  const [amountStr, setAmountStr] = useState('');
  const [saveOn, setSaveOn] = useState(false);
  const [dcStr, setDcStr] = useState('');
  const [ability, setAbility] = useState<(typeof ABILITIES)[number]>('dex');
  const [half, setHalf] = useState(true);
  const [conditionId, setConditionId] = useState('');
  const [condAdd, setCondAdd] = useState(true);
  const [roundsStr, setRoundsStr] = useState('');

  const { data: conditions } = useQuery({
    queryKey: ['reference', 'conditions'],
    queryFn: async () => (await referenceApi.getConditions()).data ?? [],
    staleTime: 10 * 60 * 1000,
    enabled: mode === 'CONDITION',
  });

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
  const rounds = parseInt(roundsStr, 10);
  const isCondition = mode === 'CONDITION';
  const canApply =
    selected.size > 0 &&
    !bulk.isPending &&
    (isCondition ? !!conditionId : amountValid && dcValid);

  const apply = () => {
    if (!canApply) return;
    const data = isCondition
      ? {
          combatantIds: [...selected],
          type: condAdd ? ('CONDITION_ADD' as const) : ('CONDITION_REMOVE' as const),
          conditionId,
          ...(condAdd && Number.isFinite(rounds) && rounds > 0 ? { remainingRounds: rounds } : {}),
        }
      : {
          combatantIds: [...selected],
          type: mode as 'DAMAGE' | 'HEAL',
          amount,
          ...(mode === 'DAMAGE' && saveOn ? { saveDc: dc, saveAbility: ability, halfOnSave: half } : {}),
        };
    bulk.mutate({ campaignId, battleId: battle.id, data }, { onSuccess: () => clear() });
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
        <button
          type="button"
          className="ao-btn ao-btn--sm ao-btn--ghost"
          disabled={!selected.size || groupInit.isPending}
          title={t('tactical.bulk.groupInitHint')}
          onClick={() => groupInit.mutate({ campaignId, battleId: battle.id, combatantIds: [...selected] })}
        >
          {t('tactical.bulk.groupInit')}
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
        <button
          type="button"
          className={cn('ao-btn ao-btn--sm', mode === 'CONDITION' ? 'ao-btn--primary' : 'ao-btn--ghost')}
          onClick={() => setMode('CONDITION')}
        >
          {t('tactical.bulk.condition')}
        </button>
        {!isCondition && (
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
        )}
      </div>

      {isCondition && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <div className="ao-row ao-gap-4">
            <button
              type="button"
              className={cn('ao-btn ao-btn--sm', condAdd ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setCondAdd(true)}
            >
              {t('tactical.bulk.condAdd')}
            </button>
            <button
              type="button"
              className={cn('ao-btn ao-btn--sm', !condAdd ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setCondAdd(false)}
            >
              {t('tactical.bulk.condRemove')}
            </button>
          </div>
          <select
            className={cn('ao-input', s.condSelect)}
            value={conditionId}
            onChange={(e) => setConditionId(e.target.value)}
          >
            <option value="">{t('tactical.bulk.pickCondition')}</option>
            {(conditions ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {labelName(c, lang)}
              </option>
            ))}
          </select>
          {condAdd && (
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={roundsStr}
              placeholder={t('tactical.bulk.rounds')}
              onChange={(e) => setRoundsStr(e.target.value.replace(/[^0-9]/g, ''))}
            />
          )}
        </div>
      )}

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
