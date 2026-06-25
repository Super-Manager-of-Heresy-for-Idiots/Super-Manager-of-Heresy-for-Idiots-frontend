import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { mapApi } from '../api';
import type { UUID } from '../types';

interface MapAssetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  assetId: UUID;
}

/**
 * Renders map asset content through an authorized REST request. A plain `<img src>`
 * cannot attach the `X-User-Id` header required by map-service.
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
