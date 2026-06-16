import { Suspense, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Rune } from '@/components/ordo';
import { StatusSwitch } from '@/components/campaigns';
import { PageFallback } from '@/components/layout/PageFallback';
import { useCampaignContext } from '@/components/layout/CampaignLayout';
import { useAuthStore } from '@/store/authStore';
import { useSetCampaignStatus } from '@/hooks/useCampaigns';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignDetailResponse, CampaignStatus, CharacterV2Response } from '@/types';
import s from './CampaignDashboardPage.module.css';

/* ── Outlet context (shared with the three dashboard tab views) ── */

export interface DashboardOutletContext {
  campaignId: string;
  campaign: CampaignDetailResponse;
  charsLoading: boolean;
  rosterCharacters: CharacterV2Response[];
  charCounts: { total: number; active: number; dead: number; reserve: number };
  isPlayer: boolean;
  canCreateCharacter: boolean;
  canManageCampaign: boolean;
}

export function useDashboardContext() {
  return useOutletContext<DashboardOutletContext>();
}

/* ── Dashboard layout: stats + actions + URL-driven tab strip ── */

/**
 * Campaign overview. Renders the stats band, role actions and the
 * Sections / Characters / Battle tab strip; the active tab is a nested
 * route (`""` | `roster` | `battle`) so it survives reload and is shareable.
 * The campaign itself comes from {@link CampaignLayout} via context.
 */
export default function CampaignDashboardPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { campaign } = useCampaignContext();
  const { user } = useAuthStore();
  const isPlayer = user?.role === 'PLAYER';
  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(campaignId!);
  const statusMutation = useSetCampaignStatus();

  const rosterCharacters = useMemo(() => {
    const list = characters ?? [];
    return isPlayer ? list.filter((c: CharacterV2Response) => c.ownerId === user?.id) : list;
  }, [characters, isPlayer, user?.id]);

  const charCounts = useMemo(() => {
    const list = rosterCharacters;
    return {
      total: list.length,
      active: list.filter((c: CharacterV2Response) => c.status === 'ACTIVE').length,
      dead: list.filter((c: CharacterV2Response) => c.status === 'DEAD').length,
      reserve: list.filter((c: CharacterV2Response) => c.status === 'RESERVE').length,
    };
  }, [rosterCharacters]);

  const canCreateCharacter = isPlayer && campaign.status === 'ACTIVE';
  const canManageCampaign = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const handleStatusChange = (status: CampaignStatus) => {
    if (!campaignId) return;
    statusMutation.mutate({ id: campaignId, data: { status } });
  };

  const ctx: DashboardOutletContext = {
    campaignId: campaignId!,
    campaign,
    charsLoading,
    rosterCharacters,
    charCounts,
    isPlayer,
    canCreateCharacter,
    canManageCampaign,
  };

  const navClass = ({ isActive }: { isActive: boolean }) => cn('ao-tab', isActive && 'is-active');

  return (
    <div>
      {/* Description + role actions */}
      {(campaign.description || canCreateCharacter || campaign.isCreator) && (
        <div className={s.header}>
          <div>
            {campaign.description && (
              <p className={cn('ao-italic', s.desc)}>{campaign.description}</p>
            )}
          </div>
          <div className={s.headerActions}>
            {canCreateCharacter && (
              <button
                className="ao-btn ao-btn--primary"
                onClick={() => navigate(`/campaigns/${campaignId}/characters/add`)}
              >
                <Rune kind="plus" size={14} color="currentColor" />
                <span className={s.ml6}>{t('camp.dash.addCharacter')}</span>
              </button>
            )}
            {campaign.isCreator && (
              <StatusSwitch current={campaign.status} onChange={handleStatusChange} />
            )}
          </div>
        </div>
      )}

      {/* Stat blocks */}
      <div className={s.statsRow}>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valGold)}>{campaign.members?.length || 0}</span>
          <span className="ao-stat-label">{t('camp.dash.stat.members')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valArcane)}>
            {charsLoading ? '\u2014' : charCounts.total}
          </span>
          <span className="ao-stat-label">{t('camp.dash.stat.characters')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valGreen)}>
            {charsLoading ? '\u2014' : charCounts.active}
          </span>
          <span className="ao-stat-label">{t('camp.dash.stat.active')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valRed)}>
            {charsLoading ? '\u2014' : charCounts.dead}
          </span>
          <span className="ao-stat-label">{t('camp.dash.stat.dead')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valFaint)}>
            {charsLoading ? '\u2014' : charCounts.reserve}
          </span>
          <span className="ao-stat-label">{t('camp.dash.stat.reserve')}</span>
        </div>
      </div>

      {/* Tab strip — nested routes */}
      <nav className="ao-tabs" aria-label={t('camp.dash.tabs.label')}>
        <NavLink to="" end className={navClass}>{t('camp.dash.tabs.sections')}</NavLink>
        <NavLink to="roster" className={navClass}>{t('camp.dash.tabs.characters')}</NavLink>
        <NavLink to="battle" className={navClass}>{t('battle.tabLabel')}</NavLink>
      </nav>

      <Suspense fallback={<PageFallback />}>
        <Outlet context={ctx} />
      </Suspense>
    </div>
  );
}
