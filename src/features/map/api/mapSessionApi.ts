import { AxiosError } from 'axios';
import mapHttp from './mapHttp';
import type { CreateMapSessionRequest, MapSessionDto, MapSnapshotDto, UUID } from '../types';
import { normalizeGridConfig } from '../calibration/calibrationMath';

function normalizeSnapshot(snapshot: MapSnapshotDto): MapSnapshotDto {
  return {
    ...snapshot,
    map: {
      ...snapshot.map,
      gridConfig: normalizeGridConfig(snapshot.map.gridConfig),
    },
  };
}

/** Map-service session endpoints (`/api/map-sessions`). */
export const mapSessionApi = {
  /** POST /api/map-sessions — start a live session for a map (GM). */
  create: async (request: CreateMapSessionRequest): Promise<MapSessionDto> => {
    const { data } = await mapHttp.post<MapSessionDto>('/map-sessions', request);
    return data;
  },

  /**
   * GET /api/map-sessions/by-battle/{battleId} — the live session linked to a battle.
   * Lets the battle tab reopen the same map (persisted state) without a session id in
   * the URL. Returns `null` when the battle has no live map (404) — a normal state,
   * not an error.
   */
  findByBattle: async (battleId: UUID): Promise<MapSessionDto | null> => {
    try {
      const { data } = await mapHttp.get<MapSessionDto>(`/map-sessions/by-battle/${battleId}`);
      return data;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) return null;
      throw err;
    }
  },

  /** POST /api/map-sessions/{sessionId}/close — close a session (GM). */
  close: async (sessionId: UUID): Promise<MapSessionDto> => {
    const { data } = await mapHttp.post<MapSessionDto>(`/map-sessions/${sessionId}/close`);
    return data;
  },

  /**
   * GET /api/map-sessions/{sessionId}/snapshot — full committed state
   * (session, map, tokens, fog, effective permissions). Loaded before opening
   * realtime interactions; seeds the committed store.
   */
  getSnapshot: async (sessionId: UUID): Promise<MapSnapshotDto> => {
    const { data } = await mapHttp.get<MapSnapshotDto>(`/map-sessions/${sessionId}/snapshot`);
    return normalizeSnapshot(data);
  },
};
