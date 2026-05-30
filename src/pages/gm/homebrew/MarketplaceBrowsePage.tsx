import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip } from '@/components/ordo';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads, CodexID } from '@/components/homebrew';
import { useMarketplace, useInstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { HomebrewPackageResponse } from '@/types';

export default function MarketplaceBrowsePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'downloads'>('newest');
  const [page, setPage] = useState(0);

  const { data: pageData, isLoading } = useMarketplace({
    search: search || undefined,
    tags: activeTag !== 'all' ? activeTag : undefined,
    sort,
    page,
    size: 6,
  });

  const installMutation = useInstallPackage();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  return (
    <div>
      {/* Heading band */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="ao-overline">Imperial Catalogue · Class IV (Restricted)</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>Forbidden Doctrines</div>
          <div className="ao-italic" style={{ marginTop: 4, maxWidth: 620 }}>
            Sealed compendia inscribed by Game-Masters of the Ordo. Browse only what thy charter permits. Installation grants reference, not ownership.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate('/gm/homebrew/installed')}>
            <Rune kind="book" size={11} /> Instated
          </button>
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate('/gm/homebrew/my')}>
            <Rune kind="scroll" size={11} /> My Doctrines
          </button>
          <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
            <Rune kind="plus" size={11} /> Author New
          </button>
        </div>
      </div>

      {/* Filter rail */}
      <OrdoPanel padding={0} frame style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 14, padding: '14px 18px', alignItems: 'center', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
            <input
              className="ao-input"
              placeholder="Search by title, author, or inscription…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: 36 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
              <Rune kind="search" size={14} />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14, borderLeft: '1px solid var(--rule)' }}>
            <span className="ao-overline">Sort</span>
            {([['newest', 'Newest'], ['oldest', 'Oldest'], ['downloads', 'Most Instated']] as const).map(([val, label]) => (
              <button
                key={val}
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => { setSort(val); setPage(0); }}
                style={{
                  borderColor: sort === val ? 'var(--brass)' : 'var(--rule)',
                  color: sort === val ? 'var(--gold-pale)' : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span className="ao-codex">{totalElements} sealed</span>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '10px 18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="ao-overline" style={{ marginRight: 6 }}>Tags</span>
          <HBTag active={activeTag === 'all'} count={totalElements} onClick={() => { setActiveTag('all'); setPage(0); }}>all</HBTag>
        </div>
      </OrdoPanel>

      {/* Card grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <OrdoPanel key={i} frame style={{ height: 320 }}>
              <div className="ao-ph" style={{ height: '100%' }} />
            </OrdoPanel>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Rune kind="sigil-3" size={64} color="var(--ink-quiet)" />
          <div className="ao-codex" style={{ marginTop: 14, color: 'var(--ink-faint)' }}>— THE LIBRARIAN BOWS —</div>
          <div className="ao-h3" style={{ marginTop: 10, color: 'var(--ink)' }}>No Doctrines match this seal</div>
          <p className="ao-italic" style={{ marginTop: 8, fontSize: 16, color: 'var(--ink-quiet)', maxWidth: 480, margin: '8px auto 0' }}>
            {search ? 'Try adjusting your search or filters.' : 'No published doctrines available yet.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => { setSearch(''); setActiveTag('all'); }}>
              <Rune kind="arrow-l" size={11} /> Clear all filters
            </button>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
              <Rune kind="plus" size={11} /> Author a Doctrine
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {packages.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              onInstall={() => installMutation.mutate(p.id)}
              onView={() => navigate(`/gm/homebrew/marketplace/${p.id}`)}
              installing={installMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--rule)' }}>
          <span className="ao-codex">Page {page + 1} of {totalPages} · displaying {packages.length} of {totalElements} sealed</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="ao-iconbtn" style={{ width: 30, height: 30 }} disabled={page === 0} onClick={() => setPage(page - 1)}>
              <Rune kind="arrow-l" size={11} />
            </button>
            <button className="ao-iconbtn" style={{ width: 30, height: 30 }} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <Rune kind="arrow-r" size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  onInstall,
  onView,
  installing,
}: {
  pkg: HomebrewPackageResponse;
  onInstall: () => void;
  onView: () => void;
  installing: boolean;
}) {
  const s = pkg.contentSummary;

  return (
    <OrdoPanel padding={0} frame style={{ position: 'relative' }}>
      {/* Top strip */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--hairline)', background: 'rgba(0,0,0,0.25)' }}>
        <CodexID>{pkg.id.substring(0, 8)}</CodexID>
        <div style={{ flex: 1 }} />
        {pkg.downloadCount > 100 && <OrdoChip tone="ember" glyph="flame">popular</OrdoChip>}
        <StatusBadge status="PUBLISHED" />
      </div>

      {/* Body */}
      <div style={{ padding: 18, display: 'flex', gap: 14 }}>
        <VersionSeal version={pkg.version} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {pkg.tags[0] && (
            <div className="ao-overline" style={{ color: 'var(--gold)' }}>{pkg.tags[0]} · doctrine</div>
          )}
          <div className="ao-h6" style={{ fontSize: 18, marginTop: 2, lineHeight: 1.2 }}>{pkg.title}</div>
          <div className="ao-codex" style={{ marginTop: 4 }}>
            by <span style={{ color: 'var(--ink)' }}>{pkg.authorUsername}</span>
            {pkg.publishedAt && <> · sealed {formatDate(pkg.publishedAt)}</>}
          </div>
        </div>
      </div>

      {pkg.description && (
        <div style={{ padding: '0 18px' }}>
          <p className="ao-italic" style={{ fontSize: 13, color: 'var(--ink)', margin: '4px 0 14px' }}>"{pkg.description}"</p>
        </div>
      )}

      <div style={{ padding: '0 18px 14px' }}>
        <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} />
      </div>

      {pkg.tags.length > 0 && (
        <div style={{ padding: '0 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {pkg.tags.map((t) => <HBTag key={t}>{t}</HBTag>)}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--rule)', background: 'var(--abyss)' }}>
        <Downloads value={pkg.downloadCount} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={onView}>
            <Rune kind="book" size={9} /> View
          </button>
          <button className="ao-btn ao-btn--sm ao-btn--primary" onClick={onInstall} disabled={installing}>
            <Rune kind="diamond-fill" size={8} /> Instate
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}
