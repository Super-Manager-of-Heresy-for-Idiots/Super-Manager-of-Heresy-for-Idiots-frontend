import { useNavigate } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, Bar } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useDashboardContext } from '../CampaignDashboardPage';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterV2Response } from '@/types';
import s from '../CampaignDashboardPage.module.css';

/** "Characters" tab — roster summary with quick HP read-out + management link. */
export default function DashboardRosterView() {
  const t = useT();
  const navigate = useNavigate();
  const {
    campaignId,
    charsLoading,
    rosterCharacters,
    charCounts,
    isPlayer,
    canCreateCharacter,
  } = useDashboardContext();

  return (
    <OrdoPanel frame padding={0} className={s.rosterPanel}>
      <PanelHeader
        title={t('camp.dash.roster.title')}
        glyph="helm"
        tone="gold"
        sub={
          isPlayer
            ? t('camp.dash.roster.subPlayer', { count: charCounts.total })
            : t('camp.dash.roster.subGm', { count: charCounts.total })
        }
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
            {isPlayer ? t('camp.dash.roster.emptyPlayer') : t('camp.dash.roster.emptyGm')}
          </p>
          {canCreateCharacter && (
            <button
              className={cn('ao-btn ao-btn--primary', s.createBtn)}
              onClick={() => navigate(`/campaigns/${campaignId}/characters/add`)}
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
  );
}
