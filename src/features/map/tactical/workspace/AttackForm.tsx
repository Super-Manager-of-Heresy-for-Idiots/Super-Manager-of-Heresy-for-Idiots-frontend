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
import { Rune } from '@/components/ordo';
import { useBattleAttack } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type {
  AttackRollMode,
  BattleActionResultResponse,
  BattleAttackRequest,
  BattleCombatantResponse,
  CoverType,
} from '@/types';
import type { TacticalTokenView } from '../tacticalView';
import { buildRangeFields, type AttackOption } from './combat';
import s from './workspace.module.css';

interface AttackFormProps {
  campaignId: string;
  battleId: string;
  attacks: AttackOption[];
  targets: BattleCombatantResponse[];
  lockedTargetId?: string | null;
  /** Placed tokens — used to send grid positions so the server can gate range/reach (Phase 2.5). */
  tacticalTokens?: TacticalTokenView[];
  /** The acting combatant (attacker) whose token position anchors the range check. */
  attackerCombatantId?: string | null;
  /** GM view: offer a "bypass range" toggle. Players never see it. */
  allowRangeOverride?: boolean;
  /** Resolve as a reaction / opportunity attack (Phase 2.8): out of turn, spends the reaction. */
  reaction?: boolean;
}

export function AttackForm({
  campaignId,
  battleId,
  attacks,
  targets,
  lockedTargetId,
  tacticalTokens,
  attackerCombatantId,
  allowRangeOverride,
  reaction,
}: AttackFormProps) {
  const t = useT();
  const attack = useBattleAttack();
  const [attackName, setAttackName] = useState(attacks[0]?.name ?? '');
  const [targetId, setTargetId] = useState(lockedTargetId ?? targets[0]?.id ?? '');
  const [rollMode, setRollMode] = useState<AttackRollMode>('NORMAL');
  const [serverRoll, setServerRoll] = useState(true);
  const [d20Str, setD20Str] = useState('');
  const [d20aStr, setD20aStr] = useState('');
  const [d20bStr, setD20bStr] = useState('');
  const [gmOverrideRange, setGmOverrideRange] = useState(false);
  const [cover, setCover] = useState<CoverType>('NONE');
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

  const num = (sv: string): number | null => {
    const n = parseInt(sv, 10);
    return Number.isFinite(n) && n >= 1 && n <= 20 ? n : null;
  };
  const single = num(d20Str);
  const dieA = num(d20aStr);
  const dieB = num(d20bStr);
  const diceValid = serverRoll ? true : rollMode === 'NORMAL' ? single != null : dieA != null && dieB != null;
  const valid = !!attackName && !!targetId && diceValid && cover !== 'TOTAL';

  const submit = () => {
    if (!valid) return;
    const data: BattleAttackRequest = { targetCombatantId: targetId, attackName, rollMode };
    // Server-authoritative rolls: send no dice and let the server roll (A2 — no client Math.random).
    if (!serverRoll) {
      if (rollMode === 'NORMAL') data.d20 = single ?? undefined;
      else {
        data.d20A = dieA ?? undefined;
        data.d20B = dieB ?? undefined;
      }
    }
    // Range/reach (Phase 2.5): relay both tokens' grid positions so the server can gate distance.
    // Positions are map-authoritative; the server is the sole judge of in/out of range.
    if (tacticalTokens) {
      Object.assign(data, buildRangeFields(tacticalTokens, attackerCombatantId, targetId));
    }
    if (gmOverrideRange) data.gmOverrideRange = true;
    if (cover !== 'NONE') data.cover = cover;
    // Reaction / opportunity attack (Phase 2.8): resolved out of turn for the reacting combatant.
    if (reaction && attackerCombatantId) {
      data.reaction = true;
      data.attackerCombatantId = attackerCombatantId;
    }
    attack.mutate(
      { campaignId, battleId, data },
      {
        onSuccess: (res) => {
          if (res.data) setResult(res.data);
          setD20Str('');
          setD20aStr('');
          setD20bStr('');
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

      <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.attack.rollMode')}</div>
      <div className="ao-row ao-gap-4">
        {(['NORMAL', 'ADVANTAGE', 'DISADVANTAGE'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={cn('ao-btn ao-btn--sm', rollMode === m ? 'ao-btn--primary' : 'ao-btn--ghost')}
            onClick={() => setRollMode(m)}
          >
            {t(`battle.attack.mode.${m}`)}
          </button>
        ))}
      </div>
      <label className={cn('ao-row ao-gap-8', s.mt12)}>
        <input type="checkbox" checked={serverRoll} onChange={(e) => setServerRoll(e.target.checked)} />
        <span className={s.hint}>{t('battle.attack.serverRoll')}</span>
      </label>
      {!serverRoll && (
        <div className={cn('ao-row ao-gap-8', s.mt12)}>
          {rollMode === 'NORMAL' ? (
            <input
              className={cn('ao-input', s.numField)}
              inputMode="numeric"
              value={d20Str}
              placeholder={t('battle.attack.d20')}
              onChange={(e) => setD20Str(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          ) : (
            <>
              <input
                className={cn('ao-input', s.numField)}
                inputMode="numeric"
                value={d20aStr}
                placeholder="d20 A"
                onChange={(e) => setD20aStr(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <input
                className={cn('ao-input', s.numField)}
                inputMode="numeric"
                value={d20bStr}
                placeholder="d20 B"
                onChange={(e) => setD20bStr(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </>
          )}
        </div>
      )}
      <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.attack.cover')}</div>
      <div className="ao-row ao-gap-4 ao-wrap">
        {(['NONE', 'HALF', 'THREE_QUARTERS', 'TOTAL'] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={cn('ao-btn ao-btn--sm', cover === c ? 'ao-btn--primary' : 'ao-btn--ghost')}
            onClick={() => setCover(c)}
          >
            {t(`battle.attack.cover.${c}`)}
          </button>
        ))}
      </div>
      {cover === 'TOTAL' && <div className={s.hint}>{t('battle.attack.cover.totalHint')}</div>}

      <div className={cn(s.hint, s.mt12)}>{t('battle.attack.hint')}</div>

      {allowRangeOverride && (
        <label className={cn('ao-row ao-gap-8', s.mt8)}>
          <input
            type="checkbox"
            checked={gmOverrideRange}
            onChange={(e) => setGmOverrideRange(e.target.checked)}
          />
          <span className={s.hint}>{t('battle.attack.rangeOverride')}</span>
        </label>
      )}

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
          d20: result.effectiveD20 ?? result.d20,
          bonus: fmtSigned(result.attackBonus),
          total: result.total,
          ac: result.targetAc,
        })}
      </div>
      {result.rollMode && result.rollMode !== 'NORMAL' && result.d20A != null && result.d20B != null && (
        <div className={s.resultLine}>
          {t(`battle.attack.mode.${result.rollMode}`)}: {result.d20A} / {result.d20B} →{' '}
          {result.effectiveD20 ?? result.d20}
        </div>
      )}
      {result.rangeNote && (
        <div className={s.resultLine}>
          {t(`battle.attack.range.${result.rangeNote}`)}
          {result.distanceFt != null && ` (${result.distanceFt} ${t('battle.attack.feet')})`}
        </div>
      )}
      {result.cover && result.cover !== 'NONE' && (
        <div className={s.resultLine}>{t(`battle.attack.cover.${result.cover}`)}</div>
      )}
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
