import { describe, expect, it } from 'vitest';
import {
  MAP_API_BASE_URL,
  browserSafeAssetUrl,
  isBrowserUnsafeAssetUrl,
  mapAssetContentUrl,
} from './mapApiConfig';

/** Asset delivery tests (audit MAP-13): never hand the browser an internal MinIO URL. */
describe('mapAssetContentUrl', () => {
  it('builds a same-origin content URL under the map API base', () => {
    expect(MAP_API_BASE_URL).toBe('/api');
    expect(mapAssetContentUrl('asset-1')).toBe('/api/map-assets/asset-1/content');
  });
});

describe('isBrowserUnsafeAssetUrl', () => {
  it('flags internal object-store hosts the browser cannot resolve', () => {
    expect(isBrowserUnsafeAssetUrl('http://map-minio:9000/dnd-map-assets/x')).toBe(true);
    expect(isBrowserUnsafeAssetUrl('http://minio:9000/x')).toBe(true);
    expect(isBrowserUnsafeAssetUrl('https://map-minio.svc/x')).toBe(true);
    expect(isBrowserUnsafeAssetUrl('http://storage.internal/x')).toBe(true);
    expect(isBrowserUnsafeAssetUrl(null)).toBe(true);
    expect(isBrowserUnsafeAssetUrl(undefined)).toBe(true);
  });

  it('accepts same-origin and public/CDN URLs', () => {
    expect(isBrowserUnsafeAssetUrl('/api/map-assets/asset-1/content')).toBe(false);
    expect(isBrowserUnsafeAssetUrl('https://cdn.example.com/asset-1.png')).toBe(false);
  });
});

describe('browserSafeAssetUrl', () => {
  it('falls back to the content endpoint when downloadUrl is an internal MinIO URL', () => {
    const url = browserSafeAssetUrl({ id: 'asset-1', downloadUrl: 'http://map-minio:9000/x' });
    expect(url).toBe('/api/map-assets/asset-1/content');
  });

  it('falls back to the content endpoint when no downloadUrl is present', () => {
    expect(browserSafeAssetUrl({ id: 'asset-1' })).toBe('/api/map-assets/asset-1/content');
  });

  it('uses a browser-safe (same-origin) downloadUrl as-is', () => {
    const url = browserSafeAssetUrl({ id: 'asset-1', downloadUrl: '/api/map-assets/asset-1/content' });
    expect(url).toBe('/api/map-assets/asset-1/content');
  });
});
