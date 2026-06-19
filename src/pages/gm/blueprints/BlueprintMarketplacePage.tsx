import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdoPanel, Rune, OrdoDivider, EmptyVault } from '@/components/ordo';
import { useBlueprintMarketplace } from '@/hooks/useCampaignBlueprints';
import { useUniverses } from '@/hooks/useUniverses';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { CampaignBlueprintResponse, CampaignBlueprintSort } from '@/types';
import s from './blueprints.module.css';

export default function BlueprintMarketplacePage() {
  const t = useT();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [universe, setUniverse] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<CampaignBlueprintSort>('downloads');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: universes } = useUniverses();
  const { data, isLoading, error, refetch } = useBlueprintMarketplace({
    search: debouncedSearch || undefined,
    universe: universe || undefined,
    sort,
    page,
    size: 12,
  });

  const packages: CampaignBlueprintResponse[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  if (isLoading && page === 0) {
    return (
      <div>
        <div className={s.headerLg}>
          <p className={cn('ao-overline', s.overline)}>{t('bp.market.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{t('bp.market.heading')}</h3>
        </div>
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.skelLine1)} />
              <div className={cn('ao-ph', s.skelLine2)} />
              <div className={cn('ao-ph', s.skelLine3)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>{t('bp.market.error')}</p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={s.header}>
        <p className={cn('ao-overline', s.overline)}>{t('bp.market.overline')}</p>
        <h3 className={cn('ao-h3', s.heading)}>{t('bp.market.heading')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>{t('bp.market.subtitle')}</p>
      </div>

      <div className={s.barRow}>
        <div className={s.searchBox}>
          <Rune kind="search" size={14} color="var(--ink-faint)" />
          <input
            className={s.searchInput}
            placeholder={t('bp.market.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('bp.market.searchPlaceholder')}
          />
        </div>

        <select
          className={cn('ao-input', s.filterSelect)}
          value={universe}
          onChange={(e) => { setUniverse(e.target.value); setPage(0); }}
          aria-label={t('bp.detail.universe')}
        >
          <option value="">{t('bp.market.filterAll')}</option>
          {(universes ?? []).map((u) => (
            <option key={u.id} value={u.slug}>{u.name}</option>
          ))}
        </select>

        <div className={s.sortGroup}>
          {(['downloads', 'newest', 'oldest'] as const).map((opt, i) => {
            const active = sort === opt;
            return (
              <button
                key={opt}
                onClick={() => { setSort(opt); setPage(0); }}
                className={cn(s.sortBtn, active && s.active, i > 0 && s.divided)}
              >
                {opt === 'downloads' ? t('bp.market.sortPopular') : opt === 'newest' ? t('bp.market.sortNewest') : t('bp.market.sortOldest')}
              </button>
            );
          })}
        </div>
      </div>

      <OrdoDivider glyph="diamond" />

      {packages.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title={t('bp.market.emptyTitle')}
          body={debouncedSearch || universe ? t('bp.market.emptySearch') : t('bp.market.emptyAll')}
        />
      ) : (
        <>
          <div className={cn('ao-rgrid', s.grid, s.gridTop)}>
            {packages.map((bp) => (
              <OrdoPanel
                key={bp.id}
                frame
                padding={0}
                className={cn(s.card, s.cardClickable)}
              >
                <div
                  className={s.cardBody}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/blueprints/marketplace/${bp.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/blueprints/marketplace/${bp.id}`); }}
                >
                  <div className={s.cardHead}>
                    <Rune kind="hex" size={22} color="var(--gold)" />
                    <div className={s.cardTitleWrap}>
                      <h5 className={cn('ao-h5', s.cardTitle)}>{bp.title}</h5>
                      <div className={cn('ao-codex', s.cardBy)}>
                        {t('bp.market.by', { author: bp.authorUsername })}
                      </div>
                    </div>
                  </div>

                  {bp.loreDescription && (
                    <p className={cn('ao-italic', s.cardDesc)}>{bp.loreDescription}</p>
                  )}

                  <div className={s.badgeRow}>
                    <span className={s.uniBadge}>
                      <Rune kind="cir-dot" size={9} color="var(--arcane)" /> {bp.universeName}
                    </span>
                    {bp.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="ao-chip ao-chip--rune">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className={s.cardFoot}>
                  <span className={cn('ao-codex', s.footStat)}>
                    <Rune kind="chev-d" size={9} color="var(--ink-faint)" /> {t('bp.market.downloads', { count: bp.downloadCount })}
                  </span>
                  <span className={cn('ao-codex', s.footVersion)}>v{bp.version}</span>
                </div>
              </OrdoPanel>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={s.pager}>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Rune kind="chev-l" size={12} color="currentColor" />
                <span className={s.btnLabelL}>{t('bp.market.previous')}</span>
              </button>

              <span className={cn('ao-codex', s.pagerInfo)}>
                {t('bp.market.pageOf', { page: page + 1, total: totalPages })}
              </span>

              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <span className={s.btnLabelR}>{t('bp.market.next')}</span>
                <Rune kind="chev-r" size={12} color="currentColor" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
