import { useState, useEffect } from 'react';
import {
  OrdoPanel,
  Rune,
  OrdoDivider,
  EmptyVault,
} from '@/components/ordo';
import { VersionSeal } from '@/components/homebrew/VersionSeal';
import { RatingControl } from '@/components/homebrew/RatingControl';
import { ContentPills } from '@/components/homebrew/ContentPills';
import { HBTag } from '@/components/homebrew/HBTag';
import { useMarketplace } from '@/hooks/useHomebrew';
import { useRateHomebrew } from '@/hooks/useHomebrewCampaign';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { HomebrewPackageResponse } from '@/types';
import s from './MarketplacePage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<'downloads' | 'newest' | 'oldest'>('downloads');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: marketplaceData, isLoading, error, refetch } = useMarketplace({
    search: debouncedSearch || undefined,
    sort,
    page,
    size: 12,
  });

  const rateMutation = useRateHomebrew();

  const packages: HomebrewPackageResponse[] = marketplaceData?.content ?? [];
  const totalPages = marketplaceData?.totalPages ?? 0;

  const handleRate = (packageId: string, rating: 1 | -1) => {
    rateMutation.mutate({ packageId, data: { rating } });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading && page === 0) {
    return (
      <div>
        <div className={s.headerBlockLg}>
          <p className={cn('ao-overline', s.overline)}>{t('hb.market.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{t('hb.market.heading')}</h3>
        </div>
        <div className={cn('ao-rgrid', s.grid3)}>
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

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('hb.market.error')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.headerBlock}>
        <p className={cn('ao-overline', s.overline)}>{t('hb.market.overline')}</p>
        <h3 className={cn('ao-h3', s.heading)}>{t('hb.market.heading')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {t('hb.market.subtitle')}
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className={s.barRow}>
        {/* Search */}
        <div className={s.searchBox}>
          <Rune kind="search" size={14} color="var(--ink-faint)" />
          <input
            className={s.searchInput}
            placeholder={t('hb.market.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort buttons */}
        <div className={s.sortGroup}>
          {(['downloads', 'newest', 'oldest'] as const).map((opt, i) => {
            const active = sort === opt;
            return (
              <button
                key={opt}
                onClick={() => { setSort(opt); setPage(0); }}
                className={cn(s.sortBtn, active && s.active, i > 0 && s.divided)}
              >
                {opt === 'downloads' ? t('hb.market.sortPopular') : opt === 'newest' ? t('hb.market.sortNewest') : t('hb.market.sortOldest')}
              </button>
            );
          })}
        </div>
      </div>

      <OrdoDivider glyph="diamond" />

      {/* Package Grid */}
      {packages.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title={t('hb.market.emptyTitle')}
          body={debouncedSearch ? t('hb.market.emptySearch') : t('hb.market.emptyAll')}
        />
      ) : (
        <>
          <div className={cn('ao-rgrid', s.grid3, s.gridTop)}>
            {packages.map((pkg: HomebrewPackageResponse) => {
              const isArchived = pkg.status === 'UNPUBLISHED' || pkg.isDeleted;

              return (
                <OrdoPanel
                  key={pkg.id}
                  frame
                  padding={0}
                  className={cn(s.card, isArchived && s.archived)}
                >
                  <div className={s.cardBody}>
                    {/* Version seal + title */}
                    <div className={s.cardHead}>
                      <VersionSeal version={pkg.version} size={40} />
                      <div className={s.cardTitleWrap}>
                        <h5 className={cn('ao-h5', s.cardTitle)}>
                          {pkg.title}
                        </h5>
                        <div className={cn('ao-codex', s.cardBy)}>
                          {t('hb.market.by', { author: pkg.authorUsername })}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p className={cn('ao-italic', s.cardDesc)}>
                        {pkg.description}
                      </p>
                    )}

                    {/* Rating Control */}
                    <div className={s.ratingWrap}>
                      <RatingControl
                        likes={pkg.downloadCount}
                        dislikes={0}
                        size="sm"
                        onRate={(r) => handleRate(pkg.id, r)}
                      />
                    </div>

                    {/* Content Pills */}
                    <ContentPills
                      items={pkg.contentSummary.itemTypeCount}
                      classes={pkg.contentSummary.classCount}
                      skills={pkg.contentSummary.skillCount}
                      feats={pkg.contentSummary.featCount}
                      compact
                    />

                    {/* Tags */}
                    {pkg.tags && pkg.tags.length > 0 && (
                      <div className={s.tagsRow}>
                        {pkg.tags.map((tag) => (
                          <HBTag key={tag}>{tag}</HBTag>
                        ))}
                      </div>
                    )}

                    {/* Archived indicator */}
                    {isArchived && (
                      <div className={s.archivedTag}>
                        <Rune kind="lock" size={9} color="var(--ink-faint)" />
                        <span className={cn('ao-overline', s.archivedLabel)}>
                          {pkg.isDeleted ? t('hb.market.deleted') : t('hb.market.unpublished')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer with stats */}
                  <div className={s.cardFoot}>
                    <span className={cn('ao-codex', s.footStat)}>
                      <Rune kind="arrow-d" size={9} color="var(--ink-faint)" /> {t('hb.market.downloads', { count: pkg.downloadCount })}
                    </span>
                    <span className={cn('ao-codex', s.footVersion)}>
                      v{pkg.version}
                    </span>
                  </div>
                </OrdoPanel>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={s.pager}>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Rune kind="chev-l" size={12} color="currentColor" />
                <span className={s.btnLabelL}>{t('hb.market.previous')}</span>
              </button>

              <span className={cn('ao-codex', s.pagerInfo)}>
                {t('hb.market.pageOf', { page: page + 1, total: totalPages })}
              </span>

              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <span className={s.btnLabelR}>{t('hb.market.next')}</span>
                <Rune kind="chev-r" size={12} color="currentColor" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
