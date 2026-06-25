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
        count={campaign.members?.length || 0}
        to={`/campaigns/${campaignId}/members`}
      />
      {canManageCampaign && (
        <>
          <DrillBlock label={t('camp.dash.drill.npcs')} glyph="sigil-1" to={`/campaigns/${campaignId}/npcs`} />
          <DrillBlock label={t('camp.dash.drill.quests')} glyph="scroll" to={`/campaigns/${campaignId}/quests`} />
          <DrillBlock label={t('camp.dash.drill.locations')} glyph="sigil-3" to={`/campaigns/${campaignId}/locations`} />
          <DrillBlock label={t('camp.dash.drill.maps')} glyph="sigil-2" to={`/campaigns/${campaignId}/maps`} />
        </>
      )}
      <DrillBlock label={t('camp.dash.drill.bestiary')} glyph="sword" to={`/campaigns/${campaignId}/bestiary`} />
      <DrillBlock label={t('camp.dash.drill.storage')} glyph="sword" to={`/campaigns/${campaignId}/storage`} />
      <DrillBlock label={t('camp.dash.drill.invite')} glyph="cross-pat" to={`/campaigns/${campaignId}/invite`} />
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.notes')} glyph="lock" to={`/campaigns/${campaignId}/notes`} />
      )}
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.grantXp')} glyph="flame" to={`/campaigns/${campaignId}/xp`} />
      )}
      {canManageCampaign && (
        <DrillBlock label={t('camp.dash.drill.balances')} glyph="coin" to={`/campaigns/${campaignId}/wallet`} />
      )}
    </div>
  );
}
