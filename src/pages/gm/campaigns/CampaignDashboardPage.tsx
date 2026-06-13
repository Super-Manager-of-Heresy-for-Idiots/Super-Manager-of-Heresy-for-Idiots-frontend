import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  Bar,
} from '@/components/ordo';
import {
  BackLink,
  CampaignStatusPill,
  CharStatusBadge,
  DrillBlock,
  StatusSwitch,
} from '@/components/campaigns';
import { useAuthStore } from '@/store/authStore';
import { useCampaign, useSetCampaignStatus } from '@/hooks/useCampaigns';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignStatus, CharacterV2Response } from '@/types';
import s from './CampaignDashboardPage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignDashboardPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuthStore();
  const isPlayer = user?.role === 'PLAYER';
  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId!);
  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(campaignId!);
  const statusMutation = useSetCampaignStatus();

  /* ── derived counts ────────────────────────────────────────── */

  const rosterCharacters = useMemo(
    () => {
      const list = characters ?? [];
      return isPlayer ? list.filter((c: CharacterV2Response) => c.ownerId === user?.id) : list;
    },
    [characters, isPlayer, user?.id],
  );

  const charCounts = useMemo(() => {
    const list = rosterCharacters;
    return {
      total: list.length,
      active: list.filter((c: CharacterV2Response) => c.status === 'ACTIVE').length,
      dead: list.filter((c: CharacterV2Response) => c.status === 'DEAD').length,
      reserve: list.filter((c: CharacterV2Response) => c.status === 'RESERVE').length,
    };
  }, [rosterCharacters]);

  const handleStatusChange = (status: CampaignStatus) => {
    if (!campaignId) return;
    statusMutation.mutate({ id: campaignId, data: { status } });
  };

  const openCharacterWizard = () => {
    navigate(`/campaigns/${campaignId}/characters/add`);
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <BackLink to="/campaigns" label={t('camp.backToCampaigns')} className={s.backLink} />
        <div className={cn('ao-panel ao-frame ao-breathe', s.skelHeader)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-ph', s.phW40H24)} />
          <div className={cn('ao-ph', s.phW60H14)} />
        </div>
        <div className={cn('ao-rgrid', s.grid2)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCell)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW50H14)} />
              <div className={cn('ao-ph', s.phW30H14)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !campaign) {
    return (
      <div>
        <BackLink to="/campaigns" label={t('camp.backToCampaigns')} className={s.backLink} />
        <div className={s.errorBlock}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp.dash.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
        </div>
      </div>
    );
  }

  const canCreateCharacter = isPlayer && campaign.status === 'ACTIVE';
  const canManageCampaign = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to="/campaigns" label={t('camp.backToCampaigns')} className={s.backLink} />
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.dash.overline')}</p>
          <div className={s.titleRow}>
            <h3 className="ao-h3">{campaign.name}</h3>
            <CampaignStatusPill status={campaign.status} />
          </div>
          {campaign.description && (
            <p className={cn('ao-italic', s.desc)}>
              {campaign.description}
            </p>
          )}
        </div>
        <div className={s.headerActions}>
          {canCreateCharacter && (
            <button
              className="ao-btn ao-btn--primary"
              onClick={openCharacterWizard}
            >
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp.dash.addCharacter')}</span>
            </button>
          )}
          {campaign.isCreator && (
            <StatusSwitch
              current={campaign.status}
              onChange={handleStatusChange}
            />
          )}
        </div>
      </div>

      {/* Stat blocks */}
      <div className={s.statsRow}>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valGold)}>
            {campaign.members?.length || 0}
          </span>
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

      <OrdoDivider glyph="diamond" />

      {/* DrillBlock grid */}
      <div className={cn('ao-rgrid', s.drillGrid)}>
        <DrillBlock label={t('camp.dash.drill.roster')} glyph="helm" count={charCounts.total} to={`/campaigns/${campaignId}/roster`} />
        {canManageCampaign && (
          <>
            <DrillBlock label={t('camp.dash.drill.npcs')} glyph="sigil-1" to={`/campaigns/${campaignId}/npcs`} />
            <DrillBlock label={t('camp.dash.drill.quests')} glyph="scroll" to={`/campaigns/${campaignId}/quests`} />
            <DrillBlock label={t('camp.dash.drill.locations')} glyph="sigil-3" to={`/campaigns/${campaignId}/locations`} />
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

      <OrdoDivider glyph="diamond" />

      {/* Roster Summary */}
      <OrdoPanel frame padding={0} className={s.rosterPanel}>
        <PanelHeader
          title={t('camp.dash.roster.title')}
          glyph="helm"
          tone="gold"
          sub={isPlayer ? t('camp.dash.roster.subPlayer', { count: charCounts.total }) : t('camp.dash.roster.subGm', { count: charCounts.total })}
        />

        {charsLoading ? (
          <div className={cn('ao-breathe', s.rosterSkel)}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={s.skelRow}>
                <div className={cn('ao-ph', s.phW30H14b)} />
                <div className={cn('ao-ph', s.phW20H14)} />
                <div className={cn('ao-ph', s.phW50H8)} />
              </div>
            ))}
          </div>
        ) : rosterCharacters.length === 0 ? (
          <div className={s.emptyRoster}>
            <p className={cn('ao-italic', s.emptyText)}>
              {isPlayer
                ? t('camp.dash.roster.emptyPlayer')
                : t('camp.dash.roster.emptyGm')}
            </p>
            {canCreateCharacter && (
              <button
                className={cn('ao-btn ao-btn--primary', s.createBtn)}
                onClick={openCharacterWizard}
              >
                <Rune kind="plus" size={14} color="currentColor" />
                <span className={s.ml6}>{t('camp.dash.createCharacter')}</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {rosterCharacters.map((ch: CharacterV2Response) => {
              const className = ch.classLevels?.[0]?.className ?? t('camp.dash.unknownClass');
              return (
                <div key={ch.id} className={s.charRow}>
                  <div className={s.charMain}>
                    <div className={s.charNameRow}>
                      <span className={cn('ao-h5', s.charName)}>{ch.name}</span>
                      <CharStatusBadge status={ch.status ?? ''} />
                      <span className={cn('ao-codex', s.charMeta)}>
                        {className} &middot; LVL {ch.totalLevel}
                      </span>
                      {!isPlayer && (
                        <span className={cn('ao-codex', s.charMeta)}>
                          {t('camp.dash.owner', { name: ch.ownerUsername })}
                        </span>
                      )}
                    </div>
                    <Bar value={ch.currentHp ?? 0} max={ch.maxHp ?? 0} tone="ember" height={5} />
                  </div>
                  <span className={cn('ao-codex', s.charHp)}>
                    {ch.currentHp}/{ch.maxHp} HP
                  </span>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={() => navigate(`/campaigns/${campaignId}/characters/${ch.id}`)}
                    title={t('camp.dash.openManagement')}
                  >
                    <Rune kind="menu" size={10} color="currentColor" />
                    <span className={s.ml4}>{t('camp.dash.manage')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </OrdoPanel>
    </div>
  );
}
