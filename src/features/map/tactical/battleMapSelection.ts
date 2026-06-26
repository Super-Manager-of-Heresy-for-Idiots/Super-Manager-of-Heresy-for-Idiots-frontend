/**
 * Pure navigation/decision helpers for the battle → tactical-map selection flow.
 *
 * Kept free of React so the branching logic (what each choice in
 * {@link BattleMapSelectionModal} does) is unit-testable without a DOM. The modal
 * is a thin shell that renders these decisions and fires the map-service mutation.
 */

import type { CreateMapSessionRequest, UUID } from '../types';

/** Standalone tactical workspace route (deep-link), optionally carrying a session. */
export function tacticalRoute(campaignId: UUID, battleId: UUID, sessionId?: UUID | null): string {
  const base = `/campaigns/${campaignId}/battles/${battleId}/tactical`;
  return sessionId ? `${base}?session=${sessionId}` : base;
}

/**
 * The unified battle is embedded in the campaign "Бой" tab; the linked map session
 * rides on the `?session=` query param (no first-class Battle↔MapSession link yet).
 * This is the canonical destination after attaching a map.
 */
export function battleTabRoute(campaignId: UUID, sessionId?: UUID | null): string {
  const base = `/campaigns/${campaignId}/battle`;
  return sessionId ? `${base}?session=${sessionId}` : base;
}

/**
 * The existing map editor in "new map" mode. `blank` routes the GM toward the
 * grid-only builder (frontend prompt 06); until that lands the editor reads the
 * hint and the GM calibrates a gridless map manually.
 */
export function mapEditorNewRoute(campaignId: UUID, opts?: { blank?: boolean }): string {
  return `/campaigns/${campaignId}/maps/new${opts?.blank ? '?blank=1' : ''}`;
}

/** A prepared map is image-backed or a pure system grid; used to label list rows. */
export function mapSourceType(map: { imageAssetId: UUID | null }): 'IMAGE' | 'GRID' {
  return map.imageAssetId ? 'IMAGE' : 'GRID';
}

/** UI gate for creating/linking a battle map. The backend stays authoritative. */
export function canManageBattleMaps(role: string | null | undefined): boolean {
  return role === 'GAME_MASTER' || role === 'ADMIN';
}

/** The map-service session payload for a battle-linked tactical map. */
export function buildSessionRequest(
  campaignId: UUID,
  mapId: UUID,
  battleId: UUID,
): CreateMapSessionRequest {
  return { campaignId, mapId, externalBattleId: battleId };
}

export type MapSelectionChoice =
  | { type: 'select-map'; mapId: UUID }
  | { type: 'upload' }
  | { type: 'blank' }
  | { type: 'without-map' };

/**
 * What the modal should do for a given GM choice:
 *  - `create-session` → POST a battle-linked session, then open tactical with it;
 *  - `navigate`       → leave for the map editor / blank builder;
 *  - `dismiss`        → close and keep the classic battle flow (the `/battle` tab).
 */
export type MapSelectionAction =
  | { kind: 'create-session'; request: CreateMapSessionRequest }
  | { kind: 'navigate'; to: string }
  | { kind: 'dismiss' };

export interface MapSelectionContext {
  campaignId: UUID;
  battleId: UUID;
}

export function resolveMapSelectionAction(
  choice: MapSelectionChoice,
  ctx: MapSelectionContext,
): MapSelectionAction {
  switch (choice.type) {
    case 'select-map':
      return {
        kind: 'create-session',
        request: buildSessionRequest(ctx.campaignId, choice.mapId, ctx.battleId),
      };
    case 'upload':
      return { kind: 'navigate', to: mapEditorNewRoute(ctx.campaignId) };
    case 'blank':
      return { kind: 'navigate', to: mapEditorNewRoute(ctx.campaignId, { blank: true }) };
    case 'without-map':
      return { kind: 'dismiss' };
  }
}
