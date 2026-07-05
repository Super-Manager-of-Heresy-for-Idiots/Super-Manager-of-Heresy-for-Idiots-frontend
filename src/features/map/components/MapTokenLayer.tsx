import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { OrdoInterfaceIcon } from '@/components/ordo';
import { cn } from '@/lib/utils';
import type { GridConfig, MapTokenDto, TokenType, UUID } from '../types';
import type { TokenDragPreview } from '../state';
import { getGridCellImageMetrics, gridToImagePoint } from '../engine';
import s from './MapViewport.module.css';

interface MapTokenLayerProps {
  grid: GridConfig;
  tokens: MapTokenDto[];
  selectedTokenId: UUID | null;
  remoteDragPreviews: TokenDragPreview[];
  localDragPreview: TokenDragPreview | null;
  onSelectToken?: (tokenId: UUID | null) => void;
  onTokenPointerDown?: (tokenId: UUID, e: ReactPointerEvent<HTMLDivElement>) => void;
}

const TYPE_CLASS: Record<TokenType, string> = {
  CHARACTER: s.typeCharacter,
  NPC: s.typeNpc,
  MONSTER: s.typeMonster,
  OBJECT: s.typeObject,
  MARKER: s.typeMarker,
};

/**
 * Token layer. Each token is positioned by its grid coordinate (never pixels) and
 * sized by widthCells/heightCells, anchored top-left per the engine's policy. A
 * pending drag preview (local or remote) overrides the committed position as a ghost
 * — the committed position itself only changes when TOKEN_MOVED arrives.
 */
export function MapTokenLayer({
  grid,
  tokens,
  selectedTokenId,
  remoteDragPreviews,
  localDragPreview,
  onSelectToken,
  onTokenPointerDown,
}: MapTokenLayerProps) {
  const previewByTokenId = new Map<UUID, TokenDragPreview>();
  for (const preview of remoteDragPreviews) previewByTokenId.set(preview.tokenId, preview);
  if (localDragPreview) previewByTokenId.set(localDragPreview.tokenId, localDragPreview);

  return (
    <div className={s.tokenLayer}>
      {tokens.map((token) => {
        if (!token.visible) return null;

        const preview = previewByTokenId.get(token.id);
        const point = gridToImagePoint(
          preview ? preview.gridX : token.gridX,
          preview ? preview.gridY : token.gridY,
          grid,
        );
        const metrics = getGridCellImageMetrics(
          preview ? preview.gridX : token.gridX,
          preview ? preview.gridY : token.gridY,
          token.widthCells,
          token.heightCells,
          grid,
        );
        const label = token.name.trim().slice(0, 3) || '?';

        const select = () => onSelectToken?.(token.id);
        const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select();
          }
        };

        return (
          <div
            key={token.id}
            role="button"
            tabIndex={token.locked ? -1 : 0}
            aria-label={token.locked ? `${token.name} (locked)` : token.name}
            aria-pressed={token.id === selectedTokenId}
            title={token.name}
            className={cn(
              s.token,
              TYPE_CLASS[token.tokenType],
              token.id === selectedTokenId && s.isSelected,
              token.locked && s.isLocked,
              preview && s.isGhost,
            )}
            style={{
              left: point.imageX,
              top: point.imageY,
              width: metrics.widthPx,
              height: metrics.heightPx,
            }}
            onPointerDown={(e) => {
              e.stopPropagation(); // don't let the viewport start a pan
              if (!token.locked) onTokenPointerDown?.(token.id, e);
            }}
            onClick={(e) => {
              e.stopPropagation();
              select();
            }}
            onKeyDown={onKeyDown}
          >
            <span className={s.tokenLabel}>{label}</span>
            {token.locked && <OrdoInterfaceIcon icon="token-locked" size={12} className={s.tokenLock} />}
          </div>
        );
      })}
    </div>
  );
}
