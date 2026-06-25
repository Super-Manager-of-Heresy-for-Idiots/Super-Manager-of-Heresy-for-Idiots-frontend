/**
 * Right column of the tactical workspace: the selection inspector + combat actions
 * (frontend prompt 04). Selection lives in the transient map store (shared with the
 * viewport); combat resolution goes through the CORE battle API (attack / HP delta),
 * never the map-service. The map token state is never mutated by an attack — only the
 * battle query is refreshed, and the derived view recomputes HP from it.
 */

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse } from '@/types';
import { useBattleAttack, useApplyCombatantHp } from '@/hooks/useBattles';
import { useMapSessionStore, useMapTransientStore } from '../state';
import {
  buildAttackRequest,
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
  const d20Valid = Number.isFinite(d20) && d20 >= 1 && d20 <= 20;
  const canSubmit = !!targetCombatantId && d20Valid && !attack.isPending;

  const roll = () => {
    const n = Math.floor(Math.random() * 20) + 1;
    setD20Str(String(n));
    toast.success(t('battle.toast.dieRolled', { n }));
  };

  const submit = () => {
    if (!canSubmit || !targetCombatantId) return;
    attack.mutate(
      { campaignId, battleId, data: buildAttackRequest(targetCombatantId, attackName, d20) },
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
          <div className="ao-row ao-gap-8">
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
            <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={roll}>
              {t('tactical.inspect.rollDie')}
            </button>
          </div>
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
