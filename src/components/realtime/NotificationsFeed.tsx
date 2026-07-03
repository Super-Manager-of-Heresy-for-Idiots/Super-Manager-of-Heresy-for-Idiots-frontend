import type { CSSProperties } from 'react';
import { Rune, OrdoPanel, PanelHeader } from '@/components/ordo';
import { useWsStore, type Notification } from '@/store/wsStore';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import type { WsEventType } from '@/types';
import s from './NotificationsFeed.module.css';
import { formatNotificationBody, getNotificationTitle } from '@/lib/notificationText';

/* ── visual config per event type ────────────────────────── */

interface EventVisual {
  glyph: string;
  color: string;
}

const EVENT_VISUAL: Record<WsEventType, EventVisual> = {
  ITEM_GRANTED:            { glyph: 'coin',   color: 'var(--gold)' },
  ITEM_REMOVED:            { glyph: 'x',      color: 'var(--ember)' },
  BUFF_APPLIED:            { glyph: 'shield',  color: 'var(--arcane)' },
  BUFF_REMOVED:            { glyph: 'minus',   color: 'var(--ink-quiet)' },
  XP_GRANTED:              { glyph: 'flame',   color: 'var(--gold-pale)' },
  HP_CHANGED:              { glyph: 'cross',   color: 'var(--ember)' },
  CHARACTER_UPDATED:       { glyph: 'scroll',  color: 'var(--ink)' },
  NPC_REVEALED:            { glyph: 'eye',     color: 'var(--arcane)' },
  NPC_HIDDEN:              { glyph: 'eye',     color: 'var(--ink-faint)' },
  LOCATION_REVEALED:       { glyph: 'eye',     color: 'var(--arcane)' },
  LOCATION_HIDDEN:         { glyph: 'eye',     color: 'var(--ink-faint)' },
  MONSTER_REVEALED:        { glyph: 'eye',     color: 'var(--ember)' },
  MONSTER_HIDDEN:          { glyph: 'eye',     color: 'var(--ink-faint)' },
  QUEST_UPDATED:           { glyph: 'book',    color: 'var(--gold)' },
  CAMPAIGN_STATUS_CHANGED: { glyph: 'hex',     color: 'var(--gold-pale)' },
  MEMBER_KICKED:           { glyph: 'lock',    color: 'var(--ember)' },
  WALLET_CHANGED:          { glyph: 'coin',    color: 'var(--gold)' },
  BATTLE_STARTED:          { glyph: 'sword',   color: 'var(--gold)' },
  BATTLE_UPDATED:          { glyph: 'sword',   color: 'var(--ink)' },
  COMBATANT_JOINED:        { glyph: 'helm',    color: 'var(--arcane)' },
  BATTLE_TURN_CHANGED:     { glyph: 'arrow-r', color: 'var(--gold-pale)' },
  BATTLE_ACTION:           { glyph: 'sword',   color: 'var(--ember)' },
  BATTLE_ENDED:            { glyph: 'flame',   color: 'var(--ember)' },
  FRIEND_REQUEST_RECEIVED: { glyph: 'eye',     color: 'var(--gold)' },
  FRIEND_REQUEST_ACCEPTED: { glyph: 'check',   color: 'var(--arcane)' },
  FRIEND_REMOVED:          { glyph: 'minus',   color: 'var(--ink-quiet)' },
};

/* ── single notification row ─────────────────────────────── */

function NotificationRow({ notif }: { notif: Notification }) {
  const t = useT();
  const { markRead } = useWsStore();
  const visual = EVENT_VISUAL[notif.event.type] ?? { glyph: 'cir', color: 'var(--ink-quiet)' };
  const label = getNotificationTitle(notif.event, t);
  const body = formatNotificationBody(notif.event, t);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!notif.read) markRead(notif.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !notif.read) markRead(notif.id);
      }}
      className={cn(s.row, !notif.read && s.unread)}
      style={{ '--tone': visual.color } as CSSProperties}
    >
      <div className={s.icon}>
        <Rune kind={visual.glyph} size={14} color={visual.color} />
      </div>

      <div className={s.text}>
        <div className={s.head}>
          <span className={cn('ao-engraved', s.label)}>{label}</span>

          {!notif.read && (
            <Rune kind="diamond-fill" size={6} color="var(--gold)" />
          )}
        </div>

        <div className={cn('ao-italic', s.body)}>{body}</div>

        <div className={cn('ao-codex', s.time)}>{formatTimeAgo(notif.receivedAt)}</div>
      </div>
    </div>
  );
}

/* ── feed panel ──────────────────────────────────────────── */

export function NotificationsFeed() {
  const t = useT();
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useWsStore();

  return (
    <OrdoPanel padding={0}>
      <PanelHeader
        title={t('cmp2.notif.title')}
        glyph="scroll"
        tone="gold"
        right={
          <div className="ao-row ao-gap-8">
            {unreadCount > 0 && (
              <button
                className="ao-btn ao-btn--sm ao-btn--ghost"
                onClick={markAllRead}
              >
                {t('cmp2.notif.markAllRead')}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="ao-btn ao-btn--sm ao-btn--ghost"
                onClick={clearNotifications}
              >
                {t('cmp2.notif.clear')}
              </button>
            )}
          </div>
        }
      />

      <div className={cn('ao-scroll', s.scroll)}>
        {notifications.length === 0 ? (
          <div className={s.empty}>
            <Rune kind="scroll" size={28} color="var(--ink-ghost)" />
            <div className={cn('ao-italic', s.emptyText)}>
              {t('cmp2.notif.empty')}
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationRow key={notif.id} notif={notif} />
          ))
        )}
      </div>
    </OrdoPanel>
  );
}
