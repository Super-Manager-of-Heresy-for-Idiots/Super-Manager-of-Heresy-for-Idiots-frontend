import { DrillBlock } from '@/components/campaigns';
import { useDashboardContext } from '../CampaignDashboardPage';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from '../CampaignDashboardPage.module.css';

/** "Sections" tab — drill tiles into the campaign's sub-sections. */
export default function DashboardSectionsView() {
  const t = useT();
  const { campaignId, campaign, canManageCampaign } = useDashboardContext();

  return (
    <div className={cn('ao-rgrid', s.drillGrid)}>
      <DrillBlock
        label={t('camp.dash.drill.roster')}
        glyph="helm"
        icon="character-in-campaign"
        count={campaign.members?.length || 0}
        to={`/campaigns/${campaignId}/members`}
      />
      {canManageCampaign && (
        <>
          <DrillBlock label={t('camp.dash.drill.npcs')} glyph="sigil-1" icon="npc" to={`/campaigns/${campaignId}/npcs`} />
          <DrillBlock label={t('camp.dash.drill.quests')} glyph="scroll" icon="quest" to={`/campaigns/${campaignId}/quests`} />
          <DrillBlock label={t('camp.dash.drill.locations')} glyph="sigil-3" icon="location" to={`/campaigns/${campaignId}/locations`} />
          <DrillBlock label={t('camp.dash.drill.maps')} glyph="sigil-2" icon="map" to={`/campaigns/${campaignId}/maps`} />
        </>
      )}
      <DrillBlock label={t('camp.dash.drill.bestiary')} glyph="sword" icon="bestiary" to={`/campaigns/${campaignId}/bestiary`} />
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.homebrew')} glyph="scroll" to={`/campaigns/${campaignId}/homebrew`} />
      )}
      <DrillBlock label={t('camp.dash.drill.storage')} glyph="sword" icon="shared-storage" to={`/campaigns/${campaignId}/storage`} />
      <DrillBlock label={t('camp.dash.drill.invite')} glyph="cross-pat" icon="friend-request" to={`/campaigns/${campaignId}/invite`} />
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.notes')} glyph="lock" icon="session-note" to={`/campaigns/${campaignId}/notes`} />
      )}
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.grantXp')} glyph="flame" icon="reward-xp" to={`/campaigns/${campaignId}/xp`} />
      )}
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.balances')} glyph="coin" icon="wallet" to={`/campaigns/${campaignId}/wallet`} />
      )}
    </div>
  );
}
