import { AxiosError } from 'axios';
import mapHttp from './mapHttp';
import type {
  CreateMapSessionRequest,
  FogShapeDto,
  FogStateDto,
  MapSessionDto,
  MapSnapshotDto,
  UUID,
} from '../types';
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

  /* ── Fog of war (Phase 1.6) ──────────────────────────────────── */

  /** GET /api/map-sessions/{sessionId}/fog — current revealed geometry (any viewer). */
  getFog: async (sessionId: UUID): Promise<FogStateDto> => {
    const { data } = await mapHttp.get<FogStateDto>(`/map-sessions/${sessionId}/fog`);
    return data;
  },

  /** POST …/fog/reveal — reveal one shape (GM). Returns the full new fog state. */
  revealFog: async (sessionId: UUID, shape: FogShapeDto): Promise<FogStateDto> => {
    const { data } = await mapHttp.post<FogStateDto>(`/map-sessions/${sessionId}/fog/reveal`, { shape });
    return data;
  },

  /** POST …/fog/hide — re-fog an area (GM). Returns the full new fog state. */
  hideFog: async (sessionId: UUID, shape: FogShapeDto): Promise<FogStateDto> => {
    const { data } = await mapHttp.post<FogStateDto>(`/map-sessions/${sessionId}/fog/hide`, { shape });
    return data;
  },

  /** POST …/fog/reveal-all — reveal the whole map (GM). */
  revealAllFog: async (sessionId: UUID): Promise<FogStateDto> => {
    const { data } = await mapHttp.post<FogStateDto>(`/map-sessions/${sessionId}/fog/reveal-all`);
    return data;
  },

  /** POST …/fog/hide-all — fully fog the map (GM). */
  hideAllFog: async (sessionId: UUID): Promise<FogStateDto> => {
    const { data } = await mapHttp.post<FogStateDto>(`/map-sessions/${sessionId}/fog/hide-all`);
    return data;
  },

  /**
   * POST …/aoe-targets — which tokens does this AoE template cover (Phase 2.3)? Pure geometry;
   * origin is the template's center (sphere/cube) or apex (cone/line) in grid cells.
   */
  aoeTargets: async (
    sessionId: UUID,
    req: { shape: string; sizeFt: number; originX: number; originY: number; rotationDeg?: number },
  ): Promise<Array<{ tokenId: UUID; combatantId: UUID | null; name: string }>> => {
    const { data } = await mapHttp.post<Array<{ tokenId: UUID; combatantId: UUID | null; name: string }>>(
      `/map-sessions/${sessionId}/aoe-targets`,
      { rotationDeg: 0, ...req },
    );
    return data;
  },
};
