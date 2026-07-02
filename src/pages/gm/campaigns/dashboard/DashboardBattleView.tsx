import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCampaignBattles } from '@/hooks/useBattles';
import { useBattleMapSession } from '@/features/map/hooks';
import { TacticalWorkspace } from '@/features/map/tactical/workspace/TacticalWorkspace';
import { isCampaignGmOrAdmin } from '@/lib/campaignAccess';
import { BattlePanel } from '../battle/BattlePanel';
import { useDashboardContext } from '../CampaignDashboardPage';

/**
 * "Бой" tab — the unified бой+карта workspace. A live battle (assembling or active)
 * renders the tactical workspace (roster · map · tools); the linked map session, if
 * any, rides on the `?session=` query param. With no battle, the neutral
 * empty/create panel is shown (GM can start one there).
 */
export default function DashboardBattleView() {
  const { campaignId, campaign } = useDashboardContext();
  const [params] = useSearchParams();
  const sessionParam = params.get('session');
  const { user } = useAuthStore();
  const isGm = isCampaignGmOrAdmin(user, campaign);

  const { data: battles, isLoading } = useCampaignBattles(campaignId);
  const battle = useMemo(() => {
    const list = battles ?? [];
    return list.find((b) => b.status === 'ACTIVE') ?? list.find((b) => b.status === 'ASSEMBLING');
  }, [battles]);

  // Hard link: resolve the battle's persisted map session (by externalBattleId) so the
  // same map + state reopens after a long absence — the URL param only overrides it.
  const { data: linkedSession } = useBattleMapSession(battle?.id);
  const mapSessionId = sessionParam ?? linkedSession?.id ?? null;

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe')}>
        <span className="ao-frame-c" />
        <div className="ao-ph" />
      </div>
    );
  }

  // The workspace opens for an active battle (both roles) or for the GM while
  // assembling. Players don't see the assembly board until the battle is live —
  // matching the prior flow, where assembling was GM-only.
  if (battle && (battle.status === 'ACTIVE' || isGm)) {
    return (
      <TacticalWorkspace
        campaignId={campaignId}
        battle={battle}
        mapSessionId={mapSessionId}
        isGm={isGm}
        currentUserId={user?.id ?? null}
      />
    );
  }

  // No live battle (or player waiting on assembly) — neutral empty / create state.
  return <BattlePanel campaignId={campaignId} />;
}
