import { Suspense } from 'react';
import { NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { BackLink, CampaignStatusPill } from '@/components/campaigns';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from '@/components/ordo';
import { ConnectionIndicator } from '@/components/realtime/ConnectionIndicator';
import { useCampaign } from '@/hooks/useCampaigns';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { CampaignDetailResponse } from '@/types';
import { PageFallback } from './PageFallback';
import s from './CampaignLayout.module.css';

/* ── Sub-navigation definition ──────────────────────────── */

interface SubNavEntry {
  /** Relative path from `/campaigns/:campaignId` (empty string = index). */
  to: string;
  labelKey: string;
  icon: OrdoInterfaceIconKey;
  /** When true the link is only visible to GM/ADMIN. */
  gm?: boolean;
  /** Match the index route exactly (no prefix matching). */
  end?: boolean;
}

const SUBNAV: SubNavEntry[] = [
  { to: '', labelKey: 'camp.nav.overview', icon: 'campaign', end: true },
  { to: 'members', labelKey: 'camp.dash.drill.roster', icon: 'character-in-campaign' },
  { to: 'bestiary', labelKey: 'camp.dash.drill.bestiary', icon: 'bestiary' },
  { to: 'storage', labelKey: 'camp.dash.drill.storage', icon: 'shared-storage' },
  { to: 'items', labelKey: 'camp.dash.drill.items', icon: 'item' },
  { to: 'invite', labelKey: 'camp.dash.drill.invite', icon: 'friend-request', gm: true },
  { to: 'npcs', labelKey: 'camp.dash.drill.npcs', icon: 'npc', gm: true },
  { to: 'quests', labelKey: 'camp.dash.drill.quests', icon: 'quest', gm: true },
  { to: 'locations', labelKey: 'camp.dash.drill.locations', icon: 'location', gm: true },
  { to: 'maps', labelKey: 'camp.dash.drill.maps', icon: 'map', gm: true },
  { to: 'notes', labelKey: 'camp.dash.drill.notes', icon: 'session-note', gm: true },
  { to: 'xp', labelKey: 'camp.dash.drill.grantXp', icon: 'reward-xp', gm: true },
  { to: 'wallet', labelKey: 'camp.dash.drill.balances', icon: 'wallet', gm: true },
];

/* ── Outlet context ─────────────────────────────────────── */

export interface CampaignOutletContext {
  campaign: CampaignDetailResponse;
}

/** Read the campaign loaded once by {@link CampaignLayout}. */
export function useCampaignContext() {
  return useOutletContext<CampaignOutletContext>();
}

/* ── Layout ─────────────────────────────────────────────── */

/**
 * Persistent shell for every `/campaigns/:campaignId/*` route.
 * Owns: the single campaign fetch + loading/error, the campaign header,
 * role-aware sub-navigation, and the campaign-scoped WebSocket connection.
 * Child pages render inside the inner <Outlet/> and receive `campaign` via context.
 */
export function CampaignLayout() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuthStore();
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId!);

  // Campaign-scoped realtime: connects on enter, swaps on campaign change,
  // disconnects when leaving the campaign subtree entirely.
  useWebSocket(campaignId);

  const items = SUBNAV.filter((item) => !item.gm || isGm);

  /* ── loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <BackLink to="/campaigns" label={t('camp2.back.campaigns')} className={s.back} />
        <div className={cn('ao-breathe', s.headSkel)}>
          <div className={cn('ao-ph', s.phTitle)} />
          <div className={cn('ao-ph', s.phNav)} />
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────── */
  if (error || !campaign) {
    return (
      <div>
        <BackLink to="/campaigns" label={t('camp2.back.campaigns')} className={s.back} />
        <div className={s.errorBlock}>
          <p className={cn('ao-italic', s.errorText)}>{t('camp.dash.loadError')}</p>
          {isRetryableError(error) && (
            <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
          )}
        </div>
      </div>
    );
  }

  /* ── shell ───────────────────────────────────────────── */
  return (
    <div className={s.shell}>
      <BackLink to="/campaigns" label={t('camp2.back.campaigns')} className={s.back} />

      <div className={s.head}>
        <h3 className="ao-h3">{campaign.name}</h3>
        <CampaignStatusPill status={campaign.status} />
        <div className={s.conn}>
          <ConnectionIndicator />
        </div>
      </div>

      <nav className={cn('ao-tabs', s.nav)} aria-label={t('camp.dash.tabs.label')}>
        {items.map((item) => (
          <NavLink
            key={item.to || 'overview'}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn('ao-tab', isActive && 'is-active')}
          >
            <OrdoInterfaceIcon icon={item.icon} size={13} className={s.navIcon} />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className={s.body}>
        <Suspense fallback={<PageFallback />}>
          <Outlet context={{ campaign } satisfies CampaignOutletContext} />
        </Suspense>
      </div>
    </div>
  );
}
