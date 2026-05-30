import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip } from '@/components/ordo';
import { VersionSeal, StatusBadge, ContentPills, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useInstalledPackages, useUninstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { InstalledHomebrewResponse } from '@/types';

export default function InstalledDoctrinesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: pageData, isLoading } = useInstalledPackages({ page, size: 20 });
  const uninstallMutation = useUninstallPackage();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const activeCount = packages.filter((p) => !p.isDeleted).length;
  const redactedCount = packages.filter((p) => p.isDeleted).length;
  const behindCount = 0; // placeholder: no field in type yet

  const handleRevoke = () => {
    if (revokeId) {
      uninstallMutation.mutate(revokeId, { onSuccess: () => setRevokeId(null) });
    }
  };

  return (
    <div>
      {/* ── Heading band ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="ao-overline">References &middot; not copies</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>Linked Doctrines</div>
          <div className="ao-italic" style={{ marginTop: 4, maxWidth: 620 }}>
            The Archive grants reference, not possession. Should an author redact a doctrine, thy link shall be marked but not severed.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div className="ao-overline">Active</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--ink-bright)', lineHeight: 1 }}>
              {activeCount}
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--rule)' }} />
          <div style={{ textAlign: 'right' }}>
            <div className="ao-overline">Redacted</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#d8896a', lineHeight: 1 }}>
              {redactedCount}
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--rule)' }} />
          <div style={{ textAlign: 'right' }}>
            <div className="ao-overline">Behind</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold-pale)', lineHeight: 1 }}>
              {behindCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Redacted warning band ── */}
      {redactedCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          marginBottom: 18,
          background: 'linear-gradient(90deg, rgba(179,70,26,0.12) 0%, rgba(179,70,26,0.04) 100%)',
          border: '1px solid rgba(179,70,26,0.25)',
          borderLeft: '3px solid var(--ember)',
        }}>
          <Rune kind="flame" size={16} color="var(--ember)" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: '#d8896a', fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
              {redactedCount} doctrine{redactedCount > 1 ? 's have' : ' has'} been redacted by{' '}
              {redactedCount > 1 ? 'their authors' : 'its author'}.
            </span>
            <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginLeft: 8 }}>
              Reference persists; no further updates shall arrive.
            </span>
          </div>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => { /* scroll to first redacted */ }}>
            <Rune kind="eye" size={10} /> Audit
          </button>
        </div>
      )}

      {/* ── Content list ── */}
      {isLoading ? (
        <OrdoPanel padding={0} frame style={{ height: 320 }}>
          <div className="ao-ph" style={{ height: '100%' }} />
        </OrdoPanel>
      ) : packages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Rune kind="book" size={64} color="var(--ink-quiet)" />
          <div className="ao-codex" style={{ marginTop: 14, color: 'var(--ink-faint)' }}>
            — THE ARCHIVE IS EMPTY —
          </div>
          <div className="ao-h3" style={{ marginTop: 10, color: 'var(--ink)' }}>No Instated Doctrines</div>
          <p className="ao-italic" style={{ fontSize: 16, color: 'var(--ink-quiet)', maxWidth: 480, margin: '8px auto 0' }}>
            Browse the catalogue and instate doctrines to gain reference.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/marketplace')}>
              <Rune kind="arrow-r" size={11} /> Browse Catalogue
            </button>
          </div>
        </div>
      ) : (
        <OrdoPanel padding={0} frame>
          {packages.map((p, i) => (
            <InstalledRow
              key={p.installationId}
              pkg={p}
              isLast={i === packages.length - 1}
              onView={() => navigate(`/gm/homebrew/marketplace/${p.packageId}`)}
              onRevoke={() => setRevokeId(p.installationId)}
            />
          ))}
          <div style={{
            textAlign: 'center',
            padding: '10px 0',
            borderTop: '1px solid var(--hairline)',
            background: 'var(--abyss)',
          }}>
            <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {totalElements} instatement{totalElements !== 1 ? 's' : ''} &middot; only what thy charter permits
            </span>
          </div>
        </OrdoPanel>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 26,
          paddingTop: 18,
          borderTop: '1px solid var(--rule)',
        }}>
          <span className="ao-codex">
            Page {page + 1} of {totalPages} &middot; displaying {packages.length} of {totalElements}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="ao-iconbtn"
              style={{ width: 30, height: 30 }}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <Rune kind="arrow-l" size={11} />
            </button>
            <button
              className="ao-iconbtn"
              style={{ width: 30, height: 30 }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <Rune kind="arrow-r" size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Revoke confirmation ── */}
      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Instatement?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine reference will be removed. Content from this doctrine will no longer be available in thy sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              style={{ background: 'var(--ember)', color: '#fff' }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─────────────────── Row component ─────────────────── */

function InstalledRow({
  pkg,
  isLast,
  onView,
  onRevoke,
}: {
  pkg: InstalledHomebrewResponse;
  isLast: boolean;
  onView: () => void;
  onRevoke: () => void;
}) {
  const deleted = pkg.isDeleted;
  const s = pkg.contentSummary;

  const rowBg = deleted ? 'rgba(179,70,26,0.03)' : 'transparent';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '56px 1.2fr 200px 1fr 200px 240px',
      alignItems: 'center',
      gap: 12,
      padding: '14px 18px',
      borderBottom: isLast ? 'none' : '1px solid var(--hairline)',
      background: rowBg,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Diagonal stripe overlay for deleted rows */}
      {deleted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(179,70,26,0.03) 10px, rgba(179,70,26,0.03) 11px)',
        }} />
      )}

      {/* Col 1: VersionSeal */}
      <VersionSeal version={pkg.sourceVersion} size={42} />

      {/* Col 2: Title + Author + CodexID */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="ao-h6"
            style={{
              fontSize: 15,
              ...(deleted ? {
                color: 'var(--ink-quiet)',
                textDecoration: 'line-through',
                textDecorationColor: 'rgba(179,70,26,0.6)',
              } : {}),
            }}
          >
            {pkg.title}
          </span>
          {deleted && (
            <span style={{
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              padding: '2px 6px',
              background: 'rgba(179,70,26,0.18)',
              color: '#d8896a',
              fontFamily: 'var(--font-mono)',
            }}>
              [REDACTED]
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            by <span style={{ color: 'var(--ink)' }}>{pkg.authorUsername}</span>
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 10 }}>&middot;</span>
          <CodexID>{pkg.packageId.substring(0, 8)}</CodexID>
        </div>
      </div>

      {/* Col 3: StatusBadge + status text */}
      <div>
        <StatusBadge status={deleted ? 'DELETED' : 'INSTALLED'} />
        <div className="ao-codex" style={{ fontSize: 10, marginTop: 5, color: 'var(--ink-faint)' }}>
          {deleted ? 'reference persists' : 'live link'}
        </div>
      </div>

      {/* Col 4: ContentPills */}
      <ContentPills
        items={s.itemTypeCount}
        classes={s.classCount}
        skills={s.skillCount}
        feats={s.featCount}
        compact
      />

      {/* Col 5: Instated date */}
      <div>
        <div className="ao-overline" style={{ fontSize: 9 }}>Instated</div>
        <div className="ao-codex" style={{ fontSize: 12, marginTop: 3 }}>
          {formatDate(pkg.installedAt)}
        </div>
      </div>

      {/* Col 6: Actions */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {!deleted && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onView}>
            <Rune kind="book" size={10} /> View
          </button>
        )}
        <button className="ao-btn ao-btn--danger ao-btn--sm" onClick={onRevoke}>
          <Rune kind="x" size={10} /> Revoke
        </button>
      </div>
    </div>
  );
}
