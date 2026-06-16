import { BattlePanel } from '../battle/BattlePanel';
import { useDashboardContext } from '../CampaignDashboardPage';

/** "Battle" tab — role/state-aware combat panel. */
export default function DashboardBattleView() {
  const { campaignId } = useDashboardContext();
  return <BattlePanel campaignId={campaignId} />;
}
