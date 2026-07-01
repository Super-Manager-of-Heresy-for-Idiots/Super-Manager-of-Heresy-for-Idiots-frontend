import mapHttp from './mapHttp';
import type { CreateMapRequest, MapDefinitionDto, UpdateGridConfigRequest, UUID } from '../types';
import { normalizeGridConfig } from '../calibration/calibrationMath';

function normalizeDefinition(definition: MapDefinitionDto): MapDefinitionDto {
  return {
    ...definition,
    gridConfig: normalizeGridConfig(definition.gridConfig),
  };
}

/** Map-service map-definition endpoints (`/api/maps`, `/api/campaigns/{id}/maps`). */
export const mapDefinitionApi = {
  /** GET /api/campaigns/{campaignId}/maps — all maps in a campaign. */
  list: async (campaignId: UUID): Promise<MapDefinitionDto[]> => {
    const { data } = await mapHttp.get<MapDefinitionDto[]>(`/campaigns/${campaignId}/maps`);
    return data.map(normalizeDefinition);
  },

  /** GET /api/maps/{mapId} — a single map definition. */
  get: async (mapId: UUID): Promise<MapDefinitionDto> => {
    const { data } = await mapHttp.get<MapDefinitionDto>(`/maps/${mapId}`);
    return normalizeDefinition(data);
  },

  /** POST /api/maps — create a map definition (GM). */
  create: async (request: CreateMapRequest): Promise<MapDefinitionDto> => {
    // Grid-only maps omit `gridConfig` (they carry `canvasConfig` instead); only
    // normalize when an image-backed `gridConfig` is actually present.
    const body = request.gridConfig
      ? { ...request, gridConfig: normalizeGridConfig(request.gridConfig) }
      : request;
    const { data } = await mapHttp.post<MapDefinitionDto>('/maps', body);
    return normalizeDefinition(data);
  },

  /** PUT /api/maps/{mapId}/grid-config — persist grid calibration (GM). */
  updateGridConfig: async (mapId: UUID, request: UpdateGridConfigRequest): Promise<MapDefinitionDto> => {
    const { data } = await mapHttp.put<MapDefinitionDto>(`/maps/${mapId}/grid-config`, {
      ...request,
      gridConfig: normalizeGridConfig(request.gridConfig),
    });
    return normalizeDefinition(data);
  },
};
