import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DrillBlock, StatusSwitch } from '@/components/campaigns';
import { useCampaignContext } from '@/components/layout/CampaignLayout';
import { CAMPAIGN_TILE_GROUPS, visibleSections } from '@/config/campaignSections';
import { useCampaignRole } from '@/hooks/useCampaignRole';
import { useSetCampaignStatus } from '@/hooks/useCampaigns';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignStatus, CharacterV2Response } from '@/types';
import { RosterPanel } from './dashboard/RosterPanel';
import s from './CampaignDashboardPage.module.css';

/**
 * Campaign overview — the single landing screen.
 *
 * Everything the campaign holds is one click away from here: vitals, the party
 * roster, and the section tiles grouped by purpose. The old Sections /
 * Characters / Battle sub-tab strip is gone — battle moved to the campaign tab
 * strip and the other two are simply stacked, so the page carries one level of
 * navigation instead of two.
 */
export default function CampaignDashboardPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { campaign } = useCampaignContext();
  const { isGm, isPlayer, userId } = useCampaignRole();
  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(campaignId!);
  const statusMutation = useSetCampaignStatus();

  const rosterCharacters = useMemo(() => {
    const list = characters ?? [];
    return isPlayer ? list.filter((c: CharacterV2Response) => c.ownerId === userId) : list;
  }, [characters, isPlayer, userId]);

  const charCounts = useMemo(() => {
    const list = rosterCharacters;
    return {
      total: list.length,
      active: list.filter((c: CharacterV2Response) => c.status === 'ACTIVE').length,
      dead: list.filter((c: CharacterV2Response) => c.status === 'DEAD').length,
      reserve: list.filter((c: CharacterV2Response) => c.status === 'RESERVE').length,
    };
  }, [rosterCharacters]);

  const groups = useMemo(
    () =>
      visibleSections(CAMPAIGN_TILE_GROUPS, isGm)
        .map((group) => ({ ...group, sections: visibleSections(group.sections, isGm) }))
        .filter((group) => group.sections.length > 0),
    [isGm],
  );

  const canCreateCharacter = isPlayer && campaign.status === 'ACTIVE';

  const handleStatusChange = (status: CampaignStatus) => {
    if (!campaignId) return;
    statusMutation.mutate({ id: campaignId, data: { status } });
  };

  return (
    <div>
      {(campaign.description || campaign.isCreator) && (
        <div className={s.header}>
          <div>
            {campaign.description && (
              <p className={cn('ao-italic', s.desc)}>{campaign.description}</p>
            )}
          </div>
          {campaign.isCreator && (
            <div className={s.headerActions}>
              <StatusSwitch current={campaign.status} onChange={handleStatusChange} />
            </div>
          )}
        </div>
      )}

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

      <RosterPanel
        campaignId={campaignId!}
        loading={charsLoading}
        characters={rosterCharacters}
        total={charCounts.total}
        isPlayer={isPlayer}
        canCreateCharacter={canCreateCharacter}
      />

      {groups.map((group) => (
        <section key={group.titleKey} className={s.group}>
          <p className={cn('ao-overline', s.groupTitle)}>{t(group.titleKey)}</p>
          <div className={cn('ao-rgrid', s.drillGrid)}>
            {group.sections.map((section) => (
              <DrillBlock
                key={section.to}
                label={t(section.labelKey)}
                glyph={section.glyph}
                icon={section.icon}
                count={section.count === 'members' ? campaign.members?.length ?? 0 : undefined}
                to={`/campaigns/${campaignId}/${section.to}`}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
