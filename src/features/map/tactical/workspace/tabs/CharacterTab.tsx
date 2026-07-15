/**
 * Player "Персонаж" tab — the player's combat hub. On their turn: resources,
 * abilities (attacks via the shared AttackForm + spell list), active effects, and
 * end-turn. When they have characters not yet in the battle: a join panel. The
 * attack target is pre-filled from the token selected on the map, if any.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bar, Rune } from '@/components/ordo';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useBackpackInventory, useCharacterInventory } from '@/hooks/useInventory';
import {
  useBattleCastSpell,
  useBattleCurrentTurn,
  useBattleUseAbility,
  useEndTurn,
  useInitiativeBonus,
  useJoinBattle,
} from '@/hooks/useBattles';
import { battlesApi } from '@/api/battles.api';
import { spellbookApi, type SpellPlan, type SpellPlanDamage } from '@/api/spellbook.api';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type {
  BattleCombatantResponse,
  BattleResponse,
  CharacterV2Response,
  FeatureActionResponse,
  ItemInstanceResponse,
} from '@/types';
import { useMapTransientStore } from '../../../state';
import { mapSessionApi } from '../../../api';
import { AttackForm } from '../AttackForm';
import { StandardActionsPanel } from '../StandardActionsPanel';
import { DefaultActions } from '../DefaultActions';
import { characterAttackOptions, liveTargets } from '../combat';
import type { MovementConfig } from '../movement';
import { currentTurnCombatant, type TacticalTokenView } from '../../tacticalView';
import s from '../workspace.module.css';

interface CharacterTabProps {
  campaignId: string;
  battle: BattleResponse;
  currentUserId: string | null;
  tacticalTokens: TacticalTokenView[];
  movement: MovementConfig | null;
  /** Linked map session (AoE targeting, Phase 2.3); null when no live map. */
  mapSessionId?: string | null;
}

export function CharacterTab({
  campaignId,
  battle,
  currentUserId,
  tacticalTokens,
  movement,
  mapSessionId = null,
}: CharacterTabProps) {
  const t = useT();
  const { data: characters } = useCampaignCharacters(campaignId);
  const current = currentTurnCombatant(battle.combatants);
  const isMyTurn = current?.type === 'CHARACTER' && current.ownerUserId === currentUserId;

  const joinedCharIds = useMemo(
    () => new Set(battle.combatants.filter((c) => c.type === 'CHARACTER').map((c) => c.characterId)),
    [battle.combatants],
  );
  const myChars = (characters ?? []).filter((c) => c.ownerId === currentUserId);
  const available = myChars.filter((c) => !joinedCharIds.has(c.id));

  return (
    <div className={s.tabPad}>
      {isMyTurn && current ? (
        <ActionPanel
          campaignId={campaignId}
          battle={battle}
          current={current}
          tacticalTokens={tacticalTokens}
          movement={movement}
          mapSessionId={mapSessionId}
        />
      ) : battle.status === 'ACTIVE' && available.length > 0 ? (
        <JoinPanel campaignId={campaignId} battle={battle} chars={available} />
      ) : battle.status === 'ASSEMBLING' && available.length > 0 ? (
        <div className={s.note}>{t('battle.empty.player.body')}</div>
      ) : (
        <div className={s.note}>
          {myChars.length === 0
            ? t('battle.join.noCharacters')
            : current
              ? t('battle.gm.currentTurnOf', { name: current.displayName })
              : t('battle.tracker.waiting')}
        </div>
      )}
    </div>
  );
}

/* ── action panel (their turn) ─────────────────────────────── */

function ActionPanel({
  campaignId,
  battle,
  current,
  tacticalTokens,
  movement,
  mapSessionId,
}: {
  campaignId: string;
  battle: BattleResponse;
  current: BattleCombatantResponse;
  tacticalTokens: TacticalTokenView[];
  movement: MovementConfig | null;
  mapSessionId: string | null;
}) {
  const t = useT();
  const endTurn = useEndTurn();
  const { data: turn, isLoading } = useBattleCurrentTurn(campaignId, battle.id, true);

  const resources = turn?.resources ?? [];
  const spellSlotLevels = turn?.spellSlots?.levels ?? [];
  const attacks = useMemo(() => characterAttackOptions(turn), [turn]);
  const spells = turn?.character?.knownSpells ?? [];
  const effects = turn?.activeEffects ?? [];
  const targets = useMemo(() => liveTargets(battle.combatants, current), [battle.combatants, current]);

  // Pre-fill the target from the token selected on the map (if it is a live target).
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const lockedTargetId = useMemo(() => {
    if (!selectedTokenId) return null;
    const view = tacticalTokens.find((tk) => tk.tokenId === selectedTokenId);
    const id = view?.linkedCombatantId ?? null;
    return id && targets.some((c) => c.id === id) ? id : null;
  }, [selectedTokenId, tacticalTokens, targets]);

  // Spells can target ANY live combatant (enemy for damage, ally/self for heals/buffs) — unlike
  // attacks, which are opposing-side only. Pre-select from the token clicked on the map, if valid.
  const spellTargets = useMemo(
    () => battle.combatants.filter((c) => c.currentHp == null || c.currentHp > 0),
    [battle.combatants],
  );
  const spellLockedTargetId = useMemo(() => {
    if (!selectedTokenId) return null;
    const view = tacticalTokens.find((tk) => tk.tokenId === selectedTokenId);
    const id = view?.linkedCombatantId ?? null;
    return id && spellTargets.some((c) => c.id === id) ? id : null;
  }, [selectedTokenId, tacticalTokens, spellTargets]);

  return (
    <div>
      <p className={cn('ao-overline', s.goldOverline)}>{t('battle.action.title')}</p>
      <h4 className={cn('ao-h4', s.tabTitle)}>{current.displayName}</h4>

      <DefaultActions movement={movement} tacticalTokens={tacticalTokens} />

      <div className={s.block}>
        <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.economy')}</div>
        <div className="ao-row ao-gap-12 ao-wrap">
          <ActionPips label={t('battle.action.economy.action')} spent={current.actionSpent} max={current.actionMax} />
          <ActionPips
            label={t('battle.action.economy.bonus')}
            spent={current.bonusActionSpent}
            max={current.bonusActionMax}
          />
          <span className={s.economyStat}>
            <span className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.economy.reaction')}</span>
            <span className={cn('ao-num', s.economyNum)}>
              {t(current.reactionUsed ? 'battle.action.economy.used' : 'battle.action.economy.free')}
            </span>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className={cn('ao-breathe', s.skWrap)}>
          <div className="ao-ph" />
          <div className="ao-ph" />
        </div>
      ) : (
        <>
          <div className={s.block}>
            <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.resources')}</div>
            {resources.length === 0 ? (
              <div className={s.muted}>{t('battle.action.noResources')}</div>
            ) : (
              resources.map((r) => (
                <div key={r.resourceTypeId} className={s.resItem}>
                  <div className="ao-row ao-between">
                    <span>{r.resourceName ?? r.name}</span>
                    <span className="ao-num">
                      {r.currentValue} / {r.maxValue}
                    </span>
                  </div>
                  <Bar value={r.currentValue} max={r.maxValue} tone="arcane" height={6} showNumbers={false} />
                </div>
              ))
            )}
          </div>

          {spellSlotLevels.length > 0 && (
            <div className={s.block}>
              <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.slots')}</div>
              {spellSlotLevels.map((sl) => (
                <div key={sl.spellLevel} className={s.resItem}>
                  <div className="ao-row ao-between">
                    <span>{t('battle.action.slot.level', { n: sl.spellLevel })}</span>
                    <span className="ao-num">
                      {sl.available} / {sl.max}
                    </span>
                  </div>
                  <Bar value={sl.available} max={sl.max} tone="arcane" height={6} showNumbers={false} />
                </div>
              ))}
            </div>
          )}

          <div className={s.block}>
            <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.attacks')}</div>
            <AttackForm
              campaignId={campaignId}
              battleId={battle.id}
              attacks={attacks}
              targets={targets}
              lockedTargetId={lockedTargetId}
              tacticalTokens={tacticalTokens}
              attackerCombatantId={current.id}
            />
          </div>

          <StandardActionsPanel campaignId={campaignId} battle={battle} combatant={current} />

          {current.characterId && (
            <AbilityUseSection
              campaignId={campaignId}
              battleId={battle.id}
              characterId={current.characterId}
              classActions={turn?.featureActions ?? []}
              targets={spellTargets}
              lockedTargetId={spellLockedTargetId}
            />
          )}

          {current.characterId && (
            <ItemsSection campaignId={campaignId} battleId={battle.id} characterId={current.characterId} />
          )}

          {spells.length > 0 && current.characterId && (
            <SpellCastSection
              campaignId={campaignId}
              battleId={battle.id}
              characterId={current.characterId}
              spells={spells}
              targets={spellTargets}
              lockedTargetId={spellLockedTargetId}
              mapSessionId={mapSessionId}
            />
          )}

          {effects.length > 0 && (
            <div className={s.block}>
              <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.effects')}</div>
              <div className={s.chips}>
                {effects.map((e) => (
                  <span key={e.id} className={cn('ao-chip', e.isBuff ? 'ao-chip--gold' : 'ao-chip--ember')}>
                    {e.buffDebuffName}
                    {e.remainingRounds != null && <span className={s.chipMeta}>{e.remainingRounds}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt12)}
        onClick={() =>
          endTurn.mutate({
            campaignId,
            battleId: battle.id,
            expectedTurnIndex: battle.currentTurnIndex,
            expectedRound: battle.roundNumber,
          })
        }
        disabled={endTurn.isPending}
      >
        <Rune kind="check" size={14} color="currentColor" />
        <span className={s.ml6}>{t('battle.action.endTurn')}</span>
      </button>
    </div>
  );
}

/** Action-economy pips for one pool (action / bonus action): available filled, spent hollow. */
function ActionPips({ label, spent, max }: { label: string; spent: number; max: number }) {
  if (max <= 0) return null;
  const available = Math.max(0, max - spent);
  return (
    <span className={s.economyStat}>
      <span className={cn('ao-overline', s.fieldLabel)}>{label}</span>
      <span className="ao-row ao-gap-2">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={cn(s.pip, i < available ? s.pipFull : s.pipEmpty)} />
        ))}
        <span className={cn('ao-num', s.economyNum)}>
          {available}/{max}
        </span>
      </span>
    </span>
  );
}

/* ── spells (cast on their turn) ───────────────────────────── */

function SpellCastSection({
  campaignId,
  battleId,
  characterId,
  spells,
  targets,
  lockedTargetId,
  mapSessionId,
}: {
  campaignId: string;
  battleId: string;
  characterId: string;
  spells: Array<{ spellId: string; name: string; level: number }>;
  targets: BattleCombatantResponse[];
  lockedTargetId: string | null;
  mapSessionId: string | null;
}) {
  const t = useT();
  const cast = useBattleCastSpell();
  const [spellId, setSpellId] = useState(spells[0]?.spellId ?? '');
  const [targetId, setTargetId] = useState(lockedTargetId ?? targets[0]?.id ?? '');
  const selectedSpell = spells.find((sp) => sp.spellId === spellId);
  const isLeveled = !!selectedSpell && selectedSpell.level > 0;
  const [slot, setSlot] = useState(selectedSpell?.level ?? 0);
  // Damage: AUTO (server rolls) by default, or MANUAL (player enters the rolled total).
  const [manualMode, setManualMode] = useState(false);
  const [manualStr, setManualStr] = useState('');

  // Keep the selections valid as the lists change; reset the upcast slot when the spell changes.
  useEffect(() => {
    if (!spells.some((sp) => sp.spellId === spellId)) setSpellId(spells[0]?.spellId ?? '');
  }, [spells, spellId]);
  useEffect(() => {
    if (lockedTargetId && targets.some((c) => c.id === lockedTargetId)) setTargetId(lockedTargetId);
  }, [lockedTargetId, targets]);
  useEffect(() => {
    if (!targets.some((c) => c.id === targetId)) setTargetId(targets[0]?.id ?? '');
  }, [targets, targetId]);
  useEffect(() => {
    setSlot(selectedSpell?.level ?? 0);
    setManualStr('');
    setRotationDeg(0);
  }, [spellId]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcastLevels = useMemo(
    () =>
      isLeveled && selectedSpell
        ? Array.from({ length: 9 - selectedSpell.level + 1 }, (_, i) => selectedSpell.level + i)
        : [],
    [isLeveled, selectedSpell],
  );

  // Preview: the spell's roll plan (damage dice / DC / healing) WITHOUT casting or spending.
  const { data: plan } = useQuery({
    queryKey: ['spell-plan', characterId, spellId, isLeveled ? slot : 0],
    queryFn: async () =>
      (await spellbookApi.plan(characterId, spellId, isLeveled ? slot : undefined)).data ?? null,
    enabled: !!characterId && !!spellId,
    staleTime: 60_000,
  });

  const hasDamage = (plan?.damages?.length ?? 0) > 0;
  const manualNum = parseInt(manualStr, 10);
  const manualValid = Number.isFinite(manualNum) && manualNum >= 0;

  // AoE (Phase 2.3): the template's origin is the cell selected on the map; map answers who is
  // covered. Casting into an empty area is legal (zone spells like Web still create the zone).
  const isAoe = !!mapSessionId && !!plan?.area?.shape && plan?.area?.sizeFt != null;
  const aoeShape = plan?.area?.shape ?? '';
  const aoeSizeFt = plan?.area?.sizeFt ?? 0;
  // Cones and lines point somewhere; spheres/cubes are symmetric and need no direction.
  const needsRotation = isAoe && (aoeShape === 'CONE' || aoeShape === 'LINE');
  const [rotationDeg, setRotationDeg] = useState(0);
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const setAoePreview = useMapTransientStore((st) => st.setAoePreview);
  const origin = isAoe && selectedCell
    ? { x: Math.floor(selectedCell.gridX), y: Math.floor(selectedCell.gridY) }
    : null;
  const originX = origin?.x ?? null;
  const originY = origin?.y ?? null;

  // Live template preview on the map while aiming (cleared on unmount/spell change/cast).
  useEffect(() => {
    if (isAoe && originX != null && originY != null) {
      setAoePreview({
        shape: aoeShape,
        sizeFt: aoeSizeFt,
        originX,
        originY,
        rotationDeg: needsRotation ? rotationDeg : 0,
        label: selectedSpell?.name,
      });
    } else {
      setAoePreview(null);
    }
    return () => setAoePreview(null);
  }, [isAoe, aoeShape, aoeSizeFt, originX, originY, needsRotation, rotationDeg, selectedSpell?.name, setAoePreview]);

  const { data: aoeCovered } = useQuery({
    queryKey: ['aoe-targets', mapSessionId, aoeShape, aoeSizeFt, originX, originY, needsRotation ? rotationDeg : 0],
    queryFn: async () =>
      mapSessionApi.aoeTargets(mapSessionId!, {
        shape: aoeShape,
        sizeFt: aoeSizeFt,
        originX: originX!,
        originY: originY!,
        rotationDeg: needsRotation ? rotationDeg : 0,
      }),
    enabled: isAoe && originX != null && originY != null,
  });
  const aoeCombatantIds = useMemo(
    () => (aoeCovered ?? []).map((c) => c.combatantId).filter((id): id is string => !!id),
    [aoeCovered],
  );

  // In manual mode you must enter the rolled total; an AoE cast needs its origin cell picked.
  const canCast = !!spellId && !(hasDamage && manualMode && !manualValid) && (!isAoe || !!origin);

  const submit = () => {
    if (!canCast) return;
    cast.mutate(
      {
        campaignId,
        battleId,
        data: {
          spellId,
          targetCombatantId: isAoe ? undefined : targetId || undefined,
          targetCombatantIds: isAoe && aoeCombatantIds.length > 0 ? aoeCombatantIds : undefined,
          originX: isAoe ? origin!.x : undefined,
          originY: isAoe ? origin!.y : undefined,
          rotationDeg: needsRotation ? rotationDeg : undefined,
          slotLevel: isLeveled ? slot : undefined,
          damageRollMode: hasDamage && manualMode ? 'MANUAL' : 'AUTO',
          manualDamage: hasDamage && manualMode && manualValid ? manualNum : undefined,
        },
      },
      {
        onSuccess: () => {
          // The zone (if any) now lives on the map — drop the aiming preview and the manual total.
          setManualStr('');
          setAoePreview(null);
        },
      },
    );
  };

  // Why the cast button is disabled — surfaced as a hint instead of a silently dead button.
  const disabledReason = !spellId
    ? null
    : isAoe && !origin
      ? t('battle.action.spell.aoePickCell')
      : hasDamage && manualMode && !manualValid
        ? t('battle.action.spell.manualDmg')
        : null;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.spells')}</div>

      <div className={s.optGrid}>
        {spells.map((sp) => (
          <button
            key={sp.spellId}
            type="button"
            className={cn(s.optBtn, spellId === sp.spellId && s.optBtnActive)}
            onClick={() => setSpellId(sp.spellId)}
          >
            <Rune kind="book" size={10} color="var(--arcane)" />
            <span className={s.optName}>{sp.name}</span>
            <span className={s.optMeta}>
              {sp.level === 0
                ? t('battle.action.spell.cantrip')
                : t('battle.action.spell.level', { n: sp.level })}
            </span>
          </button>
        ))}
      </div>

      {upcastLevels.length > 1 && (
        <div className={cn('ao-row ao-gap-8', s.mt12)}>
          <span className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.spell.upcast')}</span>
          <select
            className={cn('ao-input', s.sizeSelect)}
            value={slot}
            disabled={cast.isPending}
            onChange={(e) => setSlot(Number(e.target.value))}
          >
            {upcastLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {t('battle.action.spell.slotLevel', { n: lvl })}
              </option>
            ))}
          </select>
        </div>
      )}

      {plan && <SpellPreview plan={plan} />}

      {hasDamage && (
        <>
          <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.action.spell.damageRoll')}</div>
          <div className="ao-row ao-gap-4 ao-wrap">
            <button
              type="button"
              className={cn('ao-btn ao-btn--sm', !manualMode ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setManualMode(false)}
            >
              {t('battle.action.spell.auto')}
            </button>
            <button
              type="button"
              className={cn('ao-btn ao-btn--sm', manualMode ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setManualMode(true)}
            >
              {t('battle.action.spell.manual')}
            </button>
            {manualMode && (
              <input
                className={cn('ao-input', s.numField)}
                inputMode="numeric"
                value={manualStr}
                placeholder={t('battle.action.spell.manualDmg')}
                onChange={(e) => setManualStr(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            )}
          </div>
          <div className={cn('ao-italic', s.hint)}>
            {manualMode ? t('battle.action.spell.manualHint') : t('battle.action.spell.autoHint')}
          </div>
        </>
      )}

      {isAoe ? (
        <>
          <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.action.spell.aoe')}</div>
          <div className={cn('ao-italic', s.hint)}>
            {origin
              ? t('battle.action.spell.aoeOrigin', { x: origin.x, y: origin.y })
              : t('battle.action.spell.aoePickCell')}
          </div>
          {needsRotation && (
            <div className="ao-row ao-gap-8 ao-wrap">
              <span className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.spell.direction')}</span>
              <div className="ao-row ao-gap-2">
                {/* Grid Y grows downward on screen, so 90° points down. */}
                {([
                  [0, '→'],
                  [45, '↘'],
                  [90, '↓'],
                  [135, '↙'],
                  [180, '←'],
                  [225, '↖'],
                  [270, '↑'],
                  [315, '↗'],
                ] as const).map(([deg, arrow]) => (
                  <button
                    key={deg}
                    type="button"
                    className={cn('ao-btn ao-btn--sm', rotationDeg === deg ? 'ao-btn--primary' : 'ao-btn--ghost')}
                    aria-label={t('battle.action.spell.directionDeg', { n: deg })}
                    title={t('battle.action.spell.directionDeg', { n: deg })}
                    onClick={() => setRotationDeg(deg)}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>
          )}
          {origin && (
            <div className={s.chips}>
              {(aoeCovered ?? []).length === 0 ? (
                <span className={cn('ao-italic', s.hint)}>{t('battle.action.spell.aoeNobody')}</span>
              ) : (
                (aoeCovered ?? []).map((c) => (
                  <span key={c.tokenId} className="ao-chip ao-chip--ember">
                    {c.name}
                  </span>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
      )}

      <button
        className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt12)}
        onClick={submit}
        disabled={!canCast || cast.isPending}
        title={disabledReason ?? t('battle.action.spell.castTitle')}
      >
        <Rune kind="book" size={14} color="currentColor" />
        <span className={s.ml6}>
          {cast.isPending ? t('battle.action.spell.casting') : t('battle.action.spell.castTitle')}
        </span>
      </button>
      <div className={cn('ao-italic', s.hint)}>
        {disabledReason ? t('battle.action.spell.blocked', { reason: disabledReason }) : t('battle.action.spell.hint')}
      </div>
    </div>
  );
}

/** Read-only preview of a spell's roll plan (damage dice / DC / healing). */
function SpellPreview({ plan }: { plan: SpellPlan }) {
  const t = useT();
  const damages = plan.damages ?? [];
  const healings = plan.healings ?? [];
  if (!damages.length && !healings.length && !plan.requiresManualAdjudication && !plan.area && !plan.zone) {
    return null;
  }

  const fmtDice = (d: SpellPlanDamage) => {
    const dice = d.diceExpression ?? '';
    const flat = d.flatAmount ? (dice ? `+${d.flatAmount}` : `${d.flatAmount}`) : '';
    return `${dice}${flat}`.trim() || '—';
  };

  return (
    <div className={cn(s.spellPreview, s.mt12)}>
      {plan.area?.shape && (
        <div className={s.spellPreviewLine}>
          {t('battle.action.spell.preview.area', {
            shape: t(`battle.action.spell.shape.${plan.area.shape}`),
            n: plan.area.sizeFt ?? 0,
          })}
        </div>
      )}
      {plan.zone?.persists && (
        <div className={s.spellPreviewLine}>
          {[
            plan.zone.terrain === 'DIFFICULT' ? t('battle.action.spell.preview.difficult') : null,
            plan.zone.obscurement ? t(`battle.action.spell.preview.obscure.${plan.zone.obscurement}`) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
      {damages.map((d, i) => (
        <div key={`d${i}`} className={s.spellPreviewLine}>
          {t('battle.action.spell.preview.damage', { dice: fmtDice(d) })}
          {d.requiresSave && d.saveDc != null
            ? ` · ${t('battle.action.spell.preview.save', { dc: d.saveDc })}${d.halfOnSave ? ` (${t('battle.action.spell.preview.half')})` : ''}`
            : d.requiresAttackHit
              ? ` · ${t('battle.action.spell.preview.attack')}`
              : ''}
        </div>
      ))}
      {healings.map((h, i) => (
        <div key={`h${i}`} className={s.spellPreviewLine}>
          {t('battle.action.spell.preview.heal', { n: h.amount ?? 0 })}
        </div>
      ))}
      {plan.requiresManualAdjudication && (
        <div className={cn('ao-italic', s.hint)}>{t('battle.action.spell.preview.manual')}</div>
      )}
    </div>
  );
}

/* ── feature-rules abilities (class + item source) ─────────── */

function AbilityUseSection({
  campaignId,
  battleId,
  characterId,
  classActions,
  targets,
  lockedTargetId,
}: {
  campaignId: string;
  battleId: string;
  characterId: string;
  classActions: FeatureActionResponse[];
  targets: BattleCombatantResponse[];
  lockedTargetId: string | null;
}) {
  const t = useT();
  const useAbility = useBattleUseAbility();
  const { data: inventory } = useCharacterInventory(campaignId, characterId);
  const [targetId, setTargetId] = useState(lockedTargetId ?? targets[0]?.id ?? '');
  const [selectedClassId, setSelectedClassId] = useState(classActions[0]?.featureId ?? '');
  const [manualMode, setManualMode] = useState(false);
  const [manualStr, setManualStr] = useState('');

  useEffect(() => {
    if (lockedTargetId && targets.some((c) => c.id === lockedTargetId)) setTargetId(lockedTargetId);
  }, [lockedTargetId, targets]);
  useEffect(() => {
    if (!targets.some((c) => c.id === targetId)) setTargetId(targets[0]?.id ?? '');
  }, [targets, targetId]);
  useEffect(() => {
    if (!classActions.some((action) => action.featureId === selectedClassId)) {
      setSelectedClassId(classActions[0]?.featureId ?? '');
    }
  }, [classActions, selectedClassId]);

  const itemActions = useMemo(
    () =>
      (inventory ?? []).flatMap((item) =>
        (item.abilities ?? []).map((ability) => ({
          item,
          ability,
        })),
      ),
    [inventory],
  );
  const hasAbilities = classActions.length > 0 || itemActions.length > 0;

  const commandId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const selectedClass = classActions.find((action) => action.featureId === selectedClassId) ?? null;
  const { data: classPlan, isFetching: classPlanLoading } = useQuery({
    queryKey: ['battle-ability-plan', campaignId, battleId, selectedClassId],
    queryFn: async () => (await battlesApi.planAbility(campaignId, battleId, selectedClassId)).data ?? null,
    enabled: !!campaignId && !!battleId && !!selectedClassId,
    staleTime: 60_000,
  });
  const classHasDamage = (classPlan?.damages?.length ?? 0) > 0;
  const manualNum = parseInt(manualStr, 10);
  const manualValid = Number.isFinite(manualNum) && manualNum >= 0;
  const classUseBlocked =
    !selectedClass
      ? null
      : !selectedClass.available
        ? selectedClass.unavailableReason || t('battle.action.ability.unavailable')
        : selectedClass.requiresTarget && !targetId
          ? t('battle.attack.pickTarget')
          : classHasDamage && manualMode && !manualValid
            ? t('battle.action.spell.manualDmg')
            : null;

  if (!hasAbilities) return null;

  const submitClass = () => {
    if (!selectedClass || classUseBlocked) return;
    useAbility.mutate({
      campaignId,
      battleId,
      characterId,
      data: {
        featureId: selectedClass.featureId,
        targetCombatantId: targetId || undefined,
        damageRollMode: classHasDamage ? (manualMode ? 'MANUAL' : 'AUTO') : undefined,
        manualDamage: classHasDamage && manualMode ? manualNum : undefined,
        clientCommandId: commandId(),
      },
    });
  };

  const submitItem = (item: ItemInstanceResponse, ruleId: string) => {
    useAbility.mutate({
      campaignId,
      battleId,
      characterId,
      data: {
        featureId: ruleId,
        itemInstanceId: item.id,
        targetCombatantId: targetId || undefined,
        clientCommandId: commandId(),
      },
    });
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.abilities')}</div>

      {targets.length > 0 && (
        <>
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
        </>
      )}

      {classActions.length > 0 && (
        <>
          <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.action.ability.class')}</div>
          <div className={s.itemList}>
            {classActions.map((action) => {
              return (
                <button
                  key={action.featureId}
                  type="button"
                  className={cn('ao-btn ao-btn--sm', s.itemBtn, selectedClassId === action.featureId && s.itemBtnActive)}
                  onClick={() => setSelectedClassId(action.featureId)}
                  title={action.unavailableReason ?? t('battle.action.ability.use')}
                  aria-pressed={selectedClassId === action.featureId}
                >
                  <span className={s.itemName}>{action.featureName}</span>
                  {action.actionTypeLabel && <span className={s.chipMeta}>{action.actionTypeLabel}</span>}
                  {action.manualOnly && <span className={s.chipMeta}>{t('battle.action.ability.manualOnly')}</span>}
                  {action.resourceCost != null && action.resourceKey && (
                    <span className={s.chipMeta}>
                      {action.resourceKey} -{action.resourceCost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {classPlanLoading && <div className={cn(s.muted, s.mt12)}>{t('battle.action.ability.previewLoading')}</div>}
          {classPlan && <SpellPreview plan={classPlan} />}
          {classHasDamage && (
            <>
              <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.action.spell.damageRoll')}</div>
              <div className="ao-row ao-gap-4 ao-wrap">
                <button
                  type="button"
                  className={cn('ao-btn ao-btn--sm', !manualMode && 'ao-btn--primary')}
                  onClick={() => setManualMode(false)}
                >
                  {t('battle.action.spell.auto')}
                </button>
                <button
                  type="button"
                  className={cn('ao-btn ao-btn--sm', manualMode && 'ao-btn--primary')}
                  onClick={() => setManualMode(true)}
                >
                  {t('battle.action.spell.manual')}
                </button>
              </div>
              {manualMode && (
                <div className={cn('ao-row ao-gap-8 ao-wrap', s.mt8)}>
                  <input
                    className={cn('ao-input', s.numField)}
                    type="number"
                    min={0}
                    value={manualStr}
                    onChange={(e) => setManualStr(e.target.value)}
                    placeholder={t('battle.action.spell.manualDmg')}
                  />
                  <span className={s.hint}>{t('battle.action.spell.manualHint')}</span>
                </div>
              )}
            </>
          )}
          {classUseBlocked && <div className={cn('ao-italic', s.hint, s.mt8)}>{t('battle.action.ability.blocked', { reason: classUseBlocked })}</div>}
          <button
            type="button"
            className={cn('ao-btn ao-btn--sm ao-btn--primary', s.mt12)}
            disabled={useAbility.isPending || !!classUseBlocked || !selectedClass}
            onClick={submitClass}
          >
            {t('battle.action.ability.use')}
          </button>
        </>
      )}

      {itemActions.length > 0 && (
        <>
          <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('battle.action.ability.item')}</div>
          <div className={s.itemList}>
            {itemActions.map(({ item, ability }) => {
              const disabled = useAbility.isPending || !ability.available;
              const charges = ability.charges;
              return (
                <button
                  key={`${item.id}:${ability.ruleId}`}
                  type="button"
                  className={cn('ao-btn ao-btn--sm', s.itemBtn)}
                  disabled={disabled}
                  onClick={() => submitItem(item, ability.ruleId)}
                  title={ability.unavailableReason ?? t('battle.action.ability.use')}
                >
                  <span className={s.itemName}>{ability.name || item.displayName}</span>
                  <span className={s.chipMeta}>{item.displayName}</span>
                  {charges && (
                    <span className={s.chipMeta}>
                      {charges.current ?? 0}/{charges.max ?? '∞'}
                    </span>
                  )}
                  {ability.consumesItem && <span className={s.chipMeta}>{t('battle.action.ability.consumes')}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── items (consume a carried item on their turn) ──────────── */

function ItemsSection({
  campaignId,
  battleId,
  characterId,
}: {
  campaignId: string;
  battleId: string;
  characterId: string;
}) {
  const t = useT();
  const qc = useQueryClient();
  const { data: backpack } = useBackpackInventory(campaignId, characterId);
  const items = useMemo(() => (backpack ?? []).filter((i) => i.quantity > 0), [backpack]);

  const useItem = useMutation({
    mutationFn: (itemInstanceId: string) => battlesApi.useItem(campaignId, battleId, { itemInstanceId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory'] });
      toast.success(t('battle.action.item.used'));
    },
    onError: () => toast.error(t('battle.action.item.failed')),
  });

  if (!items.length) return null;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.items')}</div>
      <div className={s.itemList}>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={cn('ao-btn ao-btn--sm', s.itemBtn)}
            disabled={useItem.isPending}
            onClick={() => useItem.mutate(it.id)}
            title={t('battle.action.item.use')}
          >
            <span className={s.itemName}>{it.displayName}</span>
            {it.quantity > 1 && <span className={s.chipMeta}>×{it.quantity}</span>}
          </button>
        ))}
      </div>
      <div className={cn('ao-italic', s.hint)}>{t('battle.action.item.hint')}</div>
    </div>
  );
}

/* ── join panel ────────────────────────────────────────────── */

function JoinPanel({
  campaignId,
  battle,
  chars,
}: {
  campaignId: string;
  battle: BattleResponse;
  chars: CharacterV2Response[];
}) {
  const t = useT();
  const join = useJoinBattle();
  const [charId, setCharId] = useState(chars[0]?.id ?? '');
  const [initStr, setInitStr] = useState('');
  const { data: bonus } = useInitiativeBonus(campaignId, battle.id, charId || undefined);

  useEffect(() => {
    if (!chars.some((c) => c.id === charId)) setCharId(chars[0]?.id ?? '');
  }, [chars, charId]);

  const initNum = parseInt(initStr, 10);
  const d20Manual = Number.isFinite(initNum) && initNum >= 1 && initNum <= 20;
  // No d20 entered ⇒ the server rolls the initiative die (A2 — no client Math.random).
  const valid = !!charId;
  const total = d20Manual && bonus != null ? initNum + bonus : null;
  const fmtSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  const submit = () => {
    if (!valid) return;
    join.mutate(
      {
        campaignId,
        battleId: battle.id,
        data: { characters: [{ characterId: charId, ...(d20Manual ? { d20: initNum } : {}) }] },
      },
      { onSuccess: () => setInitStr('') },
    );
  };

  return (
    <div>
      <p className={cn('ao-overline', s.goldOverline)}>{t('battle.join.title')}</p>

      <div className={s.block}>
        <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.pickCharacter')}</div>
        <div className={s.optGrid}>
          {chars.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(s.optBtn, charId === c.id && s.optBtnActive)}
              onClick={() => setCharId(c.id)}
            >
              <span className={s.optName}>{c.name}</span>
              <span className={s.optMeta}>
                {c.classLevels?.[0]?.className ?? ''} · LVL {c.totalLevel}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={s.block}>
        <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.initiative')}</div>
        <input
          className={cn('ao-input', s.numField)}
          inputMode="numeric"
          value={initStr}
          placeholder="—"
          onChange={(e) => setInitStr(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <div className={s.hint}>{t('battle.join.serverRollHint')}</div>
        {total != null && bonus != null && (
          <div className={s.initResult}>
            <span className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.computed')}</span>
            <span className={s.initResultVal}>{total}</span>
            <span className={s.listMeta}>
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
  );
}
