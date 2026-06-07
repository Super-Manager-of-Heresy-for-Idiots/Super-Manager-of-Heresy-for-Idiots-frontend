import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { wsService, type WsEventHandler } from '@/lib/websocket';
import { useAuthStore } from '@/store/authStore';
import { useWsStore, type ConnectionState } from '@/store/wsStore';
import type { CharacterResponse, WsEvent, WsEventType } from '@/types';
import { EventToast } from '@/components/realtime/EventToast';

/* ── toast style per event type ──────────────────────────── */

interface EventStyle {
  glyph: string;
  color: string;
  label: string;
}

const EVENT_STYLE: Record<WsEventType, EventStyle> = {
  ITEM_GRANTED:             { glyph: 'coin',     color: 'var(--gold)',      label: 'Item Granted' },
  ITEM_REMOVED:             { glyph: 'x',        color: 'var(--ember)',     label: 'Item Removed' },
  BUFF_APPLIED:             { glyph: 'shield',   color: 'var(--arcane)',    label: 'Buff Applied' },
  BUFF_REMOVED:             { glyph: 'minus',    color: 'var(--ink-quiet)', label: 'Buff Removed' },
  XP_GRANTED:               { glyph: 'flame',    color: 'var(--gold-pale)', label: 'XP Granted' },
  HP_CHANGED:               { glyph: 'cross',    color: 'var(--ember)',     label: 'HP Changed' },
  CHARACTER_UPDATED:        { glyph: 'scroll',   color: 'var(--ink)',       label: 'Character Updated' },
  NPC_REVEALED:             { glyph: 'eye',      color: 'var(--arcane)',    label: 'NPC Revealed' },
  NPC_HIDDEN:               { glyph: 'eye',      color: 'var(--ink-faint)', label: 'NPC Hidden' },
  QUEST_UPDATED:            { glyph: 'book',     color: 'var(--gold)',      label: 'Quest Updated' },
  CAMPAIGN_STATUS_CHANGED:  { glyph: 'hex',      color: 'var(--gold-pale)', label: 'Campaign Status' },
  MEMBER_KICKED:            { glyph: 'lock',     color: 'var(--ember)',     label: 'Member Kicked' },
};

/* ── the hook ────────────────────────────────────────────── */

/**
 * Connect to the campaign WebSocket on mount, disconnect on unmount.
 * Translates each event into React-Query cache invalidations (and where
 * possible an optimistic patch) plus a styled toast — except for events
 * the current user triggered themselves.
 */
export function useWebSocket(campaignId: string | undefined): { connectionState: ConnectionState } {
  const connectionState = useWsStore((s) => s.connectionState);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const handleEvent: WsEventHandler = useCallback(
    (event: WsEvent) => {
      const cid = event.campaignId;
      const charId = event.characterId;
      const isOwn = !!currentUserId && event.triggeredBy === currentUserId;

      switch (event.type) {
        case 'HP_CHANGED': {
          const data = event.data as { currentHp?: number; tempHp?: number; maxHp?: number };
          if (charId) {
            queryClient.setQueryData<CharacterResponse | undefined>(
              ['campaigns', cid, 'characters', charId],
              (prev) => (prev ? { ...prev, ...data } : prev),
            );
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId] });
          }
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters'] });
          break;
        }

        case 'CHARACTER_UPDATED': {
          const dto = event.data as CharacterResponse;
          if (charId) {
            queryClient.setQueryData(['campaigns', cid, 'characters', charId], dto);
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId] });
          }
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters'] });
          break;
        }

        case 'XP_GRANTED': {
          const data = event.data as { amount?: number; characterIds?: string[] };
          (data.characterIds ?? []).forEach((id) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', id] });
          });
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters'] });
          break;
        }

        case 'ITEM_GRANTED':
        case 'ITEM_REMOVED': {
          if (charId) {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId, 'inventory'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId] });
          }
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'storage'] });
          break;
        }

        case 'BUFF_APPLIED':
        case 'BUFF_REMOVED': {
          if (charId) {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId, 'effects'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId, 'stats'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'characters', charId] });
          }
          break;
        }

        case 'NPC_REVEALED':
        case 'NPC_HIDDEN': {
          const data = event.data as { npcId?: string };
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'npcs'] });
          if (data.npcId) {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'npcs', data.npcId] });
          }
          break;
        }

        case 'QUEST_UPDATED': {
          const data = event.data as { questId?: string };
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'quests'] });
          if (data.questId) {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'quests', data.questId] });
          }
          break;
        }

        case 'CAMPAIGN_STATUS_CHANGED': {
          queryClient.invalidateQueries({ queryKey: ['campaigns', cid] });
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          break;
        }

        case 'MEMBER_KICKED': {
          // user-queue payload: { campaignId } — current user was kicked.
          // topic payload:      { userId }     — someone else in the roster was kicked.
          const data = event.data as { userId?: string; campaignId?: string };
          if (data.userId) {
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', cid, 'members'] });
          } else {
            const kickedFrom = data.campaignId ?? cid;
            queryClient.removeQueries({ queryKey: ['campaigns', kickedFrom] });
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            wsService.disconnect();
            navigate('/campaigns', { replace: true });
          }
          break;
        }
      }

      if (isOwn) return;

      const style = EVENT_STYLE[event.type];
      if (!style) return;
      const body =
        typeof event.data === 'object' && event.data !== null && 'message' in event.data
          ? String((event.data as { message?: string }).message)
          : `Triggered by ${event.triggeredBy}`;

      toast.custom(
        (tst) => (
          <div style={{ opacity: tst.visible ? 1 : 0, transition: 'opacity 300ms ease' }}>
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
    },
    [queryClient, currentUserId, navigate],
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
