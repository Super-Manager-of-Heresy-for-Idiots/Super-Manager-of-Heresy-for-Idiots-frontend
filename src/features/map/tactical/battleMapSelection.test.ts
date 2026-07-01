import { describe, expect, it } from 'vitest';
import {
  buildSessionRequest,
  canManageBattleMaps,
  mapEditorNewRoute,
  mapSourceType,
  resolveMapSelectionAction,
  tacticalRoute,
} from './battleMapSelection';

const ctx = { campaignId: 'camp-1', battleId: 'btl-1' };

describe('tacticalRoute', () => {
  it('carries the linked session as a query param', () => {
    expect(tacticalRoute('camp-1', 'btl-1', 'sess-9')).toBe(
      '/campaigns/camp-1/battles/btl-1/tactical?session=sess-9',
    );
  });
  it('omits the query param without a session', () => {
    expect(tacticalRoute('camp-1', 'btl-1')).toBe('/campaigns/camp-1/battles/btl-1/tactical');
    expect(tacticalRoute('camp-1', 'btl-1', null)).toBe('/campaigns/camp-1/battles/btl-1/tactical');
  });
});

describe('mapEditorNewRoute', () => {
  it('routes to the plain editor for uploads', () => {
    expect(mapEditorNewRoute('camp-1')).toBe('/campaigns/camp-1/maps/new');
  });
  it('hints the blank grid builder', () => {
    expect(mapEditorNewRoute('camp-1', { blank: true })).toBe('/campaigns/camp-1/maps/new?blank=1');
  });
});

describe('mapSourceType', () => {
  it('classifies image-backed vs grid-only maps', () => {
    expect(mapSourceType({ imageAssetId: 'asset-1' })).toBe('IMAGE');
    expect(mapSourceType({ imageAssetId: null })).toBe('GRID');
  });
});

describe('canManageBattleMaps', () => {
  it('allows GM and ADMIN only', () => {
    expect(canManageBattleMaps('GAME_MASTER')).toBe(true);
    expect(canManageBattleMaps('ADMIN')).toBe(true);
    expect(canManageBattleMaps('PLAYER')).toBe(false);
    expect(canManageBattleMaps(null)).toBe(false);
    expect(canManageBattleMaps(undefined)).toBe(false);
  });
});

describe('buildSessionRequest', () => {
  it('links the session to the battle via externalBattleId', () => {
    expect(buildSessionRequest('camp-1', 'map-7', 'btl-1')).toEqual({
      campaignId: 'camp-1',
      mapId: 'map-7',
      externalBattleId: 'btl-1',
    });
  });
});

describe('resolveMapSelectionAction', () => {
  it('selecting a map creates a battle-linked session', () => {
    const action = resolveMapSelectionAction({ type: 'select-map', mapId: 'map-7' }, ctx);
    expect(action).toEqual({
      kind: 'create-session',
      request: { campaignId: 'camp-1', mapId: 'map-7', externalBattleId: 'btl-1' },
    });
  });

  it('upload routes to the map editor', () => {
    expect(resolveMapSelectionAction({ type: 'upload' }, ctx)).toEqual({
      kind: 'navigate',
      to: '/campaigns/camp-1/maps/new',
    });
  });

  it('blank routes to the grid builder', () => {
    expect(resolveMapSelectionAction({ type: 'blank' }, ctx)).toEqual({
      kind: 'navigate',
      to: '/campaigns/camp-1/maps/new?blank=1',
    });
  });

  it('continue-without-map dismisses and keeps the classic battle flow', () => {
    expect(resolveMapSelectionAction({ type: 'without-map' }, ctx)).toEqual({ kind: 'dismiss' });
  });
});
