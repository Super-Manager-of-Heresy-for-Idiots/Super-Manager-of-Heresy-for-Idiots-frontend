import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WsEventType } from '@/types';
import s from './EventToast.module.css';

/* ── style config per event type ─────────────────────────── */

interface EventVisual {
  glyph: string;
  color: string;
  border: string;
}

const EVENT_STYLE: Record<WsEventType, EventVisual> = {
  ITEM_GRANTED:            { glyph: 'coin',   color: 'var(--gold)',       border: 'var(--gold)' },
  ITEM_REMOVED:            { glyph: 'x',      color: 'var(--ember)',      border: 'var(--ember)' },
  BUFF_APPLIED:            { glyph: 'shield',  color: 'var(--arcane)',    border: 'var(--arcane)' },
  BUFF_REMOVED:            { glyph: 'minus',   color: 'var(--ink-quiet)', border: 'var(--ink-quiet)' },
  XP_GRANTED:              { glyph: 'flame',   color: 'var(--gold-pale)', border: 'var(--gold-pale)' },
  HP_CHANGED:              { glyph: 'cross',   color: 'var(--ember)',     border: 'var(--ember)' },
  CHARACTER_UPDATED:       { glyph: 'scroll',  color: 'var(--ink)',       border: 'var(--bronze)' },
  NPC_REVEALED:            { glyph: 'eye',     color: 'var(--arcane)',    border: 'var(--arcane)' },
  NPC_HIDDEN:              { glyph: 'eye',     color: 'var(--ink-faint)', border: 'var(--ink-faint)' },
  MONSTER_REVEALED:        { glyph: 'eye',     color: 'var(--ember)',     border: 'var(--ember)' },
  MONSTER_HIDDEN:          { glyph: 'eye',     color: 'var(--ink-faint)', border: 'var(--ink-faint)' },
  QUEST_UPDATED:           { glyph: 'book',    color: 'var(--gold)',      border: 'var(--gold)' },
  CAMPAIGN_STATUS_CHANGED: { glyph: 'hex',     color: 'var(--gold-pale)', border: 'var(--gold-pale)' },
  MEMBER_KICKED:           { glyph: 'lock',    color: 'var(--ember)',     border: 'var(--ember)' },
  WALLET_CHANGED:          { glyph: 'coin',    color: 'var(--gold)',      border: 'var(--gold)' },
};

/* ── component ───────────────────────────────────────────── */

interface EventToastProps {
  type: WsEventType;
  title: string;
  body: string;
  time?: string;
}

export function EventToast({ type, title, body, time }: EventToastProps) {
  const visual = EVENT_STYLE[type] ?? EVENT_STYLE.CHARACTER_UPDATED;

  return (
    <div className={s.toast} style={{ '--tone': visual.color, '--edge': visual.border } as CSSProperties}>
      <div className={s.icon}>
        <Rune kind={visual.glyph} size={16} color={visual.color} />
      </div>

      <div className={s.text}>
        <div className={cn('ao-engraved', s.title)}>{title}</div>

        <div className={cn('ao-italic', s.body)}>{body}</div>

        {time && (
          <div className={cn('ao-codex', s.time)}>{formatTimeAgo(time)}</div>
        )}
      </div>
    </div>
  );
}
