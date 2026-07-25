import { Suspense } from 'react';
import { Outlet, useMatch, useOutletContext, useParams } from 'react-router-dom';
import { BackLink, CampaignStatusPill, SectionTabs } from '@/components/campaigns';
import { ConnectionIndicator } from '@/components/realtime/ConnectionIndicator';
import { RollPromptHost } from '@/components/world/RollPromptHost';
import { CAMPAIGN_TABS } from '@/config/campaignSections';
import { useCampaign } from '@/hooks/useCampaigns';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { CampaignDetailResponse } from '@/types';
import { PageFallback } from './PageFallback';
import s from './CampaignLayout.module.css';

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
  // На обзоре кампании назад — к списку кампаний; в любом её разделе назад —
  // на обзор, иначе один клик выбрасывал бы из кампании целиком.
  const isOverview = !!useMatch('/campaigns/:campaignId');

  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId!);

  // Campaign-scoped realtime: connects on enter, swaps on campaign change,
  // disconnects when leaving the campaign subtree entirely.
  useWebSocket(campaignId);

  const back = isOverview
    ? { to: '/campaigns', label: t('camp2.back.campaigns') }
    : { to: `/campaigns/${campaignId}`, label: t('camp2.back.campaign') };

  /* ── loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <BackLink to={back.to} label={back.label} className={s.back} />
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
        <BackLink to={back.to} label={back.label} className={s.back} />
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
      <BackLink to={back.to} label={back.label} className={s.back} />

      <div className={s.head}>
        <h3 className="ao-h3">{campaign.name}</h3>
        <CampaignStatusPill status={campaign.status} />
        <div className={s.conn}>
          <ConnectionIndicator />
        </div>
      </div>

      <SectionTabs sections={CAMPAIGN_TABS} labelKey="camp.dash.tabs.label" className={s.nav} />

      <div className={s.body}>
        <Suspense fallback={<PageFallback />}>
          <Outlet context={{ campaign } satisfies CampaignOutletContext} />
        </Suspense>
      </div>

      {/* ROLL_PROMPT: окно броска у игрока — мастер инициирует проверку с любой страницы кампании. */}
      <RollPromptHost campaignId={campaign.id} />
    </div>
  );
}
