/**
 * Right column of the tactical workspace: the selection inspector + combat actions
 * (frontend prompt 04). Selection lives in the transient map store (shared with the
 * viewport); combat resolution goes through the CORE battle API (attack / HP delta),
 * never the map-service. The map token state is never mutated by an attack — only the
 * battle query is refreshed, and the derived view recomputes HP from it.
 */

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse, CombatantCondition, SpellSlotsResponse } from '@/types';
import { useBattleAttack, useApplyCombatantHp } from '@/hooks/useBattles';
import { referenceApi } from '@/api/reference.api';
import { battlesApi } from '@/api/battles.api';
import { spellSlotsApi } from '@/api/spellSlots.api';
import { mapTokenApi } from '../api/mapTokenApi';
import { useMapSessionStore, useMapTransientStore } from '../state';
import {
  buildHpDeltaRequest,
  gridChebyshevDistance,
  resolveSelectedTarget,
} from './tacticalSelection';
import type { TacticalTokenView } from './tacticalView';
import s from './TacticalBattlePage.module.css';

interface TacticalInspectorPanelProps {
  campaignId: string;
  battleId: string;
  isGm: boolean;
  tacticalTokens: TacticalTokenView[];
  /** Combatant whose turn it is — used as the origin for the distance read-out. */
  activeCombatant: BattleCombatantResponse | null;
}

export function TacticalInspectorPanel({
  campaignId,
  battleId,
  isGm,
  tacticalTokens,
  activeCombatant,
}: TacticalInspectorPanelProps) {
  const t = useT();
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const placement = useMapTransientStore((st) => st.placement);

  const target = useMemo(
    () => resolveSelectedTarget({ selectedTokenId, selectedCell, tokens: tacticalTokens }),
    [selectedTokenId, selectedCell, tacticalTokens],
  );

  if (target.kind === 'CELL') {
    return (
      <div className={s.right}>
        <p className="ao-overline">{t('tactical.inspect.cellOverline')}</p>
        <h4 className="ao-h4">
          {target.gridX}, {target.gridY}
        </h4>
        {placement && (
          <p className={cn('ao-italic', s.leftHint)}>{t('tactical.inspect.placingHere')}</p>
        )}
      </div>
    );
  }

  if (target.kind === 'TOKEN') {
    const view = tacticalTokens.find((tk) => tk.tokenId === target.tokenId) ?? null;
    return (
      <TokenInspector
        campaignId={campaignId}
        battleId={battleId}
        isGm={isGm}
        view={view}
        tokenId={target.tokenId}
        combatantId={target.combatantId}
        activeCombatant={activeCombatant}
        tokens={tacticalTokens}
      />
    );
  }

  return (
    <div className={s.panelEmpty}>
      <p className="ao-overline">{t('tactical.inspect.overline')}</p>
      <p className="ao-italic">{t('tactical.inspect.empty')}</p>
    </div>
  );
}

function TokenInspector({
  campaignId,
  battleId,
  isGm,
  view,
  tokenId,
  combatantId,
  activeCombatant,
  tokens,
}: {
  campaignId: string;
  battleId: string;
  isGm: boolean;
  view: TacticalTokenView | null;
  tokenId: string;
  combatantId: string | null;
  activeCombatant: BattleCombatantResponse | null;
  tokens: TacticalTokenView[];
}) {
  const t = useT();
  const rawToken = useMapSessionStore((st) => st.tokensById[tokenId]);
  const forceMode = useMapTransientStore((st) => st.forceMode);
  const hpKnown = view?.currentHp != null && view?.maxHp != null;
  const combatant = view?.combatant ?? null;

  // Distance from the active combatant's token (if both are on the map).
  const distance = useMemo(() => {
    if (!view || !activeCombatant) return null;
    const origin = tokens.find((tk) => tk.linkedCombatantId === activeCombatant.id);
    if (!origin || origin.tokenId === view.tokenId) return null;
    return gridChebyshevDistance(origin, view);
  }, [view, activeCombatant, tokens]);

  return (
    <div className={s.right}>
      <p className="ao-overline">{t('tactical.inspect.overline')}</p>
      <h4 className="ao-h4">{view?.displayName ?? rawToken?.name ?? tokenId}</h4>

      <dl className={s.inspectGrid}>
        <dt>{t('tactical.inspect.type')}</dt>
        <dd>{view?.tokenType ?? rawToken?.tokenType}</dd>

        {view && (
          <>
            <dt>{t('tactical.inspect.position')}</dt>
            <dd>
              {view.gridX}, {view.gridY}
            </dd>
          </>
        )}

        {rawToken && (
          <>
            <dt>{t('tactical.inspect.elevation')}</dt>
            <dd>{formatElevationFt(rawToken.elevationFt)}</dd>
          </>
        )}

        {hpKnown && (
          <>
            <dt>{t('tactical.inspect.hp')}</dt>
            <dd>
              {view!.currentHp}/{view!.maxHp}
            </dd>
          </>
        )}

        {distance != null && (
          <>
            <dt>{t('tactical.inspect.distance')}</dt>
            <dd>
              {distance} {t('tactical.inspect.cells')}
            </dd>
          </>
        )}

        <dt>{t('tactical.inspect.turn')}</dt>
        <dd>{t(view?.currentTurn ? 'tactical.yes' : 'tactical.no')}</dd>

        {/* GM-only detail: ids, initiative, lock/visibility. */}
        {isGm && (
          <>
            {combatantId && (
              <>
                <dt>{t('tactical.inspect.combatantId')}</dt>
                <dd className={s.monoCell}>{combatantId}</dd>
              </>
            )}
            <dt>{t('tactical.inspect.tokenId')}</dt>
            <dd className={s.monoCell}>{tokenId}</dd>
            {combatant && (
              <>
                <dt>{t('tactical.inspect.initiative')}</dt>
                <dd>
                  {combatant.initiative} · #{combatant.turnOrder + 1}
                </dd>
              </>
            )}
            {rawToken && (
              <>
                <dt>{t('tactical.inspect.visible')}</dt>
                <dd>{t(rawToken.visible ? 'tactical.yes' : 'tactical.no')}</dd>
                <dt>{t('tactical.inspect.locked')}</dt>
                <dd>{t(rawToken.locked ? 'tactical.yes' : 'tactical.no')}</dd>
              </>
            )}
          </>
        )}
      </dl>

      {isGm && combatant && (
        <HpAdjuster campaignId={campaignId} battleId={battleId} combatantId={combatant.id} />
      )}

      {isGm && combatant && (
        <InitiativeReroll campaignId={campaignId} battleId={battleId} combatantId={combatant.id} />
      )}

      {/* GM spell-slot management for a character — unlocked by the "обход правил" toggle. */}
      {isGm && forceMode && combatant?.characterId && (
        <SpellSlotsGm characterId={combatant.characterId} campaignId={campaignId} />
      )}

      {isGm && rawToken && (
        <ElevationAdjuster
          sessionId={rawToken.mapSessionId}
          tokenId={rawToken.id}
          elevationFt={rawToken.elevationFt}
        />
      )}

      {isGm && rawToken && (
        <VisibilityToggle
          sessionId={rawToken.mapSessionId}
          tokenId={rawToken.id}
          visible={rawToken.visible}
        />
      )}

      {isGm && rawToken && (
        <GmFieldsEditor
          sessionId={rawToken.mapSessionId}
          tokenId={rawToken.id}
          gmName={rawToken.gmName}
          gmNotes={rawToken.gmNotes}
        />
      )}

      {isGm && combatant && (
        <ConditionManager
          campaignId={campaignId}
          battleId={battleId}
          combatantId={combatant.id}
          conditions={combatant.conditions}
        />
      )}

      {isGm &&
        combatant &&
        combatant.type === 'CHARACTER' &&
        ((combatant.currentHp != null && combatant.currentHp <= 0) || combatant.dead) && (
          <DeathSaveControls campaignId={campaignId} battleId={battleId} combatant={combatant} />
        )}

      <AttackConfirm
        campaignId={campaignId}
        battleId={battleId}
        targetCombatantId={combatantId}
        targetName={view?.displayName ?? rawToken?.name ?? tokenId}
      />
    </div>
  );
}

function HpAdjuster({
  campaignId,
  battleId,
  combatantId,
}: {
  campaignId: string;
  battleId: string;
  combatantId: string;
}) {
  const t = useT();
  const applyHp = useApplyCombatantHp();
  const [amountStr, setAmountStr] = useState('');

  const amount = parseInt(amountStr, 10);
  const valid = Number.isFinite(amount) && amount > 0;

  const apply = (sign: 1 | -1) => {
    if (!valid) return;
    applyHp.mutate(
      { campaignId, battleId, combatantId, data: buildHpDeltaRequest(sign * amount) },
      { onSuccess: () => setAmountStr('') },
    );
  };

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.hpAdjust')}</p>
      <div className="ao-row ao-gap-8">
        <input
          className={cn('ao-input', s.amountField)}
          inputMode="numeric"
          value={amountStr}
          placeholder="0"
          onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
        />
        <button
          type="button"
          className="ao-btn ao-btn--sm ao-btn--danger"
          disabled={!valid || applyHp.isPending}
          onClick={() => apply(-1)}
        >
          {t('tactical.inspect.damage')}
        </button>
        <button
          type="button"
          className="ao-btn ao-btn--sm"
          disabled={!valid || applyHp.isPending}
          onClick={() => apply(1)}
        >
          {t('tactical.inspect.heal')}
        </button>
      </div>
    </div>
  );
}

/** "0 ft" / "↑15 ft" / "↓5 ft" — a signed, arrow-prefixed elevation read-out. */
function formatElevationFt(ft: number): string {
  if (!ft) return '0 ft';
  return `${ft > 0 ? '↑' : '↓'}${Math.abs(ft)} ft`;
}

const ELEVATION_STEP_FT = 5;
const ELEVATION_MIN_FT = -1000;
const ELEVATION_MAX_FT = 10000;

/**
 * GM quick control for a token's vertical offset (Phase 1.5). Steps ±5 ft through the
 * map-service PATCH; the committed store then refreshes from the `TOKEN_UPDATED_EVENT`
 * broadcast, so we never mutate token state locally.
 */
function ElevationAdjuster({
  sessionId,
  tokenId,
  elevationFt,
}: {
  sessionId: string;
  tokenId: string;
  elevationFt: number;
}) {
  const t = useT();
  const setElevation = useMutation({
    mutationFn: (next: number) => mapTokenApi.update(sessionId, tokenId, { elevationFt: next }),
    onError: () => toast.error(t('tactical.inspect.elevationError')),
  });

  const step = (delta: number) => {
    const next = Math.min(ELEVATION_MAX_FT, Math.max(ELEVATION_MIN_FT, elevationFt + delta));
    if (next === elevationFt) return;
    setElevation.mutate(next);
  };

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.elevation')}</p>
      <div className="ao-row ao-gap-8">
        <button
          type="button"
          className="ao-btn ao-btn--sm"
          disabled={setElevation.isPending || elevationFt <= ELEVATION_MIN_FT}
          onClick={() => step(-ELEVATION_STEP_FT)}
        >
          -{ELEVATION_STEP_FT} ft
        </button>
        <span className={s.elevationValue}>{formatElevationFt(elevationFt)}</span>
        <button
          type="button"
          className="ao-btn ao-btn--sm"
          disabled={setElevation.isPending || elevationFt >= ELEVATION_MAX_FT}
          onClick={() => step(ELEVATION_STEP_FT)}
        >
          +{ELEVATION_STEP_FT} ft
        </button>
        {elevationFt !== 0 && (
          <button
            type="button"
            className="ao-btn ao-btn--sm"
            disabled={setElevation.isPending}
            onClick={() => step(-elevationFt)}
          >
            {t('tactical.inspect.elevationReset')}
          </button>
        )}
      </div>
    </div>
  );
}

/** GM quick tool (Phase 1.7): reroll this combatant's initiative (server d20 + DEX) and re-sort. */
function InitiativeReroll({
  campaignId,
  battleId,
  combatantId,
}: {
  campaignId: string;
  battleId: string;
  combatantId: string;
}) {
  const t = useT();
  const qc = useQueryClient();
  const reroll = useMutation({
    mutationFn: () => battlesApi.rerollInitiative(campaignId, battleId, combatantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] }),
    onError: () => toast.error(t('tactical.inspect.rerollError')),
  });
  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.initiative')}</p>
      <button
        type="button"
        className="ao-btn ao-btn--sm"
        disabled={reroll.isPending}
        onClick={() => reroll.mutate()}
      >
        {t('tactical.inspect.reroll')}
      </button>
    </div>
  );
}

/**
 * GM spell-slot management for a character, unlocked by the "обход правил" toggle (Phase 2.1). The
 * GM can spend (−) or restore (+) one slot per level, or restore all — for ANY character (the
 * spell-slot API authorizes owner/GM/ADMIN). Refreshes the player's current-turn slot display too.
 */
function SpellSlotsGm({ characterId, campaignId }: { characterId: string; campaignId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: slots } = useQuery({
    queryKey: ['spell-slots', characterId],
    queryFn: async () => (await spellSlotsApi.get(characterId)).data ?? null,
  });
  const sync = (data?: SpellSlotsResponse | null) => {
    if (data) qc.setQueryData(['spell-slots', characterId], data);
    // The player's current-turn panel shows the same slots — refresh it.
    qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
  };
  const onErr = () => toast.error(t('tactical.slots.error'));
  const spend = useMutation({
    mutationFn: (lvl: number) => spellSlotsApi.expend(characterId, lvl),
    onSuccess: (res) => sync(res.data),
    onError: onErr,
  });
  const restore = useMutation({
    mutationFn: (lvl: number) => spellSlotsApi.restoreOne(characterId, lvl),
    onSuccess: (res) => sync(res.data),
    onError: onErr,
  });
  const restoreAll = useMutation({
    mutationFn: () => spellSlotsApi.restoreAll(characterId),
    onSuccess: (res) => sync(res.data),
    onError: onErr,
  });
  const busy = spend.isPending || restore.isPending || restoreAll.isPending;
  const levels = slots?.levels ?? [];
  if (!levels.length) {
    return null;
  }

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.slots.gmTitle')}</p>
      {levels.map((sl) => (
        <div key={sl.spellLevel} className="ao-row ao-gap-8">
          <span className="ao-grow">{t('battle.action.slot.level', { n: sl.spellLevel })}</span>
          <span className="ao-num">
            {sl.available}/{sl.max}
          </span>
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--ghost"
            disabled={busy || sl.expended <= 0}
            title={t('tactical.slots.restore')}
            aria-label={t('tactical.slots.restore')}
            onClick={() => restore.mutate(sl.spellLevel)}
          >
            +
          </button>
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--ghost"
            disabled={busy || sl.available <= 0}
            title={t('tactical.slots.spend')}
            aria-label={t('tactical.slots.spend')}
            onClick={() => spend.mutate(sl.spellLevel)}
          >
            −
          </button>
        </div>
      ))}
      <button type="button" className="ao-btn ao-btn--sm" disabled={busy} onClick={() => restoreAll.mutate()}>
        {t('tactical.slots.restoreAll')}
      </button>
    </div>
  );
}

/**
 * GM quick tool (Phase 1.7): hide/show a token from players. Visibility is GM-only server-side;
 * the committed store refreshes from the TOKEN_UPDATED_EVENT broadcast.
 */
function VisibilityToggle({
  sessionId,
  tokenId,
  visible,
}: {
  sessionId: string;
  tokenId: string;
  visible: boolean;
}) {
  const t = useT();
  const toggle = useMutation({
    mutationFn: (next: boolean) => mapTokenApi.update(sessionId, tokenId, { visible: next }),
    onError: () => toast.error(t('tactical.inspect.visibilityError')),
  });
  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.visibility')}</p>
      <button
        type="button"
        className="ao-btn ao-btn--sm"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(!visible)}
      >
        {t(visible ? 'tactical.inspect.hideToken' : 'tactical.inspect.showToken')}
      </button>
    </div>
  );
}

/**
 * GM quick tool (Phase 1.7): a token's private name + notes, visible only to a GM. The values are
 * seeded from the snapshot (redacted server-side for players); saving PATCHes them (they are never
 * broadcast, so other GMs see them on the next snapshot). A blank field clears the value.
 */
function GmFieldsEditor({
  sessionId,
  tokenId,
  gmName,
  gmNotes,
}: {
  sessionId: string;
  tokenId: string;
  gmName: string | null;
  gmNotes: string | null;
}) {
  const t = useT();
  const [name, setName] = useState(gmName ?? '');
  const [notes, setNotes] = useState(gmNotes ?? '');
  useEffect(() => {
    setName(gmName ?? '');
    setNotes(gmNotes ?? '');
  }, [tokenId, gmName, gmNotes]);

  const save = useMutation({
    mutationFn: () => mapTokenApi.update(sessionId, tokenId, { gmName: name, gmNotes: notes }),
    onSuccess: () => toast.success(t('tactical.inspect.gmSaved')),
    onError: () => toast.error(t('tactical.inspect.gmError')),
  });
  const dirty = name !== (gmName ?? '') || notes !== (gmNotes ?? '');

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.gmFields')}</p>
      <input
        className={cn('ao-input', s.gmNameField)}
        value={name}
        placeholder={t('tactical.inspect.gmNamePlaceholder')}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className={cn('ao-input', s.gmNotesField)}
        value={notes}
        placeholder={t('tactical.inspect.gmNotesPlaceholder')}
        rows={3}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        type="button"
        className="ao-btn ao-btn--sm"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
      >
        {t('tactical.inspect.gmSave')}
      </button>
    </div>
  );
}

function ConditionManager({
  campaignId,
  battleId,
  combatantId,
  conditions,
}: {
  campaignId: string;
  battleId: string;
  combatantId: string;
  conditions?: CombatantCondition[];
}) {
  const t = useT();
  const qc = useQueryClient();
  const [pick, setPick] = useState('');

  const catalogue = useQuery({
    queryKey: ['reference', 'conditions'],
    queryFn: () => referenceApi.getConditions(),
    select: (r) => r.data ?? [],
    staleTime: 60 * 60 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
  const applyCond = useMutation({
    mutationFn: (conditionId: string) =>
      battlesApi.applyCondition(campaignId, battleId, combatantId, { conditionId }),
    onSuccess: invalidate,
    onError: () => toast.error(t('tactical.cond.applyFailed')),
  });
  const removeCond = useMutation({
    mutationFn: (conditionId: string) =>
      battlesApi.removeCondition(campaignId, battleId, combatantId, conditionId),
    onSuccess: invalidate,
    onError: () => toast.error(t('tactical.cond.removeFailed')),
  });

  const current = conditions ?? [];
  const existing = new Set(current.map((c) => c.conditionId));
  const options = (catalogue.data ?? []).filter((o) => !existing.has(o.id));

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.cond.title')}</p>
      {current.length > 0 ? (
        <div className="ao-row ao-wrap ao-gap-4">
          {current.map((c) => (
            <button
              key={c.conditionId}
              type="button"
              className={s.condChip}
              title={t('tactical.cond.remove')}
              disabled={removeCond.isPending}
              onClick={() => removeCond.mutate(c.conditionId)}
            >
              {c.name}
              {c.remainingRounds != null ? ` (${c.remainingRounds})` : ''}
              <span className={s.condChipX}>✕</span>
            </button>
          ))}
        </div>
      ) : (
        <p className={cn('ao-italic', s.leftHint)}>{t('tactical.cond.none')}</p>
      )}
      <div className="ao-row ao-gap-8">
        <select
          className={cn('ao-input', s.amountField)}
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="">{t('tactical.cond.pick')}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ao-btn ao-btn--sm"
          disabled={!pick || applyCond.isPending}
          onClick={() => {
            applyCond.mutate(pick);
            setPick('');
          }}
        >
          {t('tactical.cond.add')}
        </button>
      </div>
    </div>
  );
}

function DeathSaveControls({
  campaignId,
  battleId,
  combatant,
}: {
  campaignId: string;
  battleId: string;
  combatant: BattleCombatantResponse;
}) {
  const t = useT();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
  const rollSave = useMutation({
    mutationFn: () => battlesApi.deathSave(campaignId, battleId, combatant.id),
    onSuccess: invalidate,
    onError: () => toast.error(t('tactical.death.rollFailed')),
  });
  const stabilizeSave = useMutation({
    mutationFn: () => battlesApi.stabilize(campaignId, battleId, combatant.id),
    onSuccess: invalidate,
    onError: () => toast.error(t('tactical.death.stabilizeFailed')),
  });

  const succ = combatant.deathSaveSuccesses ?? 0;
  const fail = combatant.deathSaveFailures ?? 0;
  const pips = (n: number) => '●'.repeat(n) + '○'.repeat(Math.max(0, 3 - n));

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.death.title')}</p>
      {combatant.dead ? (
        <p className={s.deadLabel}>{t('tactical.death.dead')}</p>
      ) : (
        <>
          <p className={s.deathPips}>
            {t('tactical.death.successes')}: {pips(succ)} · {t('tactical.death.failures')}: {pips(fail)}
          </p>
          <div className="ao-row ao-gap-8">
            <button
              type="button"
              className="ao-btn ao-btn--sm"
              disabled={rollSave.isPending}
              onClick={() => rollSave.mutate()}
            >
              {t('tactical.death.roll')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--sm ao-btn--ghost"
              disabled={stabilizeSave.isPending}
              onClick={() => stabilizeSave.mutate()}
            >
              {t('tactical.death.stabilize')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AttackConfirm({
  campaignId,
  battleId,
  targetCombatantId,
  targetName,
}: {
  campaignId: string;
  battleId: string;
  targetCombatantId: string | null;
  targetName: string;
}) {
  const t = useT();
  const attackName = useMapTransientStore((st) => st.attackName);
  const setAttackName = useMapTransientStore((st) => st.setAttackName);
  const attack = useBattleAttack();
  const [d20Str, setD20Str] = useState('');

  if (!attackName) return null;

  const d20 = parseInt(d20Str, 10);
  const d20Manual = Number.isFinite(d20) && d20 >= 1 && d20 <= 20;
  // No d20 entered ⇒ the server rolls it (A2 — the client never fabricates a die result).
  const canSubmit = !!targetCombatantId && !attack.isPending;

  const submit = () => {
    if (!canSubmit || !targetCombatantId) return;
    attack.mutate(
      { campaignId, battleId, data: { targetCombatantId, attackName, ...(d20Manual ? { d20 } : {}) } },
      {
        onSuccess: () => {
          setD20Str('');
          setAttackName(null);
        },
      },
    );
  };

  return (
    <div className={s.actionBlock}>
      <p className={cn('ao-overline', s.actionOverline)}>{t('tactical.inspect.attackOverline')}</p>
      <p className={s.attackLine}>
        <span className={s.attackName}>{attackName}</span>
        {' → '}
        {targetCombatantId ? targetName : t('tactical.inspect.noTarget')}
      </p>
      {targetCombatantId && (
        <>
          <input
            className={cn('ao-input', s.amountField)}
            inputMode="numeric"
            value={d20Str}
            placeholder={t('tactical.inspect.d20')}
            onChange={(e) => setD20Str(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          <button
            type="button"
            className={cn('ao-btn ao-btn--sm', s.attackConfirmBtn)}
            disabled={!canSubmit}
            onClick={submit}
          >
            {t('tactical.inspect.attackConfirm')}
          </button>
        </>
      )}
      <button
        type="button"
        className="ao-btn ao-btn--sm ao-btn--ghost"
        onClick={() => setAttackName(null)}
      >
        {t('tactical.place.cancel')}
      </button>
    </div>
  );
}
