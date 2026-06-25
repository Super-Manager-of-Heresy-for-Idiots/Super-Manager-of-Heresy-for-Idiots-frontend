import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LegacySimpleGridConfig, MapSnapshotDto } from '../types';
import mapHttp from './mapHttp';
import { mapSessionApi } from './mapSessionApi';

vi.mock('./mapHttp', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const legacyGrid: LegacySimpleGridConfig = {
  type: 'SQUARE',
  originX: 12,
  originY: 18,
  cellWidthPx: 70,
  cellHeightPx: 72,
  rotationDeg: 0,
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
};

function snapshot(): MapSnapshotDto {
  return {
    session: { id: 'session-1', campaignId: 'camp-1', mapId: 'map-1', status: 'ACTIVE', currentRevision: 5 },
    map: {
      id: 'map-1',
      name: 'Dungeon',
      imageAssetId: 'asset-1',
      imageUrl: '/api/map-assets/asset-1/content',
      gridType: 'SQUARE',
      gridConfig: legacyGrid as never,
    },
    tokens: [],
    fog: null,
    permissions: { canManageMap: true, canMoveAnyToken: true, movableTokenIds: [] },
  };
}

describe('mapSessionApi', () => {
  beforeEach(() => {
    vi.mocked(mapHttp.get).mockReset();
  });

  it('normalizes runtime snapshot gridConfig before returning it', async () => {
    vi.mocked(mapHttp.get).mockResolvedValue({ data: snapshot() });

    const result = await mapSessionApi.getSnapshot('session-1');

    expect(result.map.gridConfig).toMatchObject({
      type: 'SQUARE',
      visual: { gridLineColor: '#FFFFFF', gridLineOpacity: 0.65, gridLineWidthPx: 1 },
      calibration: {
        mode: 'SIMPLE',
        origin: { imageX: 12, imageY: 18 },
        cellWidthPx: 70,
        cellHeightPx: 72,
      },
    });
  });
});
