import { useNavigate } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, Bar } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterV2Response } from '@/types';
import s from '../CampaignDashboardPage.module.css';

interface RosterPanelProps {
  campaignId: string;
  loading: boolean;
  characters: CharacterV2Response[];
  total: number;
  isPlayer: boolean;
  canCreateCharacter: boolean;
}

/** Party roster with quick HP read-out — rendered inline on the Overview. */
export function RosterPanel({
  campaignId,
  loading,
  characters,
  total,
  isPlayer,
  canCreateCharacter,
}: RosterPanelProps) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <OrdoPanel frame padding={0} className={s.rosterPanel}>
      <PanelHeader
        title={t('camp.dash.roster.title')}
        glyph="helm"
        tone="gold"
        sub={
          isPlayer
            ? t('camp.dash.roster.subPlayer', { count: total })
            : t('camp.dash.roster.subGm', { count: total })
        }
        right={
          canCreateCharacter ? (
            <button
              className="ao-btn ao-btn--primary ao-btn--sm"
              onClick={() => navigate(`/campaigns/${campaignId}/characters/add`)}
            >
              <Rune kind="plus" size={12} color="currentColor" />
              <span className={s.ml6}>{t('camp.dash.addCharacter')}</span>
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className={cn('ao-breathe', s.rosterSkel)}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={s.skelRow}>
              <div className={cn('ao-ph', s.phW30H14b)} />
              <div className={cn('ao-ph', s.phW20H14)} />
              <div className={cn('ao-ph', s.phW50H8)} />
            </div>
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className={s.emptyRoster}>
          <p className={cn('ao-italic', s.emptyText)}>
            {isPlayer ? t('camp.dash.roster.emptyPlayer') : t('camp.dash.roster.emptyGm')}
          </p>
        </div>
      ) : (
        <div>
          {characters.map((ch) => (
            <button
              key={ch.id}
              className={s.charRow}
              onClick={() => navigate(`/campaigns/${campaignId}/characters/${ch.id}`)}
              title={t('camp.dash.openManagement')}
            >
              <span className={s.charMain}>
                <span className={s.charNameRow}>
                  <span className={cn('ao-h5', s.charName)}>{ch.name}</span>
                  <CharStatusBadge status={ch.status ?? ''} />
                  <span className={cn('ao-codex', s.charMeta)}>
                    {ch.classLevels?.[0]?.className ?? t('camp.dash.unknownClass')} &middot; LVL {ch.totalLevel}
                  </span>
                  {!isPlayer && (
                    <span className={cn('ao-codex', s.charMeta)}>
                      {t('camp.dash.owner', { name: ch.ownerUsername })}
                    </span>
                  )}
                </span>
                <Bar value={ch.currentHp ?? 0} max={ch.maxHp ?? 0} tone="ember" height={5} />
              </span>
              <span className={cn('ao-codex', s.charHp)}>
                {ch.currentHp}/{ch.maxHp} HP
              </span>
              <Rune kind="chev-r" size={13} color="var(--ink-faint)" />
            </button>
          ))}
        </div>
      )}
    </OrdoPanel>
  );
}
