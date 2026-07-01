import { mapAssetApi } from './mapAssetApi';
import { mapDefinitionApi } from './mapDefinitionApi';
import { mapSessionApi } from './mapSessionApi';
import { mapTokenApi } from './mapTokenApi';

/**
 * Single entry point for all map-service REST calls, grouped by resource so call
 * sites read like `mapApi.sessions.getSnapshot(id)`.
 *
 * Token MOVEMENT is intentionally absent — the backend exposes only create/list/
 * delete for tokens over REST; moves go exclusively through the WebSocket
 * `MOVE_TOKEN` command (server-authoritative, revision-checked).
 */
export const mapApi = {
  assets: mapAssetApi,
  maps: mapDefinitionApi,
  sessions: mapSessionApi,
  tokens: mapTokenApi,
};

export type MapApi = typeof mapApi;
