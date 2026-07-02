import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { OrdoPanel, PanelHeader, Rune, Bar } from '@/components/ordo';
import { useAuthStore } from '@/store/authStore';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import {
  useBattleCurrentTurn,
  useEndTurn,
  useEndBattle,
  useJoinBattle,
  useInitiativeBonus,
  useBattleAttack,
  useApplyCombatantHp,
} from '@/hooks/useBattles';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { BattleTacticalMapButton } from '@/features/map/tactical';
import type {
  BattleResponse,
  BattleCombatantResponse,
  BattleActionResultResponse,
  CharacterV2Response,
} from '@/types';
import s from './BattleActive.module.css';

interface BattleActiveProps {
  battle: BattleResponse;
  campaignId: string;
  isGm: boolean;
}

/**
 * Live battle view (battle.status === 'ACTIVE').
 *  - RIGHT : the initiative tracker (both roles).
 *  - LEFT  : GM turn controls, or the player's join / action panel.
 * On mobile the sides collapse to a single column with a tab switch.
 */
export function BattleActive({ battle, campaignId, isGm }: BattleActiveProps) {
  const t = useT();
  const { user } = useAuthStore();
  const userId = user?.id;
  const isMobile = useIsMobile();
  const [section, setSection] = useState<'tracker' | 'side'>('tracker');

  const ordered = useMemo(
    () =>
      [...battle.combatants].sort(
        (a, b) => a.turnOrder - b.turnOrder || b.initiative - a.initiative,
      ),
    [battle.combatants],
  );
  const current = ordered.find((c) => c.currentTurn);

  const tracker = <Tracker battle={battle} ordered={ordered} userId={userId} />;
  const side = isGm ? (
    <GmControls battle={battle} campaignId={campaignId} current={current} />
  ) : (
    <PlayerSide battle={battle} campaignId={campaignId} userId={userId} current={current} />
  );

  if (isMobile) {
    return (
      <div className={s.single}>
        <div className={cn('ao-tabs', s.tabs)} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'tracker'}
            className={cn('ao-tab', section === 'tracker' && 'is-active')}
            onClick={() => setSection('tracker')}
          >
            {t('battle.section.tracker')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'side'}
            className={cn('ao-tab', section === 'side' && 'is-active')}
            onClick={() => setSection('side')}
          >
            {isGm ? t('battle.gm.controls') : t('battle.section.action')}
          </button>
        </div>
        {section === 'tracker' ? tracker : side}
      </div>
    );
  }

  return (
    <div className={s.cols}>
      {side}
      {tracker}
    </div>
  );
}

/* ── tracker ───────────────────────────────────────────────── */

function Tracker({
  battle,
  ordered,
  userId,
}: {
  battle: BattleResponse;
  ordered: BattleCombatantResponse[];
  userId?: string;
}) {
  const t = useT();
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={t('battle.tracker.title')}
        glyph="sword"
        sub={t('battle.tracker.round', { n: battle.roundNumber })}
        right={<span className="ao-chip ao-chip--gold">{t('battle.status.ACTIVE')}</span>}
      />
      {ordered.length === 0 ? (
        <div className={s.empty}>{t('battle.tracker.empty')}</div>
      ) : (
        <div className={s.list}>
          {ordered.map((c) => (
            <CombatantRow key={c.id} c={c} userId={userId} />
          ))}
        </div>
      )}
    </OrdoPanel>
  );
}

function CombatantRow({ c, userId }: { c: BattleCombatantResponse; userId?: string }) {
  const t = useT();
  const isMonster = c.type === 'MONSTER';
  const isYou = c.type === 'CHARACTER' && c.ownerUserId === userId;
  const isDown = c.currentHp != null && c.currentHp <= 0;

  return (
    <div className={cn(s.row, c.currentTurn && s.rowActive, isDown && s.rowDown)}>
      <div className={s.init}>
        <div className={s.initVal}>{c.initiative}</div>
        <div className={cn('ao-overline', s.initLbl)}>{t('battle.tracker.init')}</div>
      </div>
      <div className={s.portrait}>
        <Rune
          kind={isMonster ? 'flame' : 'helm'}
          size={20}
          color={isMonster ? 'var(--ember)' : 'var(--gold)'}
        />
      </div>
      <div className={s.main}>
        <div className={s.nameRow}>
          <span className={s.name}>{c.displayName}</span>
          {isYou && <span className="ao-chip ao-chip--gold">{t('battle.tracker.you')}</span>}
          {isMonster && <span className="ao-chip">{t('battle.tracker.monster')}</span>}
          {c.currentTurn && <Rune kind="sword" size={12} color="var(--gold)" />}
        </div>
        {c.currentHp != null && c.maxHp != null && (
          <div className={s.mt6}>
            <Bar value={c.currentHp} max={c.maxHp} tone="ember" height={5} showNumbers={false} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── GM controls ───────────────────────────────────────────── */

function GmControls({
  battle,
  campaignId,
  current,
}: {
  battle: BattleResponse;
  campaignId: string;
  current?: BattleCombatantResponse;
}) {
  const t = useT();
  const endTurn = useEndTurn();
  const endBattle = useEndBattle();
  const [confirming, setConfirming] = useState(false);

  const isMonsterTurn = current?.type === 'MONSTER';
  const { data: turn } = useBattleCurrentTurn(campaignId, battle.id, !!isMonsterTurn);

  const npcAttacks = useMemo<AttackOption[]>(
    () =>
      (turn?.monster?.features ?? [])
        .filter((f) => f.attackType)
        .map((f) => ({
          name: f.nameRusloc,
          damage: f.damages?.[0]?.dice ?? null,
          damageType: f.damages?.[0]?.damageType?.nameRusloc ?? null,
        })),
    [turn?.monster?.features],
  );
  const npcTargets = useMemo(
    () => (current ? liveTargets(battle.combatants, current) : []),
    [battle.combatants, current],
  );

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('battle.gm.controls')} glyph="helm" />
      <div className={s.body}>
        <div className={s.currentTurn}>
          <span className={s.lead}>{t('battle.tracker.current')}</span>
          <span className={cn('ao-h5', s.currentName)}>
            {current ? current.displayName : t('battle.tracker.waiting')}
          </span>
        </div>

        <div className={s.btnRow}>
          <button
            className="ao-btn ao-btn--primary"
            onClick={() => endTurn.mutate({ campaignId, battleId: battle.id })}
            disabled={!current || endTurn.isPending}
          >
            <Rune kind="arrow-r" size={14} color="currentColor" />
            <span className={s.ml6}>{t('battle.gm.endTurn')}</span>
          </button>
          <BattleTacticalMapButton
            campaignId={campaignId}
            battleId={battle.id}
            battleName={battle.name}
          />
        </div>

        {isMonsterTurn && current && npcAttacks.length > 0 && (
          <div className={s.section}>
            <div className={cn('ao-overline', s.sectionHdr)}>{t('battle.gm.npcControl')}</div>
            <div className={s.hint}>{t('battle.gm.npcAttackHint')}</div>
            <AttackForm
              campaignId={campaignId}
              battleId={battle.id}
              attacks={npcAttacks}
              targets={npcTargets}
            />
          </div>
        )}

        <HpAdjustPanel campaignId={campaignId} battle={battle} />

        {!confirming ? (
          <div className={s.endConfirm}>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setConfirming(true)}
              disabled={endBattle.isPending}
            >
              {t('battle.gm.endBattle')}
            </button>
          </div>
        ) : (
          <div className={s.endConfirm}>
            <div className={s.confirmText}>{t('battle.gm.endBattleConfirm')}</div>
            <div className={s.confirmRow}>
              <button
                className="ao-btn ao-btn--danger"
                onClick={() => endBattle.mutate({ campaignId, battleId: battle.id })}
                disabled={endBattle.isPending}
              >
                {t('battle.gm.endBattle')}
              </button>
              <button className="ao-btn ao-btn--ghost" onClick={() => setConfirming(false)}>
                {t('battle.create.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </OrdoPanel>
  );
}

/* ── player side ───────────────────────────────────────────── */

function PlayerSide({
  battle,
  campaignId,
  userId,
  current,
}: {
  battle: BattleResponse;
  campaignId: string;
  userId?: string;
  current?: BattleCombatantResponse;
}) {
  const t = useT();
  const { data: characters } = useCampaignCharacters(campaignId);
  const isMyTurn = current?.type === 'CHARACTER' && current.ownerUserId === userId;

  const joinedCharIds = useMemo(
    () =>
      new Set(
        battle.combatants
          .filter((c) => c.type === 'CHARACTER')
          .map((c) => c.characterId),
      ),
    [battle.combatants],
  );

  const myChars = (characters ?? []).filter((c) => c.ownerId === userId);
  const available = myChars.filter((c) => !joinedCharIds.has(c.id));

  return (
    <div className={s.stack}>
      {isMyTurn && current && (
        <ActionPanel battle={battle} campaignId={campaignId} current={current} />
      )}
      {available.length > 0 && (
        <JoinPanel battle={battle} campaignId={campaignId} chars={available} />
      )}
      {!isMyTurn && available.length === 0 && (
        <OrdoPanel frame>
          <div className={s.turnNote}>
            {myChars.length === 0
              ? t('battle.join.noCharacters')
              : current
                ? t('battle.gm.currentTurnOf', { name: current.displayName })
                : t('battle.tracker.waiting')}
          </div>
        </OrdoPanel>
      )}
    </div>
  );
}

/* ── player action panel (their turn) ──────────────────────── */

function ActionPanel({
  battle,
  campaignId,
  current,
}: {
  battle: BattleResponse;
  campaignId: string;
  current: BattleCombatantResponse;
}) {
  const t = useT();
  const endTurn = useEndTurn();
  const { data: turn, isLoading } = useBattleCurrentTurn(campaignId, battle.id, true);

  const resources = turn?.resources ?? [];
  const attacks = turn?.character?.attacks ?? [];
  const spells = turn?.character?.knownSpells ?? [];
  const effects = turn?.activeEffects ?? [];
  const targets = useMemo(
    () => liveTargets(battle.combatants, current),
    [battle.combatants, current],
  );

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('battle.action.title')} glyph="sword" sub={current.displayName} />
      <div className={s.body}>
        {isLoading ? (
          <div className={cn('ao-breathe', s.skWrap)}>
            <div className={cn('ao-ph', s.skLine)} />
            <div className={cn('ao-ph', s.skLine)} />
            <div className={cn('ao-ph', s.skLine)} />
          </div>
        ) : (
          <>
            <div className={s.section}>
              <div className={cn('ao-overline', s.sectionHdr)}>
                {t('battle.action.resources')}
              </div>
              {resources.length === 0 ? (
                <div className={s.muted}>{t('battle.action.noResources')}</div>
              ) : (
                resources.map((r) => (
                  <div key={r.resourceTypeId} className={s.resItem}>
                    <div className={s.resName}>
                      <span>{r.resourceName ?? r.name}</span>
                      <span className="ao-num">
                        {r.currentValue} / {r.maxValue}
                      </span>
                    </div>
                    <Bar
                      value={r.currentValue}
                      max={r.maxValue}
                      tone="arcane"
                      height={6}
                      showNumbers={false}
                    />
                  </div>
                ))
              )}
            </div>

            <div className={s.section}>
              <div className={cn('ao-overline', s.sectionHdr)}>
                {t('battle.action.abilities')}
              </div>
              {attacks.length === 0 && spells.length === 0 ? (
                <div className={s.muted}>{t('battle.action.noAbilities')}</div>
              ) : (
                <>
                  {attacks.length > 0 && (
                    <div className={s.mt8}>
                      <div className={s.resName}>{t('battle.action.attacks')}</div>
                      <AttackForm
                        campaignId={campaignId}
                        battleId={battle.id}
                        attacks={attacks}
                        targets={targets}
                      />
                    </div>
                  )}
                  {spells.length > 0 && (
                    <>
                      <div className={cn(s.resName, s.mt12)}>{t('battle.action.spells')}</div>
                      <div className={s.chips}>
                        {spells.map((sp) => (
                          <span key={sp.spellId} className={s.chip}>
                            <Rune kind="book" size={10} color="var(--arcane)" />
                            {sp.name}
                            <span className={s.chipMeta}>
                              {sp.level === 0
                                ? t('battle.action.spell.cantrip')
                                : t('battle.action.spell.level', { n: sp.level })}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {effects.length > 0 && (
              <div className={s.section}>
                <div className={cn('ao-overline', s.sectionHdr)}>
                  {t('battle.action.effects')}
                </div>
                <div className={s.chips}>
                  {effects.map((e) => (
                    <span
                      key={e.id}
                      className={cn('ao-chip', e.isBuff ? 'ao-chip--gold' : 'ao-chip--ember')}
                    >
                      {e.buffDebuffName}
                      {e.remainingRounds != null && (
                        <span className={s.chipMeta}>{e.remainingRounds}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt16)}
          onClick={() => endTurn.mutate({ campaignId, battleId: battle.id })}
          disabled={endTurn.isPending}
        >
          <Rune kind="check" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.action.endTurn')}</span>
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ── attack form (player + GM NPC) ─────────────────────────── */

/**
 * Valid attack targets for `attacker`: the opposing side only (characters strike monsters and
 * vice versa), excluding downed combatants. This prevents a GM-controlled monster from defaulting
 * to — and accidentally damaging — another monster instead of a player.
 */
function liveTargets(
  combatants: BattleCombatantResponse[],
  attacker: BattleCombatantResponse,
): BattleCombatantResponse[] {
  return combatants.filter(
    (c) =>
      c.id !== attacker.id &&
      c.type !== attacker.type &&
      (c.currentHp == null || c.currentHp > 0),
  );
}

interface AttackOption {
  name: string;
  damage?: string | null;
  damageType?: string | null;
}

/**
 * Shared attack UI: pick an attack, pick a target, roll/enter a d20, submit. The server resolves
 * hit/crit against the target's AC and rolls damage; the result is shown in a card. Used by the
 * player on their turn and by the GM when a monster is acting.
 */
function AttackForm({
  campaignId,
  battleId,
  attacks,
  targets,
}: {
  campaignId: string;
  battleId: string;
  attacks: AttackOption[];
  targets: BattleCombatantResponse[];
}) {
  const t = useT();
  const attack = useBattleAttack();
  const [attackName, setAttackName] = useState(attacks[0]?.name ?? '');
  const [targetId, setTargetId] = useState(targets[0]?.id ?? '');
  const [d20Str, setD20Str] = useState('');
  const [result, setResult] = useState<BattleActionResultResponse | null>(null);

  // Keep selections valid as the underlying lists change.
  useEffect(() => {
    if (!attacks.some((a) => a.name === attackName)) setAttackName(attacks[0]?.name ?? '');
  }, [attacks, attackName]);
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

  if (targets.length === 0) {
    return <div className={s.muted}>{t('battle.attack.noTargets')}</div>;
  }

  return (
    <div>
      <div className={cn(s.lead, s.mt8)}>{t('battle.attack.pickAttack')}</div>
      <div className={s.optGrid}>
        {attacks.map((a) => (
          <button
            key={a.name}
            type="button"
            className={cn(s.optBtn, attackName === a.name && s.optBtnActive)}
            onClick={() => setAttackName(a.name)}
          >
            <Rune kind="sword" size={10} color="var(--ember)" />
            {a.name}
            {(a.damage || a.damageType) && (
              <span className={s.optMeta}>
                {a.damage} {a.damageType}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={cn(s.lead, s.mt12)}>{t('battle.attack.pickTarget')}</div>
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
            {c.displayName}
            {c.currentHp != null && c.maxHp != null && (
              <span className={s.optHp}>
                {c.currentHp}/{c.maxHp}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={cn(s.lead, s.mt12)}>{t('battle.attack.d20')}</div>
      <div className={s.initRow}>
        <input
          className={cn('ao-input', s.initField)}
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

/* ── GM manual HP adjust ───────────────────────────────────── */

function HpAdjustPanel({
  campaignId,
  battle,
}: {
  campaignId: string;
  battle: BattleResponse;
}) {
  const t = useT();
  const applyHp = useApplyCombatantHp();
  const combatants = battle.combatants;
  const [combatantId, setCombatantId] = useState(combatants[0]?.id ?? '');
  const [amountStr, setAmountStr] = useState('');

  useEffect(() => {
    if (!combatants.some((c) => c.id === combatantId)) setCombatantId(combatants[0]?.id ?? '');
  }, [combatants, combatantId]);

  const amount = parseInt(amountStr, 10);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const valid = !!combatantId && amountValid;

  const apply = (sign: -1 | 1) => {
    if (!valid) return;
    applyHp.mutate(
      { campaignId, battleId: battle.id, combatantId, data: { delta: sign * amount } },
      { onSuccess: () => setAmountStr('') },
    );
  };

  if (combatants.length === 0) return null;

  return (
    <div className={s.section}>
      <div className={cn('ao-overline', s.sectionHdr)}>{t('battle.gm.hpTitle')}</div>
      <div className={s.lead}>{t('battle.gm.hpPickTarget')}</div>
      <div className={s.optGrid}>
        {combatants.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn(s.optBtn, combatantId === c.id && s.optBtnActive)}
            onClick={() => setCombatantId(c.id)}
          >
            <Rune
              kind={c.type === 'MONSTER' ? 'flame' : 'helm'}
              size={10}
              color={c.type === 'MONSTER' ? 'var(--ember)' : 'var(--gold)'}
            />
            {c.displayName}
            {c.currentHp != null && c.maxHp != null && (
              <span className={s.optHp}>
                {c.currentHp}/{c.maxHp}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={cn(s.lead, s.mt12)}>{t('battle.gm.hpAmount')}</div>
      <input
        className={cn('ao-input', s.initField)}
        inputMode="numeric"
        value={amountStr}
        placeholder="—"
        onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
      />
      <div className={s.hpBtns}>
        <button
          className="ao-btn ao-btn--danger"
          onClick={() => apply(-1)}
          disabled={!valid || applyHp.isPending}
        >
          <Rune kind="sword" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.gm.hpDamage')}</span>
        </button>
        <button
          className="ao-btn ao-btn--ghost"
          onClick={() => apply(1)}
          disabled={!valid || applyHp.isPending}
        >
          <Rune kind="cross" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.gm.hpHeal')}</span>
        </button>
      </div>
    </div>
  );
}

/* ── player join panel ─────────────────────────────────────── */

function JoinPanel({
  battle,
  campaignId,
  chars,
}: {
  battle: BattleResponse;
  campaignId: string;
  chars: CharacterV2Response[];
}) {
  const t = useT();
  const join = useJoinBattle();
  const [charId, setCharId] = useState(chars[0]?.id ?? '');
  const [initStr, setInitStr] = useState('');
  const { data: bonus } = useInitiativeBonus(campaignId, battle.id, charId || undefined);

  // Keep the selection valid as characters join/leave the available list.
  useEffect(() => {
    if (!chars.some((c) => c.id === charId)) {
      setCharId(chars[0]?.id ?? '');
    }
  }, [chars, charId]);

  const roll = () => {
    const n = Math.floor(Math.random() * 20) + 1;
    setInitStr(String(n));
    toast.success(t('battle.toast.dieRolled', { n }));
  };

  const initNum = parseInt(initStr, 10);
  const d20Valid = Number.isFinite(initNum) && initNum >= 1 && initNum <= 20;
  const valid = !!charId && d20Valid;
  const total = d20Valid && bonus != null ? initNum + bonus : null;
  const fmtSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  const submit = () => {
    if (!valid) return;
    join.mutate(
      { campaignId, battleId: battle.id, data: { characters: [{ characterId: charId, d20: initNum }] } },
      { onSuccess: () => setInitStr('') },
    );
  };

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('battle.join.title')} glyph="helm" />
      <div className={s.body}>
        <div className={s.joinField}>
          <span className={s.lead}>{t('battle.join.pickCharacter')}</span>
          <div className={s.charPick}>
            {chars.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn(s.charBtn, charId === c.id && s.charBtnActive)}
                onClick={() => setCharId(c.id)}
              >
                <span>{c.name}</span>
                <span className={s.rowMeta}>
                  {c.classLevels?.[0]?.className ?? ''} &middot; LVL {c.totalLevel}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={s.joinField}>
          <span className={s.lead}>{t('battle.join.initiative')}</span>
          <div className={s.initRow}>
            <input
              className={cn('ao-input', s.initField)}
              inputMode="numeric"
              value={initStr}
              placeholder="—"
              onChange={(e) => setInitStr(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <button className="ao-btn ao-btn--ghost" onClick={roll} type="button">
              <Rune kind="diamond" size={14} color="currentColor" />
              <span className={s.ml6}>{t('battle.join.rollDie')}</span>
            </button>
          </div>
          <div className={s.hint}>{t('battle.join.manualHint')}</div>
          {total != null && bonus != null && (
            <div className={s.initResult}>
              <span className={s.initResultLbl}>{t('battle.join.computed')}</span>
              <span className={s.initResultVal}>{total}</span>
              <span className={s.initResultBreakdown}>
                {t('battle.join.formula', { d20: initNum, bonus: fmtSigned(bonus) })}
              </span>
            </div>
          )}
        </div>

        <button
          className="ao-btn ao-btn--primary ao-btn--block"
          onClick={submit}
          disabled={!valid || join.isPending}
        >
          <Rune kind="check" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.join.confirm')}</span>
        </button>
      </div>
    </OrdoPanel>
  );
}
