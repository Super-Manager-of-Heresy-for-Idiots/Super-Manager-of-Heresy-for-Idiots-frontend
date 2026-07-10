/**
 * Standard actions for the active combatant (Phase 2.7): Dash / Dodge / Disengage / Help / Hide.
 * Each spends an action through the core `/standard-action` endpoint and sets a turn-scoped state
 * (shown as chips here and as roster badges). Help needs an ally; Hide resolves a Stealth check
 * (manual d20 or server AUTO, with an optional contest DC the FE could pass). Grapple/Shove are
 * opposed contests handled separately.
 */

import { useState } from 'react';
import { Rune } from '@/components/ordo';
import { useContest, useStandardAction } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse, BattleResponse, ContestType, StandardActionType } from '@/types';
import s from './workspace.module.css';

const SIMPLE: StandardActionType[] = ['DASH', 'DODGE', 'DISENGAGE'];

export function StandardActionsPanel({
  campaignId,
  battle,
  combatant,
}: {
  campaignId: string;
  battle: BattleResponse;
  combatant: BattleCombatantResponse;
}) {
  const t = useT();
  const standard = useStandardAction();
  const contest = useContest();
  const [mode, setMode] = useState<'HELP' | 'HIDE' | ContestType | null>(null);
  const [helpTarget, setHelpTarget] = useState('');
  const [stealthStr, setStealthStr] = useState('');
  const [bonusStr, setBonusStr] = useState('');
  const [dcStr, setDcStr] = useState('');
  const [contestTarget, setContestTarget] = useState('');
  const [atkBonusStr, setAtkBonusStr] = useState('');
  const [defBonusStr, setDefBonusStr] = useState('');
  const [shoveMode, setShoveMode] = useState<'PRONE' | 'PUSH'>('PRONE');

  const allies = battle.combatants.filter(
    (c) => c.id !== combatant.id && c.type === combatant.type && (c.currentHp == null || c.currentHp > 0),
  );
  const enemies = battle.combatants.filter(
    (c) => c.type !== combatant.type && (c.currentHp == null || c.currentHp > 0),
  );
  const busy = standard.isPending || contest.isPending;
  const int = (v: string): number | undefined => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const take = (type: StandardActionType, extra?: Record<string, unknown>) =>
    standard.mutate({
      campaignId,
      battleId: battle.id,
      combatantId: combatant.id,
      data: { type, ...extra },
    });

  const submitHelp = () => {
    if (!helpTarget) return;
    take('HELP', { targetCombatantId: helpTarget });
    setMode(null);
    setHelpTarget('');
  };
  const submitHide = () => {
    take('HIDE', {
      stealthD20: int(stealthStr),
      stealthBonus: int(bonusStr) ?? 0,
      hideDc: int(dcStr),
    });
    setMode(null);
    setStealthStr('');
    setBonusStr('');
    setDcStr('');
  };
  const submitContest = (type: ContestType) => {
    if (!contestTarget) return;
    contest.mutate({
      campaignId,
      battleId: battle.id,
      combatantId: combatant.id,
      data: {
        type,
        targetCombatantId: contestTarget,
        attackerBonus: int(atkBonusStr) ?? 0,
        targetBonus: int(defBonusStr) ?? 0,
        ...(type === 'SHOVE' ? { shoveMode } : {}),
      },
    });
    setMode(null);
    setContestTarget('');
    setAtkBonusStr('');
    setDefBonusStr('');
  };

  const activeChips: string[] = [];
  if (combatant.dashing) activeChips.push('dashing');
  if (combatant.dodging) activeChips.push('dodging');
  if (combatant.disengaged) activeChips.push('disengaged');
  if (combatant.hidden) activeChips.push('hidden');
  if (combatant.helpAdvantage) activeChips.push('helpAdvantage');

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.standard.title')}</div>

      {activeChips.length > 0 && (
        <div className={cn('ao-row ao-wrap ao-gap-4', s.mt8)}>
          {activeChips.map((k) => (
            <span key={k} className={s.stateChip}>
              {t(`battle.standard.state.${k}`)}
            </span>
          ))}
        </div>
      )}

      <div className={cn(s.optGrid, s.mt8)}>
        {SIMPLE.map((type) => (
          <button
            key={type}
            type="button"
            className={s.optBtn}
            disabled={busy}
            title={t(`battle.standard.hint.${type}`)}
            onClick={() => take(type)}
          >
            <Rune kind="arrow-r" size={10} color="var(--gold)" />
            <span className={s.optName}>{t(`battle.standard.${type}`)}</span>
          </button>
        ))}
        <button
          type="button"
          className={cn(s.optBtn, mode === 'HELP' && s.optBtnActive)}
          disabled={busy || allies.length === 0}
          onClick={() => setMode(mode === 'HELP' ? null : 'HELP')}
        >
          <Rune kind="helm" size={10} color="var(--gold)" />
          <span className={s.optName}>{t('battle.standard.HELP')}</span>
        </button>
        <button
          type="button"
          className={cn(s.optBtn, mode === 'HIDE' && s.optBtnActive)}
          disabled={busy}
          onClick={() => setMode(mode === 'HIDE' ? null : 'HIDE')}
        >
          <Rune kind="eye" size={10} color="var(--gold)" />
          <span className={s.optName}>{t('battle.standard.HIDE')}</span>
        </button>
        <button
          type="button"
          className={cn(s.optBtn, mode === 'GRAPPLE' && s.optBtnActive)}
          disabled={busy || enemies.length === 0}
          onClick={() => setMode(mode === 'GRAPPLE' ? null : 'GRAPPLE')}
        >
          <Rune kind="sword" size={10} color="var(--ember)" />
          <span className={s.optName}>{t('battle.contest.GRAPPLE')}</span>
        </button>
        <button
          type="button"
          className={cn(s.optBtn, mode === 'SHOVE' && s.optBtnActive)}
          disabled={busy || enemies.length === 0}
          onClick={() => setMode(mode === 'SHOVE' ? null : 'SHOVE')}
        >
          <Rune kind="shield" size={10} color="var(--ember)" />
          <span className={s.optName}>{t('battle.contest.SHOVE')}</span>
        </button>
      </div>

      {mode === 'HELP' && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <select
            className={cn('ao-input', s.condSelect)}
            value={helpTarget}
            onChange={(e) => setHelpTarget(e.target.value)}
          >
            <option value="">{t('battle.standard.pickAlly')}</option>
            {allies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--primary"
            disabled={!helpTarget || busy}
            onClick={submitHelp}
          >
            {t('battle.standard.confirmHelp')}
          </button>
        </div>
      )}

      {mode === 'HIDE' && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <div className="ao-row ao-gap-4 ao-wrap">
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={stealthStr}
              placeholder={t('battle.standard.stealthD20')}
              onChange={(e) => setStealthStr(e.target.value.replace(/[^0-9]/g, ''))}
            />
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={bonusStr}
              placeholder={t('battle.standard.stealthBonus')}
              onChange={(e) => setBonusStr(e.target.value.replace(/[^0-9-]/g, ''))}
            />
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={dcStr}
              placeholder={t('battle.standard.hideDc')}
              onChange={(e) => setDcStr(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <div className={s.hint}>{t('battle.standard.hideHint')}</div>
          <button type="button" className="ao-btn ao-btn--sm ao-btn--primary" disabled={busy} onClick={submitHide}>
            {t('battle.standard.confirmHide')}
          </button>
        </div>
      )}

      {(mode === 'GRAPPLE' || mode === 'SHOVE') && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <select
            className={cn('ao-input', s.condSelect)}
            value={contestTarget}
            onChange={(e) => setContestTarget(e.target.value)}
          >
            <option value="">{t('battle.contest.pickTarget')}</option>
            {enemies.map((e) => (
              <option key={e.id} value={e.id}>
                {e.displayName}
              </option>
            ))}
          </select>
          <div className="ao-row ao-gap-4 ao-wrap">
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={atkBonusStr}
              placeholder={t('battle.contest.atkBonus')}
              onChange={(e) => setAtkBonusStr(e.target.value.replace(/[^0-9-]/g, ''))}
            />
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={defBonusStr}
              placeholder={t('battle.contest.defBonus')}
              onChange={(e) => setDefBonusStr(e.target.value.replace(/[^0-9-]/g, ''))}
            />
          </div>
          {mode === 'SHOVE' && (
            <div className="ao-row ao-gap-4">
              {(['PRONE', 'PUSH'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn('ao-btn ao-btn--sm', shoveMode === m ? 'ao-btn--primary' : 'ao-btn--ghost')}
                  onClick={() => setShoveMode(m)}
                >
                  {t(`battle.contest.shove.${m}`)}
                </button>
              ))}
            </div>
          )}
          <div className={s.hint}>{t('battle.contest.hint')}</div>
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--danger"
            disabled={!contestTarget || busy}
            onClick={() => submitContest(mode)}
          >
            {t(`battle.contest.confirm.${mode}`)}
          </button>
        </div>
      )}
    </div>
  );
}
