/**
 * Tactical battle workspace — composes core-BE battle state (React Query) and the
 * map-service session (committed store) into one screen:
 *
 *   ┌ Top bar: battle name | round | current turn | map tools ┐
 *   ├ Left battle panel │ Tactical map │ Right inspector       ┤
 *
 * Route: /campaigns/:campaignId/battles/:battleId/tactical?session=:mapSessionId
 *
 * The `session` query param carries the linked map session id. A first-class
 * Battle↔MapSession link (core Battle.id → MapSession.externalBattleId) is owned by
 * the backend (map-service prompt 01); until it exists we resolve the session from
 * the URL and the battle-map selection flow (prompt 02) writes it there. With no
 * `session`, the workspace still renders the battle panel and offers to attach a map,
 * so a battle remains usable without one.
 *
 * Battle state is never written into the map store; map tokens are never written into
 * the battle query. The {@link deriveTacticalTokens} view recombines them per render.
 */

import { lazy, Suspense, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useBattle, useBattleCurrentTurn } from '@/hooks/useBattles';
import { useMapSessionStore } from '../state';
import { currentTurnCombatant, deriveTacticalTokens } from './tacticalView';
import { TacticalBattleLeftPanel } from './TacticalBattleLeftPanel';
import { TacticalInspectorPanel } from './TacticalInspectorPanel';
import s from './TacticalBattlePage.module.css';

// The center owns a realtime session lifecycle; load it lazily so a map-less
// battle never spins up the map runtime.
const TacticalMapCenterPanel = lazy(() =>
  import('./TacticalMapCenterPanel').then((m) => ({ default: m.TacticalMapCenterPanel })),
);

export default function TacticalBattlePage() {
  const t = useT();
  const { campaignId = '', battleId = '' } = useParams<{ campaignId: string; battleId: string }>();
  const [searchParams] = useSearchParams();
  const mapSessionId = searchParams.get('session');

  const user = useAuthStore((st) => st.user);
  const currentUserId = user?.id ?? null;
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const { data: battle, isLoading: battleLoading, error: battleError } = useBattle(campaignId, battleId);
  // Current-turn detail (resources/abilities) — fetched for active battles; consumed
  // by the action panel in prompt 04. Kept here so the workspace owns the battle queries.
  useBattleCurrentTurn(campaignId, battleId, battle?.status === 'ACTIVE');

  // Map tokens come from the committed store, populated by the center panel's realtime.
  const tokensById = useMapSessionStore((st) => st.tokensById);
  const tokenIds = useMapSessionStore((st) => st.tokenIds);
  const tokenCombatLinks = useMapSessionStore((st) => st.tokenCombatLinks);
  const rawTokens = useMemo(
    () => tokenIds.map((id) => tokensById[id]).filter(Boolean),
    [tokenIds, tokensById],
  );

  const tacticalTokens = useMemo(
    () =>
      deriveTacticalTokens({
        tokens: rawTokens,
        combatants: battle?.combatants ?? [],
        tokenCombatLinks,
        currentUserId,
      }),
    [rawTokens, battle, tokenCombatLinks, currentUserId],
  );

  const activeCombatant = battle ? currentTurnCombatant(battle.combatants) : null;
  const activeName = activeCombatant?.displayName;

  return (
    <div className={s.workspace}>
      <header className={s.topbar}>
        <div className={cn('ao-row ao-gap-12', s.topbarMain)}>
          <p className={cn('ao-overline', s.topOverline)}>{t('tactical.top.overline')}</p>
          <h3 className={cn('ao-h3', s.topTitle)}>
            {battle?.name ?? (battleLoading ? t('tactical.top.loading') : t('tactical.top.untitled'))}
          </h3>
        </div>
        <div className={cn('ao-row ao-gap-16', s.topbarMeta)}>
          {battle && (
            <>
              <span className={s.topStat}>
                <span className="ao-overline">{t('tactical.top.round')}</span>
                <span className={s.topStatValue}>{battle.roundNumber}</span>
              </span>
              <span className={s.topStat}>
                <span className="ao-overline">{t('tactical.top.turn')}</span>
                <span className={s.topStatValue}>{activeName ?? '—'}</span>
              </span>
            </>
          )}
        </div>
      </header>

      <div className={s.grid}>
        <aside className={cn('ao-panel', s.col, s.colLeft)}>
          {battleError ? (
            <div className={s.panelEmpty}>
              <p className="ao-italic">{t('tactical.left.loadError')}</p>
            </div>
          ) : (
            <TacticalBattleLeftPanel
              battle={battle}
              tacticalTokens={tacticalTokens}
              isGm={isGm}
              currentUserId={currentUserId}
              placementEnabled={isGm && !!mapSessionId}
            />
          )}
        </aside>

        <main className={cn('ao-panel ao-panel--inset', s.col, s.colCenter)}>
          {mapSessionId ? (
            <Suspense
              fallback={
                <div className={cn('ao-panel ao-breathe', s.centerStatus)}>
                  <span className={s.statusText}>{t('map.session.loading')}</span>
                </div>
              }
            >
              <TacticalMapCenterPanel sessionId={mapSessionId} battleId={battleId} />
            </Suspense>
          ) : (
            <div className={s.centerStatus}>
              <p className="ao-overline">{t('tactical.center.noMapOverline')}</p>
              <p className="ao-italic">{t('tactical.center.noMapBody')}</p>
              {isGm && (
                <Link className="ao-btn ao-btn--sm" to={`/campaigns/${campaignId}/maps`}>
                  {t('tactical.center.openMaps')}
                </Link>
              )}
            </div>
          )}
        </main>

        <aside className={cn('ao-panel', s.col, s.colRight)}>
          <TacticalInspectorPanel
            campaignId={campaignId}
            battleId={battleId}
            isGm={isGm}
            tacticalTokens={tacticalTokens}
            activeCombatant={activeCombatant}
          />
        </aside>
      </div>
    </div>
  );
}
