/**
 * Combat-log tab (Phase 1.2). A chronological, append-only feed of the battle's events
 * (attacks, damage/heal, turns, conditions, death saves…). The query lives under the
 * `['campaigns', cid, 'battles', …]` prefix, so the central WS handler's battle-event
 * invalidation (incl. BATTLE_LOG_APPENDED) refetches it live. Each row with a payload
 * expands to reveal the roll formula / dice / modifier via the shared ExpandablePanel.
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { battlesApi } from '@/api/battles.api';
import { ExpandChevron, ExpandablePanel } from '@/components/common/ExpandableRow';
import type { BattleLogEntry, BattleLogType } from '@/types';
import s from './LogTab.module.css';

const CATEGORY: Record<BattleLogType, string> = {
  ATTACK: s.catOffense,
  SAVE: s.catOffense,
  DAMAGE: s.catOffense,
  HEAL: s.catSupport,
  HP_SET: s.catMisc,
  TURN: s.catFlow,
  ROUND: s.catFlow,
  CONDITION: s.catState,
  EFFECT: s.catState,
  DEATH_SAVE: s.catState,
  GM_OVERRIDE: s.catMisc,
  ITEM: s.catMisc,
  SPELL: s.catSupport,
};

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

/** Compact one-line summary; the expandable detail carries the full payload. */
function summarize(e: BattleLogEntry): string {
  const p = e.payload ?? {};
  switch (e.type) {
    case 'ATTACK': {
      const head = `${str(p.attackerName)} → ${str(p.targetName)}: ${str(p.attackName)} · ${str(p.outcome)}`;
      return p.damage != null ? `${head} · ${str(p.damage)}` : head;
    }
    case 'DAMAGE':
      return `${str(p.targetName)} −${str(p.amount)} HP`;
    case 'HEAL':
      return `${str(p.targetName)} +${str(p.amount)} HP`;
    case 'TURN':
      return str(p.combatantName);
    case 'ROUND':
      return str(p.round);
    case 'CONDITION':
      return `${str(p.combatantName)}: ${str(p.code || p.conditionId)} (${str(p.action)})`;
    case 'DEATH_SAVE':
      return `${str(p.targetName)}: ${str(p.event)}`;
    default: {
      const keys = Object.keys(p);
      return keys.length ? keys.map((k) => `${k}=${str(p[k])}`).join(' · ') : e.type;
    }
  }
}

export function LogTab({ campaignId, battleId }: { campaignId: string; battleId: string }) {
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', campaignId, 'battles', battleId, 'log'],
    queryFn: () => battlesApi.getLog(campaignId, battleId, 0, 200),
    select: (r) => r.data,
  });
  const entries = data ?? [];

  // Keep the newest entry in view as the feed grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [entries.length]);

  if (isLoading) return <p className={cn('ao-italic', s.status)}>{t('tactical.log.loading')}</p>;
  if (isError) return <p className={cn('ao-italic', s.status)}>{t('tactical.log.error')}</p>;
  if (!entries.length) return <p className={cn('ao-italic', s.status)}>{t('tactical.log.empty')}</p>;

  return (
    <div className={s.log}>
      {entries.map((e) => {
        const open = openId === e.id;
        const hasDetail = !!e.payload && Object.keys(e.payload).length > 0;
        return (
          <div key={e.id} className={s.entry}>
            <button
              type="button"
              className={cn(s.row, hasDetail && s.rowClickable)}
              onClick={() => hasDetail && setOpenId(open ? null : e.id)}
              aria-expanded={hasDetail ? open : undefined}
            >
              <span className={cn(s.badge, CATEGORY[e.type])}>{t(`tactical.log.type.${e.type}`)}</span>
              <span className={s.summary}>{summarize(e)}</span>
              {e.visibility === 'GM_ONLY' && <span className={s.gmOnly}>GM</span>}
              {hasDetail && <ExpandChevron open={open} />}
            </button>
            {hasDetail && (
              <ExpandablePanel open={open}>
                <dl className={s.detail}>
                  {Object.entries(e.payload ?? {}).map(([k, v]) => (
                    <div key={k} className={s.detailRow}>
                      <dt>{k}</dt>
                      <dd>{str(v)}</dd>
                    </div>
                  ))}
                </dl>
              </ExpandablePanel>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
