/**
 * Unified бой+карта workspace — the single battle interface for all phases,
 * embedded in the campaign "Бой" tab (and reused by the standalone tactical
 * route). Composition:
 *
 *   ┌ Command bar: name · phase · round/turn · actions ┐
 *   ├ Roster rail │ Tactical map │ Right tool dock      ┤
 *
 * Battle state (React Query) and map-session state (committed store) are kept
 * separate; {@link deriveTacticalTokens} recombines them per render. A battle
 * stays fully usable without a linked map — the center then offers to attach one.
 */

import { lazy, Suspense, useMemo } from 'react';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import { useBattleCurrentTurn } from '@/hooks/useBattles';
import { BattleTacticalMapButton } from '../BattleTacticalMapButton';
import { useMapSessionStore } from '../../state';
import { currentTurnCombatant, deriveTacticalTokens } from '../tacticalView';
import {
  combatantFlySpeedFt,
  combatantSwimSpeedFt,
  combatantClimbSpeedFt,
  combatantSpeedFt,
  rangeCellsFromSpeed,
  type MovementConfig,
} from './movement';
import { CommandBar } from './CommandBar';
import { RosterRail } from './RosterRail';
import { RightDock } from './RightDock';
import s from './workspace.module.css';

const TacticalMapCenterPanel = lazy(() =>
  import('../TacticalMapCenterPanel').then((m) => ({ default: m.TacticalMapCenterPanel })),
);

interface TacticalWorkspaceProps {
  campaignId: string;
  battle: BattleResponse;
  mapSessionId: string | null;
  isGm: boolean;
  currentUserId: string | null;
}

export function TacticalWorkspace({
  campaignId,
  battle,
  mapSessionId,
  isGm,
  currentUserId,
}: TacticalWorkspaceProps) {
  const t = useT();

  const tokensById = useMapSessionStore((st) => st.tokensById);
  const tokenIds = useMapSessionStore((st) => st.tokenIds);
  const tokenCombatLinks = useMapSessionStore((st) => st.tokenCombatLinks);
  const mapDef = useMapSessionStore((st) => st.map);
  const rawTokens = useMemo(
    () => tokenIds.map((id) => tokensById[id]).filter(Boolean),
    [tokenIds, tokensById],
  );

  const tacticalTokens = useMemo(
    () =>
      deriveTacticalTokens({
        tokens: rawTokens,
        combatants: battle.combatants,
        tokenCombatLinks,
        currentUserId,
      }),
    [rawTokens, battle.combatants, tokenCombatLinks, currentUserId],
  );

  // Flying combatants' token ids (Phase 2.13) — drive the board float animation + wing badge.
  const flyingTokenIds = useMemo(
    () => new Set(tacticalTokens.filter((tk) => tk.combatant?.flying).map((tk) => tk.tokenId)),
    [tacticalTokens],
  );

  const activeCombatant = currentTurnCombatant(battle.combatants);

  // Movement: the acting combatant's token may move on its turn, within range
  // (speed ÷ cell). Speed comes from the core current-turn detail (character.speed
  // or the monster's walk speed — GM-only for monsters); resolved here and handed
  // to the map center, which enforces reachable cells / bounds / occupancy + preview.
  const isActive = battle.status === 'ACTIVE';
  const { data: turn } = useBattleCurrentTurn(campaignId, battle.id, isActive);

  const movement = useMemo<MovementConfig | null>(() => {
    if (!isActive || !mapSessionId || !activeCombatant) return null;
    const controls =
      isGm ||
      (activeCombatant.type === 'CHARACTER' && activeCombatant.ownerUserId === currentUserId);
    if (!controls) return null;
    const activeView = tacticalTokens.find((tk) => tk.linkedCombatantId === activeCombatant.id);
    if (!activeView) return null;
    const cell = mapDef?.gridConfig.cellWorldSize ?? 5;
    const walkFt = combatantSpeedFt(turn);
    const flyFt = combatantFlySpeedFt(turn);
    const swimFt = combatantSwimSpeedFt(turn);
    const climbFt = combatantClimbSpeedFt(turn);
    const walkRangeCells = walkFt != null ? rangeCellsFromSpeed(walkFt, cell) : 0;
    const flyRangeCells = flyFt != null ? rangeCellsFromSpeed(flyFt, cell) : 0;
    const swimRangeCells = swimFt != null ? rangeCellsFromSpeed(swimFt, cell) : 0;
    const climbRangeCells = climbFt != null ? rangeCellsFromSpeed(climbFt, cell) : 0;
    if (walkRangeCells <= 0 && flyRangeCells <= 0 && swimRangeCells <= 0 && climbRangeCells <= 0) return null;
    return {
      activeTokenId: activeView.tokenId,
      walkRangeCells,
      flyRangeCells,
      swimRangeCells,
      climbRangeCells,
      kind: activeCombatant.type === 'MONSTER' ? 'MONSTER' : 'CHARACTER',
      turnKey: `${activeCombatant.id}:${battle.roundNumber}`,
    };
  }, [
    isActive,
    mapSessionId,
    activeCombatant,
    isGm,
    currentUserId,
    tacticalTokens,
    turn,
    mapDef?.gridConfig.cellWorldSize,
    battle.roundNumber,
  ]);

  return (
    <div className={s.workspace}>
      <CommandBar campaignId={campaignId} battle={battle} isGm={isGm} currentUserId={currentUserId} />

      <div className={s.grid}>
        <aside className={cn('ao-panel', s.col, s.colLeft)}>
          <RosterRail
            battle={battle}
            tacticalTokens={tacticalTokens}
            currentUserId={currentUserId}
            placementEnabled={isGm && !!mapSessionId}
            isGm={isGm}
            campaignId={campaignId}
          />
        </aside>

        <main className={cn('ao-panel ao-panel--inset', s.col, s.colCenter)}>
          {mapSessionId ? (
            <Suspense
              fallback={
                <div className={cn('ao-breathe', s.centerStatus)}>
                  <span className={s.statusText}>{t('map.session.loading')}</span>
                </div>
              }
            >
              <TacticalMapCenterPanel
                sessionId={mapSessionId}
                battleId={battle.id}
                battleActive={isActive}
                isGm={isGm}
                movement={movement}
                flyingTokenIds={flyingTokenIds}
              />
            </Suspense>
          ) : (
            <div className={s.centerStatus}>
              <p className={cn('ao-overline', s.goldOverline)}>{t('tactical.center.noMapOverline')}</p>
              <p className={cn('ao-italic', s.muted)}>{t('tactical.center.noMapBody')}</p>
              {isGm && (
                <BattleTacticalMapButton
                  campaignId={campaignId}
                  battleId={battle.id}
                  battleName={battle.name}
                />
              )}
            </div>
          )}
        </main>

        <aside className={cn('ao-panel', s.col, s.colRight)}>
          <RightDock
            campaignId={campaignId}
            battle={battle}
            isGm={isGm}
            currentUserId={currentUserId}
            tacticalTokens={tacticalTokens}
            activeCombatant={activeCombatant}
            movement={movement}
            mapSessionId={mapSessionId}
          />
        </aside>
      </div>
    </div>
  );
}
