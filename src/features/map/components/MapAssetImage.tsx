import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { mapApi } from '../api';
import type { UUID } from '../types';

interface MapAssetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  assetId: UUID;
}

/**
 * Renders map asset content through an authorized REST request (browser-safe content
 * endpoint, audit MAP-13). A plain `<img src>` cannot attach the `Authorization`
 * header / session credentials the map-service requires, so the bytes are fetched via
 * `mapApi.assets.content()` and shown as an object URL.
 */
export function MapAssetImage({ assetId, ...imgProps }: MapAssetImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let nextUrl: string | null = null;

    setObjectUrl(null);
    void (async () => {
      try {
        const blob = await mapApi.assets.content(assetId);
        if (cancelled) return;
        nextUrl = URL.createObjectURL(blob);
        setObjectUrl(nextUrl);
      } catch {
        if (!cancelled) setObjectUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [assetId]);

  if (!objectUrl) return null;

  return <img {...imgProps} src={objectUrl} />;
}
