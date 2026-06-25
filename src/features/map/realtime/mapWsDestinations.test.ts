import { describe, expect, it } from 'vitest';
import { mapWsDestinations } from './mapWsDestinations';

const SESSION = '11111111-2222-3333-4444-555555555555';

describe('mapWsDestinations', () => {
  it('builds the client → server (/app) command destinations', () => {
    expect(mapWsDestinations.appJoin(SESSION)).toBe(`/app/map-sessions/${SESSION}/join`);
    expect(mapWsDestinations.appLeave(SESSION)).toBe(`/app/map-sessions/${SESSION}/leave`);
    expect(mapWsDestinations.appMoveToken(SESSION)).toBe(
      `/app/map-sessions/${SESSION}/move-token`,
    );
    expect(mapWsDestinations.appDragPreview(SESSION)).toBe(
      `/app/map-sessions/${SESSION}/drag-preview`,
    );
    expect(mapWsDestinations.appCursor(SESSION)).toBe(`/app/map-sessions/${SESSION}/cursor`);
    expect(mapWsDestinations.appPing(SESSION)).toBe(`/app/map-sessions/${SESSION}/ping`);
  });

  it('builds the server → client (/topic) subscription destinations', () => {
    expect(mapWsDestinations.topicEvents(SESSION)).toBe(`/topic/map-sessions/${SESSION}/events`);
    expect(mapWsDestinations.topicPresence(SESSION)).toBe(
      `/topic/map-sessions/${SESSION}/presence`,
    );
  });

  it('exposes the per-user error queue as a constant', () => {
    expect(mapWsDestinations.userErrors).toBe('/user/queue/map-errors');
  });
});
