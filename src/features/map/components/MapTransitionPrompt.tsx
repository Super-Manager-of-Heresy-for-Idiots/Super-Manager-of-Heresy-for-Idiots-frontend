import { useMemo } from 'react';
import { useMapTransitions, useTraverseTransition } from '@/hooks/useWorld';
import type { MapTransitionResponse } from '@/types';

interface TokenLike {
  id: string;
  characterId?: string | null;
  ownerUserId?: string | null;
  gridX: number;
  gridY: number;
}

interface Props {
  campaignId: string;
  sessionId: string;
  mapId: string;
  tokens: TokenLike[];
  /** Токены, которыми текущий пользователь вправе двигать. */
  movableTokenIds: string[];
  canMoveAny: boolean;
  meId?: string;
}

/**
 * Оверлей детекции переходов (WORLD_PLAN Этап 5): если управляемый пользователем токен
 * стоит на "ключевой клетке" включённого перехода, показывает кнопку перехода.
 * Детекция по committed-позиции токена; серверный traverse перепроверяет позицию.
 * Работает и в бою, и в пошаговом режиме (правила проверяет бэк).
 */
export function MapTransitionPrompt({
  campaignId,
  sessionId,
  mapId,
  tokens,
  movableTokenIds,
  canMoveAny,
  meId,
}: Props) {
  const { data: transitions } = useMapTransitions(campaignId, mapId);
  const traverse = useTraverseTransition();

  const matches = useMemo(() => {
    if (!transitions?.length) return [];
    // Переход — действие персонажа: токены без characterId (объекты, маркеры, монстры) не предлагаются.
    const controllable = tokens.filter(
      (tk) =>
        !!tk.characterId &&
        (canMoveAny || movableTokenIds.includes(tk.id) || (meId && tk.ownerUserId === meId)),
    );
    const found: Array<{ transition: MapTransitionResponse; token: TokenLike }> = [];
    for (const tr of transitions) {
      if (!tr.enabled) continue;
      for (const tk of controllable) {
        const onCell = tr.fromCells.some((c) => c.gridX === tk.gridX && c.gridY === tk.gridY);
        if (onCell) found.push({ transition: tr, token: tk });
      }
    }
    return found;
  }, [transitions, tokens, movableTokenIds, canMoveAny, meId]);

  if (!matches.length) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {matches.map(({ transition, token }) => (
        <button
          key={`${transition.id}:${token.id}`}
          className="ao-btn ao-btn--primary ao-btn--sm"
          disabled={traverse.isPending}
          onClick={() =>
            traverse.mutate({
              campaignId,
              transitionId: transition.id,
              data: {
                characterId: token.characterId as string,
                tokenId: token.id,
                fromSessionId: sessionId,
              },
            })
          }
        >
          {transition.label ? `Перейти: ${transition.label}` : 'Перейти на другую карту'}
        </button>
      ))}
    </div>
  );
}
