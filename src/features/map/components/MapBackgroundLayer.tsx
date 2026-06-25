import type { ImageSize } from '../hooks/useMapViewport';
import type { UUID } from '../types';
import { MapAssetImage } from './MapAssetImage';
import s from './MapViewport.module.css';

interface MapBackgroundLayerProps {
  imageAssetId: UUID;
  /** Reports the image's natural pixel size (== image-coordinate extent) on load. */
  onImageSize: (size: ImageSize) => void;
}

/**
 * Background image layer. The image is decorative (alt=""): map meaning is carried
 * by tokens, which have their own labels. Rendered at image-space origin (0,0) at
 * its natural size, so child layers can position purely in image coordinates.
 */
export function MapBackgroundLayer({ imageAssetId, onImageSize }: MapBackgroundLayerProps) {
  return (
    <MapAssetImage
      assetId={imageAssetId}
      alt=""
      draggable={false}
      className={s.bgImage}
      onLoad={(e) =>
        onImageSize({
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
        })
      }
    />
  );
}
