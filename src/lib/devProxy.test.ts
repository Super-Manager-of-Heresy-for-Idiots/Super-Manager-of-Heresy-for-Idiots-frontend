import { describe, expect, it } from 'vitest';
import { CORE_BACKEND_DEV_TARGET, MAP_SERVICE_DEV_TARGET, devProxy } from './devProxy';

/** Dev proxy contract (audit MAP-07): map routes go same-origin to the map-service. */
const MAP_ROUTES = [
  '^/api/campaigns/[^/]+/maps',
  '/api/maps',
  '/api/map-sessions',
  '/api/map-assets',
  '/ws/map',
];

describe('devProxy', () => {
  it('routes every map REST/WS prefix to the map-service target', () => {
    for (const route of MAP_ROUTES) {
      expect(devProxy[route], route).toBeDefined();
      expect(devProxy[route].target, route).toBe(MAP_SERVICE_DEV_TARGET);
    }
  });

  it('routes the core REST/WS prefixes to the core backend target', () => {
    expect(devProxy['/api'].target).toBe(CORE_BACKEND_DEV_TARGET);
    expect(devProxy['/ws'].target).toBe(CORE_BACKEND_DEV_TARGET);
  });

  it('enables ws upgrade on both WebSocket routes', () => {
    expect(devProxy['/ws/map'].ws).toBe(true);
    expect(devProxy['/ws'].ws).toBe(true);
  });

  it('lists the specific map routes BEFORE the generic core routes', () => {
    const keys = Object.keys(devProxy);
    // http-proxy matches the first key the path starts with — order matters.
    expect(keys.indexOf('/api/maps')).toBeLessThan(keys.indexOf('/api'));
    expect(keys.indexOf('/api/map-sessions')).toBeLessThan(keys.indexOf('/api'));
    expect(keys.indexOf('/api/map-assets')).toBeLessThan(keys.indexOf('/api'));
    expect(keys.indexOf('/ws/map')).toBeLessThan(keys.indexOf('/ws'));
  });
});
