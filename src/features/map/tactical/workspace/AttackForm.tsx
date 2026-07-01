/**
 * Shared attack UI for the tactical workspace: pick an attack, pick a target,
 * roll/enter a d20, submit. Resolution ALWAYS goes through the core battle API
 * (`useBattleAttack`); the server resolves hit/crit vs AC and rolls damage. Map
 * token state is never mutated by an attack — only the battle query is refreshed.
 *
 * `lockedTargetId` pre-selects a target (e.g. the token clicked on the map); the
 * user can still change it. Used by the GM Turn tab (monster acting) and the
 * player Character tab (their turn).
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Rune } from '@/components/ordo';
import { useBattleAttack } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleActionResultResponse, BattleCombatantResponse } from '@/types';
import type { AttackOption } from './combat';
import s from './workspace.module.css';

interface AttackFormProps {
  campaignId: string;
  battleId: string;
  attacks: AttackOption[];
  targets: BattleCombatantResponse[];
  lockedTargetId?: string | null;
}

export function AttackForm({ campaignId, battleId, attacks, targets, lockedTargetId }: AttackFormProps) {
  const t = useT();
  const attack = useBattleAttack();
  const [attackName, setAttackName] = useState(attacks[0]?.name ?? '');
  const [targetId, setTargetId] = useState(lockedTargetId ?? targets[0]?.id ?? '');
  const [d20Str, setD20Str] = useState('');
  const [result, setResult] = useState<BattleActionResultResponse | null>(null);

  // Keep selections valid as the underlying lists change.
  useEffect(() => {
    if (!attacks.some((a) => a.name === attackName)) setAttackName(attacks[0]?.name ?? '');
  }, [attacks, attackName]);
  useEffect(() => {
    if (lockedTargetId && targets.some((c) => c.id === lockedTargetId)) {
      setTargetId(lockedTargetId);
    }
  }, [lockedTargetId, targets]);
  useEffect(() => {
    if (!targets.some((c) => c.id === targetId)) setTargetId(targets[0]?.id ?? '');
  }, [targets, targetId]);

  const roll = () => {
    const n = Math.floor(Math.random() * 20) + 1;
    setD20Str(String(n));
    toast.success(t('battle.toast.dieRolled', { n }));
  };

  const d20 = parseInt(d20Str, 10);
  const d20Valid = Number.isFinite(d20) && d20 >= 1 && d20 <= 20;
  const valid = !!attackName && !!targetId && d20Valid;

  const submit = () => {
    if (!valid) return;
    attack.mutate(
      { campaignId, battleId, data: { targetCombatantId: targetId, attackName, d20 } },
      {
        onSuccess: (res) => {
          if (res.data) setResult(res.data);
          setD20Str('');
        },
      },
    );
  };

  if (attacks.length === 0) {
    return <div className={s.muted}>{t('battle.action.noAbilities')}</div>;
  }
  if (targets.length === 0) {
    return <div className={s.muted}>{t('battle.attack.noTargets')}</div>;
  }

  return (
    <div>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.attack.pickAttack')}</div>
      <div className={s.optGrid}>
        {attacks.map((a) => (
          <button
            key={a.name}
            type="button"
            className={cn(s.optBtn, attackName === a.name && s.optBtnActive)}
            onClick={() => setAttackName(a.name)}
          >
            <Rune kind="sword" size={10} color="var(--ember)" />
            <span className={s.optName}>{a.name}</span>
            {(a.damage || a.damageType) && (
              <span className={s.optMeta}>
                {a.damage} {a.damageType}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.attack.pickTarget')}</div>
      <div className={s.optGrid}>
        {targets.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(s.optBtn, targetId === c.id && s.optBtnActive)}
            onClick={() => setTargetId(c.id)}
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

      <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.attack.d20')}</div>
      <div className={s.inlineRow}>
        <input
          className={cn('ao-input', s.numField)}
          inputMode="numeric"
          value={d20Str}
          placeholder="—"
          onChange={(e) => setD20Str(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button className="ao-btn ao-btn--ghost" onClick={roll} type="button">
          <Rune kind="diamond" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.attack.rollDie')}</span>
        </button>
      </div>
      <div className={s.hint}>{t('battle.attack.hint')}</div>

      <button
        className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt12)}
        onClick={submit}
        disabled={!valid || attack.isPending}
      >
        <Rune kind="sword" size={14} color="currentColor" />
        <span className={s.ml6}>{t('battle.attack.confirm')}</span>
      </button>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: BattleActionResultResponse }) {
  const t = useT();
  const fmtSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  const toneClass =
    result.outcome === 'MISS'
      ? s.resultMiss
      : result.outcome === 'CRIT'
        ? s.resultCrit
        : s.resultHit;

  return (
    <div className={cn(s.resultCard, toneClass)}>
      <div className={s.resultHead}>
        <span className={s.resultOutcome}>{t(`battle.attack.outcome.${result.outcome}`)}</span>
        <span className={s.optMeta}>{result.targetName}</span>
      </div>
      <div className={s.resultLine}>
        {t('battle.attack.rollLine', {
          d20: result.d20,
          bonus: fmtSigned(result.attackBonus),
          total: result.total,
          ac: result.targetAc,
        })}
      </div>
      {result.damage != null && (
        <div className={s.resultDmg}>
          {t('battle.attack.dealt', { n: result.damage, type: result.damageType ?? '' })}
        </div>
      )}
      {result.targetCurrentHp != null && result.targetMaxHp != null && (
        <div className={s.resultLine}>
          {t('battle.attack.targetHp', { cur: result.targetCurrentHp, max: result.targetMaxHp })}
        </div>
      )}
      {result.targetDown && (
        <div className={s.resultDown}>
          {t('battle.attack.targetDown', { name: result.targetName })}
        </div>
      )}
    </div>
  );
}
