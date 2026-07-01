import mapHttp from './mapHttp';
import type {
  CreateTokenFromCombatantRequest,
  CreateTokenRequest,
  MapTokenDto,
  UUID,
} from '../types';

/**
 * Map-service token endpoints (`/api/map-sessions/{sessionId}/tokens`).
 *
 * Note: there is intentionally NO `update`/move here. The backend exposes only
 * create/list/delete for tokens over REST; token MOVEMENT goes exclusively through
 * the WebSocket `MOVE_TOKEN` command (server-authoritative, revision-checked).
 */
export const mapTokenApi = {
  /** POST /api/map-sessions/{sessionId}/tokens — place a token (GM). */
  create: async (sessionId: UUID, request: CreateTokenRequest): Promise<MapTokenDto> => {
    const { data } = await mapHttp.post<MapTokenDto>(`/map-sessions/${sessionId}/tokens`, request);
    return data;
  },

  /**
   * POST /api/map-sessions/{sessionId}/tokens/from-combatant — place a token linked
   * to a core-BE battle combatant (GM). The map-service resolves the combatant and
   * persists the `tokenCombatLink`; movement still rides the WebSocket afterwards.
   */
  createFromCombatant: async (
    sessionId: UUID,
    request: CreateTokenFromCombatantRequest,
  ): Promise<MapTokenDto> => {
    const { data } = await mapHttp.post<MapTokenDto>(
      `/map-sessions/${sessionId}/tokens/from-combatant`,
      request,
    );
    return data;
  },

  /** GET /api/map-sessions/{sessionId}/tokens — all tokens in a session. */
  list: async (sessionId: UUID): Promise<MapTokenDto[]> => {
    const { data } = await mapHttp.get<MapTokenDto[]>(`/map-sessions/${sessionId}/tokens`);
    return data;
  },

  /** DELETE /api/map-sessions/{sessionId}/tokens/{tokenId} — remove a token (GM). */
  delete: async (sessionId: UUID, tokenId: UUID): Promise<void> => {
    await mapHttp.delete(`/map-sessions/${sessionId}/tokens/${tokenId}`);
  },
};
