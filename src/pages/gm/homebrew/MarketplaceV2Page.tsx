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
import type { HomebrewPackageResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function MarketplaceV2Page() {
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
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Exchange</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Marketplace</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 220 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '60%', height: 16, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '40%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The marketplace could not be reached. The trade routes remain severed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Exchange</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Marketplace</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
          Browse community-published doctrines with ratings, content details, and version seals.
        </p>
      </div>

      {/* Search + Sort bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            border: '1px solid var(--rule)',
            background: 'var(--abyss)',
            flex: '1 1 240px',
          }}
        >
          <Rune kind="search" size={14} color="var(--ink-faint)" />
          <input
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
            }}
            placeholder="Search doctrines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort buttons */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--rule)' }}>
          {(['downloads', 'newest', 'oldest'] as const).map((s, i) => {
            const active = sort === s;
            return (
              <button
                key={s}
                onClick={() => { setSort(s); setPage(0); }}
                style={{
                  padding: '8px 14px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: active ? 'rgba(176,141,78,0.12)' : 'transparent',
                  color: active ? 'var(--gold-pale)' : 'var(--ink-faint)',
                  border: 'none',
                  borderLeft: i ? '1px solid var(--hairline)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {s === 'downloads' ? 'Popular' : s.charAt(0).toUpperCase() + s.slice(1)}
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
          title="No Doctrines Found"
          body={debouncedSearch ? 'No doctrines match thy inquiry. Try different terms.' : 'The marketplace stands empty. No doctrines have been published yet.'}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
            {packages.map((pkg: HomebrewPackageResponse) => {
              const isArchived = pkg.status === 'UNPUBLISHED' || pkg.isDeleted;

              return (
                <OrdoPanel
                  key={pkg.id}
                  frame
                  padding={0}
                  style={{
                    opacity: isArchived ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <div style={{ padding: 18 }}>
                    {/* Version seal + title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <VersionSeal version={pkg.version} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 className="ao-h5" style={{ color: 'var(--ink-bright)', margin: 0 }}>
                          {pkg.title}
                        </h5>
                        <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>
                          by {pkg.authorUsername}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p
                        className="ao-italic"
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-quiet)',
                          lineHeight: 1.5,
                          marginBottom: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}
                      >
                        {pkg.description}
                      </p>
                    )}

                    {/* Rating Control */}
                    <div style={{ marginBottom: 12 }}>
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {pkg.tags.map((tag) => (
                          <HBTag key={tag}>{tag}</HBTag>
                        ))}
                      </div>
                    )}

                    {/* Archived indicator */}
                    {isArchived && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: '4px 8px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--hairline)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Rune kind="lock" size={9} color="var(--ink-faint)" />
                        <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>
                          {pkg.isDeleted ? 'DELETED' : 'UNPUBLISHED'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer with stats */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 18px',
                      borderTop: '1px solid var(--hairline)',
                      background: 'var(--abyss)',
                    }}
                  >
                    <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                      <Rune kind="arrow-d" size={9} color="var(--ink-faint)" /> {pkg.downloadCount} downloads
                    </span>
                    <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-ghost)' }}>
                      v{pkg.version}
                    </span>
                  </div>
                </OrdoPanel>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Rune kind="chev-l" size={12} color="currentColor" />
                <span style={{ marginLeft: 4 }}>Previous</span>
              </button>

              <span className="ao-codex" style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--ink-quiet)', padding: '0 12px' }}>
                Page {page + 1} of {totalPages}
              </span>

              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <span style={{ marginRight: 4 }}>Next</span>
                <Rune kind="chev-r" size={12} color="currentColor" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
