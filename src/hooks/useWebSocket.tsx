import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { wsService, type WsEventHandler } from '@/lib/websocket';
import { useWsStore, type ConnectionState } from '@/store/wsStore';
import type { WsEvent, WsEventType } from '@/types';
import { EventToast } from '@/components/realtime/EventToast';

/* ── style map for toast notifications ──────────────────── */

interface EventStyle {
  glyph: string;
  color: string;
  label: string;
}

const EVENT_STYLE: Record<WsEventType, EventStyle> = {
  ITEM_GRANTED:             { glyph: 'coin',    color: 'var(--gold)',    label: 'Item Granted' },
  ITEM_REMOVED:             { glyph: 'x',       color: 'var(--ember)',   label: 'Item Removed' },
  BUFF_APPLIED:             { glyph: 'shield',   color: 'var(--arcane)', label: 'Buff Applied' },
  BUFF_REMOVED:             { glyph: 'minus',    color: 'var(--ink-quiet)', label: 'Buff Removed' },
  XP_GRANTED:               { glyph: 'flame',    color: 'var(--gold-pale)', label: 'XP Granted' },
  HP_CHANGED:               { glyph: 'cross',    color: 'var(--ember)',   label: 'HP Changed' },
  CHARACTER_UPDATED:        { glyph: 'scroll',   color: 'var(--ink)',     label: 'Character Updated' },
  NPC_REVEALED:             { glyph: 'eye',      color: 'var(--arcane)', label: 'NPC Revealed' },
  NPC_HIDDEN:               { glyph: 'eye',      color: 'var(--ink-faint)', label: 'NPC Hidden' },
  QUEST_UPDATED:            { glyph: 'book',     color: 'var(--gold)',    label: 'Quest Updated' },
  CAMPAIGN_STATUS_CHANGED:  { glyph: 'hex',      color: 'var(--gold-pale)', label: 'Campaign Status' },
  MEMBER_KICKED:            { glyph: 'lock',     color: 'var(--ember)',   label: 'Member Kicked' },
};

/* ── query key mapping for cache invalidation ───────────── */

function getInvalidationKeys(event: WsEvent): string[][] {
  const cid = event.campaignId;
  const keys: string[][] = [];

  switch (event.type) {
    case 'ITEM_GRANTED':
    case 'ITEM_REMOVED':
      keys.push(['campaigns', cid, 'characters']);
      if (event.characterId) keys.push(['characters', event.characterId]);
      keys.push(['campaigns', cid, 'storage']);
      break;

    case 'BUFF_APPLIED':
    case 'BUFF_REMOVED':
      keys.push(['campaigns', cid, 'characters']);
      if (event.characterId) keys.push(['characters', event.characterId]);
      break;

    case 'XP_GRANTED':
      keys.push(['campaigns', cid, 'characters']);
      if (event.characterId) keys.push(['characters', event.characterId]);
      break;

    case 'HP_CHANGED':
    case 'CHARACTER_UPDATED':
      keys.push(['campaigns', cid, 'characters']);
      if (event.characterId) keys.push(['characters', event.characterId]);
      break;

    case 'NPC_REVEALED':
    case 'NPC_HIDDEN':
      keys.push(['campaigns', cid, 'npcs']);
      break;

    case 'QUEST_UPDATED':
      keys.push(['campaigns', cid, 'quests']);
      break;

    case 'CAMPAIGN_STATUS_CHANGED':
      keys.push(['campaigns', cid]);
      keys.push(['campaigns']);
      break;

    case 'MEMBER_KICKED':
      keys.push(['campaigns', cid]);
      keys.push(['campaigns']);
      break;
  }

  return keys;
}

/* ── the hook ────────────────────────────────────────────── */

/**
 * Connect to the campaign WebSocket on mount, disconnect on unmount.
 * Automatically invalidates React-Query caches and shows toasts.
 */
export function useWebSocket(campaignId: string | undefined): {
  connectionState: ConnectionState;
} {
  const connectionState = useWsStore((s) => s.connectionState);
  const queryClient = useQueryClient();

  const handleEvent: WsEventHandler = useCallback(
    (event: WsEvent) => {
      // 1. Invalidate relevant caches
      const keys = getInvalidationKeys(event);
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // 2. Show styled toast
      const style = EVENT_STYLE[event.type];
      if (style) {
        const body =
          typeof event.data === 'object' && event.data !== null && 'message' in event.data
            ? String((event.data as { message: string }).message)
            : `Triggered by ${event.triggeredBy}`;

        toast.custom(
          (t) => (
            <div
              style={{ opacity: t.visible ? 1 : 0, transition: 'opacity 300ms ease' }}
            >
              <EventToast
                type={event.type}
                title={style.label}
                body={body}
                time={event.timestamp}
              />
            </div>
          ),
          { duration: 5000 },
        );
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!campaignId) return;

    wsService.onEvent(handleEvent);
    wsService.connect(campaignId);

    return () => {
      wsService.offEvent(handleEvent);
      wsService.disconnect();
    };
  }, [campaignId, handleEvent]);

  return { connectionState };
}
