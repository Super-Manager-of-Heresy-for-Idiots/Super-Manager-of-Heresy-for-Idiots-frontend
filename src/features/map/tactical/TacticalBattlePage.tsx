/**
 * Standalone tactical battle route — a thin shell around {@link TacticalWorkspace}
 * for deep links: `/campaigns/:campaignId/battles/:battleId/tactical?session=`.
 *
 * The unified бой+карта UI primarily lives embedded in the campaign "Бой" tab
 * (see DashboardBattleView); this route renders the same workspace for an explicit
 * battle id so shared/bookmarked links keep working. The `session` query param
 * carries the linked map session (no first-class Battle↔MapSession link yet); with
 * none, the workspace still renders and offers to attach a map.
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useBattle } from '@/hooks/useBattles';
import { useBattleMapSession } from '../hooks';
import { TacticalWorkspace } from './workspace/TacticalWorkspace';
import s from './TacticalBattlePage.module.css';

export default function TacticalBattlePage() {
  const t = useT();
  const { campaignId = '', battleId = '' } = useParams<{ campaignId: string; battleId: string }>();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');

  const user = useAuthStore((st) => st.user);
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const { data: battle, isLoading, error } = useBattle(campaignId, battleId);
  // Fall back to the battle's persisted map-session link when no `?session=` is given.
  const { data: linkedSession } = useBattleMapSession(battleId || undefined);
  const mapSessionId = sessionParam ?? linkedSession?.id ?? null;

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-breathe', s.centerStatus)}>
        <span className={s.statusText}>{t('tactical.top.loading')}</span>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className={s.panelEmpty}>
        <p className="ao-italic">{t('tactical.left.loadError')}</p>
        <Link className="ao-btn ao-btn--sm" to={`/campaigns/${campaignId}/battle`}>
          {t('battle.tabLabel')}
        </Link>
      </div>
    );
  }

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
