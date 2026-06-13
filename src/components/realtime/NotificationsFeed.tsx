import { Rune, OrdoPanel, PanelHeader } from '@/components/ordo';
import { useWsStore, type Notification } from '@/store/wsStore';
import { formatTimeAgo } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import type { WsEventType } from '@/types';

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
  MONSTER_REVEALED:        { glyph: 'eye',     color: 'var(--ember)' },
  MONSTER_HIDDEN:          { glyph: 'eye',     color: 'var(--ink-faint)' },
  QUEST_UPDATED:           { glyph: 'book',    color: 'var(--gold)' },
  CAMPAIGN_STATUS_CHANGED: { glyph: 'hex',     color: 'var(--gold-pale)' },
  MEMBER_KICKED:           { glyph: 'lock',    color: 'var(--ember)' },
  WALLET_CHANGED:          { glyph: 'coin',    color: 'var(--gold)' },
};

/* human-readable label keys */
const EVENT_LABEL_KEY: Record<WsEventType, string> = {
  ITEM_GRANTED:            'cmp2.event.ITEM_GRANTED',
  ITEM_REMOVED:            'cmp2.event.ITEM_REMOVED',
  BUFF_APPLIED:            'cmp2.event.BUFF_APPLIED',
  BUFF_REMOVED:            'cmp2.event.BUFF_REMOVED',
  XP_GRANTED:              'cmp2.event.XP_GRANTED',
  HP_CHANGED:              'cmp2.event.HP_CHANGED',
  CHARACTER_UPDATED:       'cmp2.event.CHARACTER_UPDATED',
  NPC_REVEALED:            'cmp2.event.NPC_REVEALED',
  NPC_HIDDEN:              'cmp2.event.NPC_HIDDEN',
  MONSTER_REVEALED:        'cmp2.event.MONSTER_REVEALED',
  MONSTER_HIDDEN:          'cmp2.event.MONSTER_HIDDEN',
  QUEST_UPDATED:           'cmp2.event.QUEST_UPDATED',
  CAMPAIGN_STATUS_CHANGED: 'cmp2.event.CAMPAIGN_STATUS_CHANGED',
  MEMBER_KICKED:           'cmp2.event.MEMBER_KICKED',
  WALLET_CHANGED:          'cmp2.event.WALLET_CHANGED',
};

/* ── single notification row ─────────────────────────────── */

function NotificationRow({ notif }: { notif: Notification }) {
  const t = useT();
  const { markRead } = useWsStore();
  const visual = EVENT_VISUAL[notif.event.type] ?? { glyph: 'cir', color: 'var(--ink-quiet)' };
  const labelKey = EVENT_LABEL_KEY[notif.event.type];
  const label = labelKey ? t(labelKey) : notif.event.type;

  const body =
    typeof notif.event.data === 'object' &&
    notif.event.data !== null &&
    'message' in notif.event.data
      ? String((notif.event.data as { message: string }).message)
      : t('cmp2.notif.by', { name: notif.event.triggeredBy });

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
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 14px',
        borderBottom: '1px solid var(--hairline)',
        borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--gold)',
        cursor: notif.read ? 'default' : 'pointer',
        transition: 'background 150ms',
        background: notif.read ? 'transparent' : 'rgba(176, 141, 78, 0.03)',
      }}
    >
      {/* icon */}
      <div
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--abyss)',
          border: `1px solid ${visual.color}`,
        }}
      >
        <Rune kind={visual.glyph} size={14} color={visual.color} />
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="ao-engraved"
            style={{ fontSize: 'var(--t-micro)', color: visual.color }}
          >
            {label}
          </span>

          {!notif.read && (
            <Rune kind="diamond-fill" size={6} color="var(--gold)" />
          )}
        </div>

        <div
          className="ao-italic"
          style={{
            fontSize: 'var(--t-small)',
            color: 'var(--ink)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {body}
        </div>

        <div
          className="ao-codex"
          style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 3 }}
        >
          {formatTimeAgo(notif.receivedAt)}
        </div>
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
          <div style={{ display: 'flex', gap: 8 }}>
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

      <div
        className="ao-scroll"
        style={{ maxHeight: 420, overflowY: 'auto' }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
            }}
          >
            <Rune kind="scroll" size={28} color="var(--ink-ghost)" />
            <div
              className="ao-italic"
              style={{
                marginTop: 10,
                fontSize: 'var(--t-small)',
                color: 'var(--ink-faint)',
              }}
            >
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
