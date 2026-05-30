import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip, Sigil } from '@/components/ordo';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useMyPackages, useDeleteHomebrew, usePublishHomebrew, useUnpublishHomebrew } from '@/hooks/useHomebrew';
import { useAuthStore } from '@/store/authStore';
import { formatTimeAgo } from '@/lib/utils';
import type { HomebrewPackageResponse, HomebrewStatus } from '@/types';

type FilterStatus = 'all' | HomebrewStatus | 'DELETED';

export default function MyDoctrinesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data: pageData, isLoading } = useMyPackages({ status: statusParam as HomebrewStatus | 'DELETED' | undefined, page, size: 20 });
  const deleteMutation = useDeleteHomebrew();
  const publishMutation = usePublishHomebrew();
  const unpublishMutation = useUnpublishHomebrew();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const statusCounts = {
    draft: packages.filter((p) => p.status === 'DRAFT').length,
    published: packages.filter((p) => p.status === 'PUBLISHED').length,
    unpublished: packages.filter((p) => p.status === 'UNPUBLISHED').length,
    deleted: packages.filter((p) => p.isDeleted).length,
  };

  const tabs: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: `All \u00b7 ${totalElements}` },
    { id: 'DRAFT', label: `Draft \u00b7 ${statusCounts.draft}` },
    { id: 'PUBLISHED', label: `Sealed \u00b7 ${statusCounts.published}` },
    { id: 'UNPUBLISHED', label: `Withheld \u00b7 ${statusCounts.unpublished}` },
    { id: 'DELETED', label: `Redacted \u00b7 ${statusCounts.deleted}` },
  ];

  return (
    <div>
      {/* ── Banner panel ── */}
      <OrdoPanel padding={0} frame>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
        }}>
          {/* Author info */}
          <div style={{
            padding: '20px 24px',
            borderRight: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <Sigil size={52} glyph="sigil-2" color="var(--gold)" />
            <div>
              <div className="ao-overline" style={{ color: 'var(--ink-faint)' }}>
                Game-Master &middot; {user?.username}
              </div>
              <div className="ao-h5" style={{ marginTop: 4 }}>Private Archive</div>
              <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 2 }}>
                restricted workshop
              </div>
            </div>
          </div>

          {/* Stat columns */}
          {[
            { label: 'Drafts', value: statusCounts.draft, color: 'var(--ink-quiet)' },
            { label: 'Sealed', value: statusCounts.published, color: 'var(--gold)' },
            { label: 'Withheld', value: statusCounts.unpublished, color: 'var(--ink-quiet)' },
            { label: 'Redacted', value: statusCounts.deleted, color: 'var(--ember)' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 24px',
              borderRight: i < 3 ? '1px solid var(--rule)' : undefined,
            }}>
              <div className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{s.label}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                lineHeight: 1.1,
                marginTop: 6,
                color: s.color,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </OrdoPanel>

      {/* ── Top actions ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              className="ao-input"
              placeholder="Search doctrines..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: 34, width: 260 }}
            />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
              <Rune kind="search" size={13} />
            </span>
          </div>
          <button className="ao-iconbtn" title="Filter">
            <Rune kind="filter" size={13} />
          </button>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
          <Rune kind="plus" size={11} /> Author New Doctrine
        </button>
      </div>

      {/* ── Status tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--rule)',
        marginBottom: 18,
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ao-tab${filter === t.id ? ' is-active' : ''}`}
            onClick={() => { setFilter(t.id); setPage(0); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ledger ── */}
      {isLoading ? (
        <OrdoPanel padding={0} frame style={{ height: 320 }}>
          <div className="ao-ph" style={{ height: '100%' }} />
        </OrdoPanel>
      ) : packages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Rune kind="scroll" size={64} color="var(--ink-quiet)" />
          <div className="ao-codex" style={{ marginTop: 14, color: 'var(--ink-faint)' }}>
            &mdash; THE ARCHIVE IS EMPTY &mdash;
          </div>
          <div className="ao-h5" style={{ marginTop: 10, color: 'var(--ink)' }}>No Doctrines Yet</div>
          <p className="ao-italic" style={{ fontSize: 14, color: 'var(--ink-quiet)', maxWidth: 440, margin: '8px auto 0' }}>
            Author your first doctrine and publish it to the marketplace.
          </p>
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
              <Rune kind="plus" size={11} /> Author Your First Doctrine
            </button>
          </div>
        </div>
      ) : (
        <OrdoPanel padding={0} frame>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 240px 200px 200px 60px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule)',
            background: 'rgba(0,0,0,0.25)',
            alignItems: 'center',
          }}>
            <span className="ao-overline">Ver</span>
            <span className="ao-overline">Doctrine</span>
            <span className="ao-overline">State</span>
            <span className="ao-overline">Content</span>
            <span className="ao-overline">Last Inscription</span>
            <span />
          </div>

          {/* Rows */}
          {packages.map((p, i) => (
            <PackageRow
              key={p.id}
              pkg={p}
              isLast={i === packages.length - 1}
              onEdit={() => navigate(`/gm/homebrew/${p.id}/edit`)}
              onPublish={() => publishMutation.mutate(p.id)}
              onUnpublish={() => unpublishMutation.mutate(p.id)}
              onDelete={() => setDeleteId(p.id)}
              onView={() => navigate(`/gm/homebrew/${p.id}/edit`)}
            />
          ))}
        </OrdoPanel>
      )}

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redact Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine will be marked as deleted. GMs who already instated it will retain their reference. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Redact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


/* ─────────────────────────────────────────
   Package row
   ───────────────────────────────────────── */

function PackageRow({
  pkg,
  isLast,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
  onView,
}: {
  pkg: HomebrewPackageResponse;
  isLast: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const isDeleted = pkg.isDeleted;
  const isPublished = pkg.status === 'PUBLISHED';
  const isUnpub = pkg.status === 'UNPUBLISHED';
  const isDraft = pkg.status === 'DRAFT';
  const s = pkg.contentSummary;

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 240px 200px 200px 60px',
    padding: '14px 16px',
    alignItems: 'center',
    position: 'relative',
    borderBottom: !isLast ? '1px solid var(--hairline)' : undefined,
    background: isDeleted ? 'rgba(179,70,26,0.03)' : undefined,
    opacity: isDeleted ? 0.85 : undefined,
  };

  return (
    <div style={rowStyle}>
      {/* Diagonal stripe overlay for deleted */}
      {isDeleted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(179,70,26,0.04) 10px, rgba(179,70,26,0.04) 11px)',
        }} />
      )}

      {/* Ver */}
      <VersionSeal version={isDraft ? '\u2014' : pkg.version} size={40} />

      {/* Doctrine */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="ao-h6"
            style={{
              fontSize: 15,
              textDecoration: isDeleted ? 'line-through' : undefined,
              textDecorationColor: isDeleted ? 'var(--ember)' : undefined,
              color: isDeleted ? 'var(--ink-quiet)' : undefined,
            }}
          >
            {pkg.title}
          </span>
          {isDeleted && (
            <span style={{
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              padding: '2px 6px',
              background: 'rgba(179,70,26,0.18)',
              color: 'var(--ember)',
              fontFamily: 'var(--font-mono)',
            }}>
              [REDACTED]
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <CodexID>{pkg.id.substring(0, 8)}</CodexID>
          <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>&middot;</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {pkg.tags.slice(0, 3).map((t) => <HBTag key={t}>{t}</HBTag>)}
            {pkg.tags.length > 3 && (
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>+{pkg.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* State */}
      <div>
        <StatusBadge status={isDeleted ? 'DELETED' : pkg.status} />
        {isPublished && (
          <div style={{ marginTop: 6 }}>
            <Downloads value={pkg.downloadCount} />
          </div>
        )}
        {isDeleted && (
          <div style={{ fontSize: 11, color: 'rgba(179,70,26,0.7)', marginTop: 4 }}>
            {pkg.downloadCount} installs persist
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} compact />
      </div>

      {/* Last Inscription */}
      <div style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
        {formatTimeAgo(pkg.createdAt)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
        {isDraft && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onEdit}>
            <Rune kind="diamond" size={9} /> Edit
          </button>
        )}
        {isPublished && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onUnpublish}>
            <Rune kind="lock" size={9} /> Withhold
          </button>
        )}
        {isUnpub && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onPublish}>
            <Rune kind="diamond-fill" size={9} /> Re-Seal
          </button>
        )}
        {!isDeleted && (
          <button className="ao-iconbtn" onClick={onDelete} title="More actions" style={{ width: 28, height: 28 }}>
            <Rune kind="dots" size={13} color="var(--ink-quiet)" />
          </button>
        )}
        {isDeleted && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onView}>
            Audit
          </button>
        )}
      </div>
    </div>
  );
}
