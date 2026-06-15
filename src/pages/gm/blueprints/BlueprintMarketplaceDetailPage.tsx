import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrdoPanel, Rune, OrdoDivider, EmptyVault } from '@/components/ordo';
import { useBlueprintMarketplaceDetail, useForkBlueprint } from '@/hooks/useCampaignBlueprints';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './blueprints.module.css';

type TabId = 'npcs' | 'quests' | 'locations' | 'homebrew' | 'characters';

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'npcs', labelKey: 'bp.tab.npcs' },
  { id: 'quests', labelKey: 'bp.tab.quests' },
  { id: 'locations', labelKey: 'bp.tab.locations' },
  { id: 'homebrew', labelKey: 'bp.tab.homebrew' },
  { id: 'characters', labelKey: 'bp.tab.characters' },
];

export default function BlueprintMarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const navigate = useNavigate();
  const role = useAuthStore((st) => st.user?.role);
  const username = useAuthStore((st) => st.user?.username);
  const [tab, setTab] = useState<TabId>('npcs');

  const { data: bp, isLoading, error, refetch } = useBlueprintMarketplaceDetail(id);
  const forkMutation = useForkBlueprint();

  if (isLoading) {
    return (
      <div>
        <div className={cn('ao-ph', s.skelLine1)} />
        <div className={cn('ao-ph', s.skelLine3)} />
      </div>
    );
  }

  if (error || !bp) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>{t('bp.detail.error')}</p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  const isAuthor = !!username && username === bp.authorUsername;
  const canFork = role !== 'PLAYER' && (bp.allowForks || isAuthor);

  const counts: Record<TabId, number> = {
    npcs: bp.npcs?.length ?? 0,
    quests: bp.quests?.length ?? 0,
    locations: bp.locations?.length ?? 0,
    homebrew: bp.homebrew?.length ?? 0,
    characters: bp.preBuiltCharacters?.length ?? 0,
  };

  const handleFork = () => {
    forkMutation.mutate(bp.id, { onSuccess: () => navigate('/blueprints/my') });
  };

  return (
    <div>
      <button className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.backBtn)} onClick={() => navigate('/blueprints/marketplace')}>
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span className={s.btnLabelL}>{t('bp.detail.back')}</span>
      </button>

      <div className={s.detailHead}>
        <Rune kind="hex" size={32} color="var(--gold)" />
        <div className={s.detailTitleWrap}>
          <h3 className="ao-h3">{bp.title}</h3>
          <div className={s.detailMeta}>
            <span className={s.uniBadge}>
              <Rune kind="cir-dot" size={9} color="var(--arcane)" /> {bp.universeName}
            </span>
            <span className={cn('ao-codex', s.footStat)}>{t('bp.market.by', { author: bp.authorUsername })}</span>
            <span className={cn('ao-codex', s.footVersion)}>v{bp.version}</span>
            <span className={cn('ao-codex', s.footStat)}>
              <Rune kind="chev-d" size={9} color="var(--ink-faint)" /> {t('bp.market.downloads', { count: bp.downloadCount })}
            </span>
          </div>
        </div>
        <div className={s.detailActions}>
          {canFork ? (
            <button className="ao-btn ao-btn--primary" onClick={handleFork} disabled={forkMutation.isPending}>
              <Rune kind="plus" size={12} color="currentColor" />
              <span className={s.btnLabelL}>{t('bp.detail.addToMine')}</span>
            </button>
          ) : role !== 'PLAYER' && !bp.allowForks ? (
            <span className={cn('ao-codex', s.hiddenTag)}>{t('bp.detail.forkDisabled')}</span>
          ) : null}
        </div>
      </div>

      <OrdoDivider glyph="diamond" />

      <OrdoPanel frame padding={20}>
        <span className="ao-frame-c" />
        <p className={cn('ao-overline', s.overline, s.sectionTitle)}>{t('bp.detail.loreTitle')}</p>
        <p className={s.loreText}>{bp.loreDescription || t('bp.detail.noLore')}</p>
      </OrdoPanel>

      <p className={cn('ao-overline', s.overline, s.contentOverline)}>{t('bp.detail.contentOverline')}</p>
      <div className={s.tabBar}>
        {TABS.map((tb) => (
          <button
            key={tb.id}
            className={cn('ao-tab', tab === tb.id && 'is-active')}
            onClick={() => setTab(tb.id)}
          >
            {t(tb.labelKey)}<span className={s.tabCount}>{counts[tb.id]}</span>
          </button>
        ))}
      </div>

      <div className={s.tabPanel}>
        {tab === 'npcs' && (
          <ContentList
            empty={counts.npcs === 0}
            rows={(bp.npcs ?? []).map((n) => ({ id: n.id, title: n.name, sub: n.publicDescription }))}
          />
        )}
        {tab === 'quests' && (
          <ContentList
            empty={counts.quests === 0}
            rows={(bp.quests ?? []).map((q) => ({
              id: q.id,
              title: q.title,
              sub: q.description,
              badge: t(`bp.questStatus.${q.status}`),
            }))}
          />
        )}
        {tab === 'locations' && (
          <ContentList
            empty={counts.locations === 0}
            rows={(bp.locations ?? []).map((l) => ({ id: l.id, title: l.name, sub: l.description }))}
          />
        )}
        {tab === 'homebrew' && (
          <ContentList
            empty={counts.homebrew === 0}
            rows={(bp.homebrew ?? []).map((h) => ({
              id: h.packageId,
              title: h.title,
              sub: h.pinnedVersion ? `v${h.pinnedVersion}` : undefined,
            }))}
          />
        )}
        {tab === 'characters' && (
          <ContentList
            empty={counts.characters === 0}
            rows={(bp.preBuiltCharacters ?? []).map((c) => ({
              id: c.id,
              title: c.name,
              sub: c.ownerUsername,
            }))}
          />
        )}
      </div>
    </div>
  );
}

/* ── tiny read-only list ───────────────────────────────────── */

interface Row {
  id: string;
  title: string;
  sub?: string;
  badge?: string;
}

function ContentList({ rows, empty }: { rows: Row[]; empty: boolean }) {
  const t = useT();
  if (empty) {
    return <EmptyVault glyph="scroll" title={t('bp.detail.emptyTab')} />;
  }
  return (
    <div className={s.rowList}>
      {rows.map((r) => (
        <div key={r.id} className={s.row}>
          <div className={s.rowMain}>
            <div className={s.rowTitle}>{r.title}</div>
            {r.sub && <div className={s.rowSub}>{r.sub}</div>}
          </div>
          {r.badge && <span className={s.statusChip}>{r.badge}</span>}
        </div>
      ))}
    </div>
  );
}
