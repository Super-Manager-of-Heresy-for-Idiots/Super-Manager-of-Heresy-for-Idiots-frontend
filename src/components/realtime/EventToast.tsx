import { Rune } from '@/components/ordo';
import { formatTimeAgo } from '@/lib/utils';
import type { WsEventType } from '@/types';

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
  QUEST_UPDATED:           { glyph: 'book',    color: 'var(--gold)',      border: 'var(--gold)' },
  CAMPAIGN_STATUS_CHANGED: { glyph: 'hex',     color: 'var(--gold-pale)', border: 'var(--gold-pale)' },
  MEMBER_KICKED:           { glyph: 'lock',    color: 'var(--ember)',     border: 'var(--ember)' },
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
    <div
      style={{
        width: 340,
        background: 'linear-gradient(180deg, var(--panel-raised) 0%, var(--panel) 100%)',
        border: '1px solid var(--rule-strong)',
        borderLeft: `3px solid ${visual.border}`,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        boxShadow: 'var(--shadow-mid)',
      }}
    >
      {/* icon box */}
      <div
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--abyss)',
          border: `1px solid ${visual.color}`,
        }}
      >
        <Rune kind={visual.glyph} size={16} color={visual.color} />
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="ao-engraved"
          style={{
            fontSize: 'var(--t-micro)',
            color: visual.color,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        <div
          className="ao-italic"
          style={{
            fontSize: 'var(--t-small)',
            color: 'var(--ink)',
            marginTop: 3,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {body}
        </div>

        {time && (
          <div
            className="ao-codex"
            style={{ marginTop: 4, fontSize: 10, color: 'var(--ink-faint)' }}
          >
            {formatTimeAgo(time)}
          </div>
        )}
      </div>
    </div>
  );
}
