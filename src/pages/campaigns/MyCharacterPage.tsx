import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CharStatusBadge } from '@/components/campaigns';
import { Bar, OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useCampaignRole } from '@/hooks/useCampaignRole';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterV2Response } from '@/types';
import s from './MyCharacterPage.module.css';

/**
 * "My Hero" tab — the player's shortcut into their own character.
 *
 * With a single character (the common case) it forwards straight to the folio,
 * which is why the tab costs one click instead of the four the old dashboard →
 * roster → hub → sheet path did. Only a player juggling several characters ever
 * sees this picker.
 */
export default function MyCharacterPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { userId } = useCampaignRole();
  const { data: characters, isLoading } = useCampaignCharacters(campaignId!);

  const mine = useMemo(
    () => (characters ?? []).filter((c: CharacterV2Response) => c.ownerId === userId),
    [characters, userId],
  );

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
        <span className="ao-frame-c" />
        <div className="ao-ph" />
      </div>
    );
  }

  if (mine.length === 1) {
    return <Navigate to={`/campaigns/${campaignId}/characters/${mine[0].id}`} replace />;
  }

  if (mine.length === 0) {
    return (
      <div className={s.empty}>
        <p className={cn('ao-italic', s.emptyText)}>{t('camp.my.empty')}</p>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => navigate(`/campaigns/${campaignId}/characters/add`)}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp.dash.addCharacter')}</span>
        </button>
      </div>
    );
  }

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp.my.title')} glyph="helm" tone="gold" sub={t('camp.my.sub')} />
      <div>
        {mine.map((ch: CharacterV2Response) => (
          <button
            key={ch.id}
            className={s.row}
            onClick={() => navigate(`/campaigns/${campaignId}/characters/${ch.id}`)}
          >
            <span className={s.main}>
              <span className={s.nameRow}>
                <span className={cn('ao-h5', s.name)}>{ch.name}</span>
                <CharStatusBadge status={ch.status ?? ''} />
                <span className={cn('ao-codex', s.meta)}>
                  {ch.classLevels?.[0]?.className ?? t('camp.dash.unknownClass')} &middot; LVL {ch.totalLevel}
                </span>
              </span>
              <Bar value={ch.currentHp ?? 0} max={ch.maxHp ?? 0} tone="ember" height={5} />
            </span>
            <Rune kind="chev-r" size={14} color="var(--ink-faint)" />
          </button>
        ))}
      </div>
    </OrdoPanel>
  );
}
