import { describe, expect, it } from 'vitest';
import {
  isGridOnlyMap,
  mapSourceType,
  type CanvasConfig,
  type MapDefinitionDto,
  type MapSnapshotDto,
} from './mapApiTypes';

/* ── Map definition contract (MAP-20) ───────────────────────── */

describe('MapDefinitionDto contract', () => {
  it('supports an image-backed map (sourceType IMAGE, canvasConfig null)', () => {
    const def: MapDefinitionDto = {
      id: 'map-1',
      campaignId: 'camp-1',
      name: 'Goblin Cave',
      sourceType: 'IMAGE',
      imageAssetId: 'asset-1',
      gridType: 'SQUARE',
      gridConfig: {
        type: 'SQUARE',
        cellWorldSize: 5,
        cellWorldUnit: 'ft',
        calibration: { mode: 'SIMPLE', origin: { imageX: 0, imageY: 0 }, cellWidthPx: 70, cellHeightPx: 70, rotationDeg: 0 },
      },
      canvasConfig: null,
      createdBy: 'user-1',
      createdAt: '2026-06-23T20:00:00Z',
      updatedAt: '2026-06-23T20:00:00Z',
    };
    expect(def.sourceType).toBe('IMAGE');
    expect(def.canvasConfig).toBeNull();
  });

  it('supports a grid-only map (sourceType GRID_ONLY, populated canvasConfig)', () => {
    const canvasConfig: CanvasConfig = {
      mode: 'GRID_ONLY',
      columns: 20,
      rows: 15,
      cellSizePx: 70,
      backgroundColor: '#222222',
    };
    const def: MapDefinitionDto = {
      id: 'map-2',
      campaignId: 'camp-1',
      name: 'Blank Battlemap',
      sourceType: 'GRID_ONLY',
      imageAssetId: null,
      gridType: 'SQUARE',
      gridConfig: {
        type: 'SQUARE',
        cellWorldSize: 5,
        cellWorldUnit: 'ft',
        calibration: { mode: 'BOUNDS', topLeft: { imageX: 0, imageY: 0 }, bottomRight: { imageX: 1400, imageY: 1050 }, columns: 20, rows: 15 },
      },
      canvasConfig,
      createdBy: 'user-1',
      createdAt: '2026-06-23T20:00:00Z',
      updatedAt: '2026-06-23T20:00:00Z',
    };
    expect(def.sourceType).toBe('GRID_ONLY');
    expect(def.canvasConfig).toEqual(canvasConfig);
  });
});

/* ── UI reads map.sourceType directly (MAP-20) ──────────────── */

describe('mapSourceType / isGridOnlyMap', () => {
  it('reads the backend sourceType directly and NEVER infers it from canvasConfig', () => {
    // canvasConfig says GRID_ONLY, but sourceType is authoritative → IMAGE.
    const map = {
      sourceType: 'IMAGE' as const,
      canvasConfig: { mode: 'GRID_ONLY', columns: 1, rows: 1, cellSizePx: 70, backgroundColor: '#000000' },
    };
    expect(mapSourceType(map)).toBe('IMAGE');
    expect(isGridOnlyMap(map)).toBe(false);
  });

  it('reports grid-only when sourceType is GRID_ONLY', () => {
    expect(mapSourceType({ sourceType: 'GRID_ONLY' })).toBe('GRID_ONLY');
    expect(isGridOnlyMap({ sourceType: 'GRID_ONLY' })).toBe(true);
  });

  it('defaults a null/absent map to IMAGE', () => {
    expect(mapSourceType(null)).toBe('IMAGE');
    expect(mapSourceType(undefined)).toBe('IMAGE');
    expect(mapSourceType({})).toBe('IMAGE');
  });
});

/* ── Snapshot contract (MAP-20) ─────────────────────────────── */

describe('MapSnapshotDto contract', () => {
  it('supports battleLink / tokenCombatLinks / tileStates / mapElements / combatants / turnState', () => {
    const snapshot: MapSnapshotDto = {
      session: {
        id: 'sess-1',
        campaignId: 'camp-1',
        mapId: 'map-1',
        externalBattleId: 'battle-1',
        status: 'ACTIVE',
        currentRevision: 1,
      },
      map: {
        id: 'map-1',
        name: 'Goblin Cave',
        sourceType: 'IMAGE',
        imageAssetId: 'asset-1',
        imageUrl: '/api/map-assets/asset-1/content',
        gridType: 'SQUARE',
        gridConfig: {
          type: 'SQUARE',
          cellWorldSize: 5,
          cellWorldUnit: 'ft',
          calibration: { mode: 'SIMPLE', origin: { imageX: 0, imageY: 0 }, cellWidthPx: 70, cellHeightPx: 70, rotationDeg: 0 },
        },
        canvasConfig: null,
      },
      tokens: [],
      tokenCombatLinks: [
        {
          tokenId: 'tok-1',
          externalBattleId: 'battle-1',
          externalCombatantId: 'comb-1',
          combatantType: 'CHARACTER',
          externalCharacterId: 'char-1',
          externalMonsterId: null,
          displayName: 'Targim',
        },
      ],
      combatants: [
        {
          id: 'comb-1',
          mapSessionId: 'sess-1',
          tokenId: 'tok-1',
          combatantType: 'CHARACTER',
          externalCharacterId: 'char-1',
          externalMonsterId: null,
          displayName: 'Targim',
          initiative: 17,
          turnOrder: 1,
          active: true,
          createdAt: '2026-06-23T20:00:00Z',
          updatedAt: '2026-06-23T20:00:00Z',
        },
      ],
      battleLink: { externalBattleId: 'battle-1', combatAuthority: 'CORE' },
      turnState: { roundNumber: 1, currentTurnCombatantId: 'comb-1' },
      tileStates: [
        {
          id: 'tile-1',
          mapSessionId: 'sess-1',
          gridX: 12,
          gridY: 8,
          terrainLevel: 1,
          terrainName: 'HIGH_GROUND',
          createdAt: '2026-06-23T20:00:00Z',
          updatedAt: '2026-06-23T20:00:00Z',
        },
      ],
      mapElements: [
        {
          id: 'el-1',
          mapId: 'map-1',
          elementType: 'WALL',
          gridX: 0,
          gridY: 0,
          widthCells: 10,
          heightCells: 1,
          points: null,
          style: {},
          properties: {},
          zIndex: 0,
          createdBy: 'user-1',
          createdAt: '2026-06-23T20:00:00Z',
          updatedAt: '2026-06-23T20:00:00Z',
        },
      ],
      fog: null,
      permissions: { canManageMap: true, canMoveAnyToken: true, movableTokenIds: ['tok-1'] },
    };

    expect(snapshot.session.externalBattleId).toBe('battle-1');
    expect(snapshot.battleLink?.combatAuthority).toBe('CORE');
    expect(snapshot.tokenCombatLinks?.[0].externalCombatantId).toBe('comb-1');
    expect(snapshot.tileStates?.[0].terrainName).toBe('HIGH_GROUND');
    expect(snapshot.mapElements?.[0].elementType).toBe('WALL');
    expect(snapshot.combatants?.[0].turnOrder).toBe(1);
    expect(snapshot.turnState?.currentTurnCombatantId).toBe('comb-1');
  });
});
