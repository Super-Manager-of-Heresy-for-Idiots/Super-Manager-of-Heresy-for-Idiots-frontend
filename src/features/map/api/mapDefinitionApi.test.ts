import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateMapRequest, MapDefinitionDto, UpdateGridConfigRequest } from '../types';
import mapHttp from './mapHttp';
import { mapDefinitionApi } from './mapDefinitionApi';

vi.mock('./mapHttp', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const gridConfig = {
  type: 'SQUARE',
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
  visual: {
    gridLineColor: '#00ffff',
    gridLineOpacity: 0.35,
    gridLineWidthPx: 2.5,
  },
  calibration: {
    mode: 'SIMPLE',
    origin: { imageX: 0, imageY: 0 },
    cellWidthPx: 64,
    cellHeightPx: 64,
    rotationDeg: 0,
  },
} satisfies CreateMapRequest['gridConfig'];

function definition(): MapDefinitionDto {
  return {
    id: 'map-1',
    campaignId: 'campaign-1',
    name: 'Map',
    sourceType: 'IMAGE',
    imageAssetId: 'asset-1',
    gridType: 'SQUARE',
    gridConfig,
    canvasConfig: null,
    createdBy: 'user-1',
    createdAt: '2026-06-24T00:00:00Z',
    updatedAt: '2026-06-24T00:00:00Z',
  };
}

describe('mapDefinitionApi grid visual persistence', () => {
  beforeEach(() => {
    vi.mocked(mapHttp.post).mockReset();
    vi.mocked(mapHttp.put).mockReset();
  });

  it('sends gridConfig.visual when creating a map', async () => {
    vi.mocked(mapHttp.post).mockResolvedValue({ data: definition() });

    const request: CreateMapRequest = {
      campaignId: 'campaign-1',
      name: 'Map',
      imageAssetId: 'asset-1',
      gridType: 'SQUARE',
      gridConfig,
    };
    await mapDefinitionApi.create(request);

    expect(mapHttp.post).toHaveBeenCalledWith('/maps', {
      ...request,
      gridConfig: expect.objectContaining({
        visual: {
          gridLineColor: '#00FFFF',
          gridLineOpacity: 0.35,
          gridLineWidthPx: 2.5,
        },
      }),
    });
  });

  it('sends gridConfig.visual when updating a map grid', async () => {
    vi.mocked(mapHttp.put).mockResolvedValue({ data: definition() });

    const request: UpdateGridConfigRequest = {
      gridType: 'SQUARE',
      gridConfig,
    };
    await mapDefinitionApi.updateGridConfig('map-1', request);

    expect(mapHttp.put).toHaveBeenCalledWith('/maps/map-1/grid-config', {
      ...request,
      gridConfig: expect.objectContaining({
        visual: {
          gridLineColor: '#00FFFF',
          gridLineOpacity: 0.35,
          gridLineWidthPx: 2.5,
        },
      }),
    });
  });
});
