import { useState } from 'react';
import { Rune, OrdoPanel, OrdoChip, Sigil } from '@/components/ordo';
import { StatusBadge, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  useAdminHomebrewPackages,
  useAdminHardDelete,
  useAdminTags,
  useAdminDeleteTag,
} from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { HomebrewStatus, HomebrewPackageResponse, HomebrewTagResponse } from '@/types';

type AdminTab = 'moderation' | 'tags';

export default function AdminHomebrewPage() {
  const [tab, setTab] = useState<AdminTab>('moderation');

  return (
    <div>
      {/* ── tab header ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        {/* left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Sigil size={48} color="var(--ember)" />
          <div>
            <CodexID>Inquisitor &middot; grand.assessor</CodexID>
            <h3 className="ao-h3" style={{ margin: 0, marginTop: 2 }}>All Doctrines</h3>
          </div>
        </div>

        {/* right */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <OrdoChip tone="ember" glyph="flame">Inquisitor access</OrdoChip>
          <button className="ao-btn ao-btn--ghost">
            <Rune kind="scroll" size={11} /> Audit log
          </button>
          <button className="ao-btn ao-btn--ghost">
            <Rune kind="book" size={11} /> Tag registry
          </button>
        </div>
      </div>

      {/* ── tabs bar ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--rule)',
          marginBottom: 24,
        }}
      >
        <button
          className={`ao-tab ${tab === 'moderation' ? 'is-active' : ''}`}
          onClick={() => setTab('moderation')}
        >
          Doctrine Moderation
        </button>
        <button
          className={`ao-tab ${tab === 'tags' ? 'is-active' : ''}`}
          onClick={() => setTab('tags')}
        >
          Tag Registry
        </button>
      </div>

      {tab === 'moderation' ? <ModerationPanel /> : <TagRegistryPanel />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODERATION TAB
   ══════════════════════════════════════════════════════════════ */

function ModerationPanel() {
  const [statusFilter, setStatusFilter] = useState<HomebrewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;
  const { data: pageData, isLoading } = useAdminHomebrewPackages({ status: statusParam, page, size: 20 });
  const hardDeleteMutation = useAdminHardDelete();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const handleHardDelete = () => {
    if (deleteId) {
      hardDeleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const filtered = search
    ? packages.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authorUsername.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
      )
    : packages;

  /* stat counts */
  const sealedCount = packages.filter((p) => p.status === 'PUBLISHED' && !p.isDeleted).length;
  const draftCount = packages.filter((p) => p.status === 'DRAFT' && !p.isDeleted).length;
  const withheldCount = packages.filter((p) => p.status === 'UNPUBLISHED' && !p.isDeleted).length;
  const deletedCount = packages.filter((p) => p.isDeleted).length;

  /* status filter defs */
  const statusFilters: { id: HomebrewStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'PUBLISHED', label: 'Sealed' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'UNPUBLISHED', label: 'Withheld' },
  ];

  return (
    <>
      {/* ── banner panel: stats grid ──────────────────────────── */}
      <OrdoPanel frame padding={0} style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 1fr',
            alignItems: 'center',
            padding: '18px 20px',
          }}
        >
          {/* user identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sigil size={40} color="var(--ember)" />
            <div>
              <div className="ao-overline" style={{ color: 'var(--ember)', marginBottom: 2 }}>
                Grand Assessor
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-quiet)' }}>
                Inquisitorial review
              </div>
            </div>
          </div>

          {/* stats */}
          {([
            { label: 'Total',    value: totalElements, color: 'var(--ink-bright)' },
            { label: 'Sealed',   value: sealedCount,   color: 'var(--gold)' },
            { label: 'Draft',    value: draftCount,     color: 'var(--ink-quiet)' },
            { label: 'Withheld', value: withheldCount,  color: 'var(--ink-quiet)' },
            { label: 'Flagged',  value: deletedCount,   color: 'var(--ember)' },
          ] as const).map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div
                className="ao-num"
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 28,
                  lineHeight: 1,
                  color: s.color,
                }}
              >
                {isLoading ? '\u2014' : s.value}
              </div>
              <div
                className="ao-overline"
                style={{ fontSize: 9, marginTop: 4, color: s.color, opacity: 0.8 }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </OrdoPanel>

      {/* ── filter bar panel ──────────────────────────────────── */}
      <OrdoPanel frame padding={0} style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 18px',
            flexWrap: 'wrap',
          }}
        >
          {/* search */}
          <div style={{ position: 'relative', width: 300 }}>
            <input
              className="ao-input"
              placeholder="Search by title, codex, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34, width: '100%' }}
            />
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-faint)',
              }}
            >
              <Rune kind="search" size={13} />
            </span>
          </div>

          {/* divider */}
          <div style={{ width: 1, height: 24, background: 'var(--rule)' }} />

          {/* status label */}
          <span className="ao-overline">Status</span>

          {/* status filter buttons */}
          {statusFilters.map((s) => (
            <button
              key={s.id}
              className={`ao-btn ao-btn--ghost ao-btn--sm`}
              onClick={() => { setStatusFilter(s.id); setPage(0); }}
              style={{
                borderColor: statusFilter === s.id ? 'var(--brass)' : 'var(--rule)',
                color: statusFilter === s.id ? 'var(--gold-pale)' : undefined,
                background: statusFilter === s.id ? 'rgba(201,168,76,0.08)' : undefined,
              }}
            >
              {s.label}
            </button>
          ))}

          {/* divider */}
          <div style={{ width: 1, height: 24, background: 'var(--rule)' }} />

          {/* author placeholder */}
          <span className="ao-overline">Author</span>
          <select
            className="ao-input"
            style={{
              width: 140,
              padding: '4px 8px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid var(--rule)',
              color: 'var(--ink-quiet)',
            }}
          >
            <option value="">All authors</option>
          </select>

          {/* spacer */}
          <div style={{ flex: 1 }} />

          {/* row count */}
          <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {filtered.length} of {totalElements} rows
          </span>
        </div>
      </OrdoPanel>

      {/* ── ledger table ──────────────────────────────────────── */}
      {isLoading ? (
        <OrdoPanel frame padding={0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
            ))}
          </div>
        </OrdoPanel>
      ) : (
        <OrdoPanel frame padding={0}>
          <table className="ao-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 36, padding: '12px 8px 12px 16px' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--gold)' }} />
                </th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>Codex</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>Doctrine</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>Author</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>State</th>
                <th style={{ textAlign: 'right', padding: '12px 12px', width: 40 }}>v</th>
                <th style={{ textAlign: 'right', padding: '12px 12px' }}>Downloads</th>
                <th style={{ textAlign: 'right', padding: '12px 12px' }}>Installs</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>Inscribed</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>Sealed</th>
                <th style={{ width: 110, padding: '12px 16px 12px 12px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <AdminDoctrineRow key={r.id} pkg={r} onHardDelete={() => setDeleteId(r.id)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      No doctrines match thy inquiry
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* pagination footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              borderTop: '1px solid var(--rule)',
              background: 'var(--abyss)',
              fontSize: 11,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            <span>Page {page + 1} of {totalPages || 1}</span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  &lsaquo;
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  &rsaquo;
                </button>
              </div>
            )}
          </div>
        </OrdoPanel>
      )}

      {/* ── hard delete confirmation ──────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Doctrine &mdash; Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This Doctrine shall be unmade. Its content reference shall be severed from all instated Hands. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withdraw Order</AlertDialogCancel>
            <AlertDialogAction onClick={handleHardDelete}>
              Authorize Unmaking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── moderation row ──────────────────────────────────────────── */

function AdminDoctrineRow({ pkg, onHardDelete }: { pkg: HomebrewPackageResponse; onHardDelete: () => void }) {
  const isDeleted = pkg.isDeleted;

  const rowBg = isDeleted
    ? 'rgba(179,70,26,0.02)'
    : undefined;

  return (
    <tr style={{ background: rowBg }}>
      {/* checkbox */}
      <td style={{ padding: '10px 8px 10px 16px' }}>
        <input type="checkbox" style={{ accentColor: 'var(--gold)' }} />
      </td>

      {/* codex */}
      <td style={{ padding: '10px 12px' }}>
        <CodexID>{pkg.id.substring(0, 8)}</CodexID>
      </td>

      {/* doctrine title */}
      <td style={{ padding: '10px 12px' }}>
        <span
          style={{
            color: isDeleted ? 'var(--ink-faint)' : 'var(--ink-bright)',
            textDecoration: isDeleted ? 'line-through' : 'none',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 13,
          }}
        >
          {pkg.title}
        </span>
      </td>

      {/* author */}
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-quiet)', fontFamily: 'var(--font-mono)' }}>
          {pkg.authorUsername}
        </span>
      </td>

      {/* state */}
      <td style={{ padding: '10px 12px' }}>
        <StatusBadge status={isDeleted ? 'DELETED' : pkg.status} />
      </td>

      {/* version */}
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: 12 }}>
          {pkg.version}
        </span>
      </td>

      {/* downloads */}
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-quiet)' }}>
          {pkg.downloadCount.toLocaleString()}
        </span>
      </td>

      {/* installs (using downloadCount as proxy) */}
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-quiet)' }}>
          {pkg.downloadCount.toLocaleString()}
        </span>
      </td>

      {/* inscribed / created */}
      <td style={{ padding: '10px 12px' }}>
        <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
          {formatDate(pkg.createdAt)}
        </span>
      </td>

      {/* sealed / published */}
      <td style={{ padding: '10px 12px' }}>
        <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
          {pkg.publishedAt ? formatDate(pkg.publishedAt) : '\u2014'}
        </span>
      </td>

      {/* actions */}
      <td style={{ padding: '10px 16px 10px 12px' }}>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {/* view */}
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title="View doctrine">
            <Rune kind="book" size={12} />
          </button>
          {/* audit */}
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title="Audit">
            <Rune kind="eye" size={12} />
          </button>
          {/* hard delete */}
          <button
            className="ao-iconbtn"
            style={{ width: 26, height: 26, color: '#d8896a' }}
            title="Hard delete"
            onClick={onHardDelete}
          >
            <Rune kind="flame" size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAG REGISTRY TAB
   ══════════════════════════════════════════════════════════════ */

function TagRegistryPanel() {
  const { data: tags, isLoading } = useAdminTags();
  const deleteTagMutation = useAdminDeleteTag();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allTags = tags || [];
  const filtered = search
    ? allTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  const inUseCount = allTags.filter((t) => t.usageCount > 0).length;
  const unusedCount = allTags.filter((t) => t.usageCount === 0).length;

  const handleDeleteTag = () => {
    if (deleteId) {
      deleteTagMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <>
      {/* ── heading ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 2 }}>
          Imperial Classification
        </p>
        <h3 className="ao-h3" style={{ margin: 0, marginTop: 2 }}>Classification Marks</h3>
        <p className="ao-italic" style={{ marginTop: 6, color: 'var(--ink-quiet)', fontSize: 13 }}>
          Marks bind doctrines to one another. Manage the registry of classification marks below.
        </p>
      </div>

      {/* ── main panel ────────────────────────────────────────── */}
      {isLoading ? (
        <OrdoPanel frame padding={0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
            ))}
          </div>
        </OrdoPanel>
      ) : (
        <OrdoPanel frame padding={0}>
          {/* search + chip row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <div style={{ position: 'relative', width: 260 }}>
              <input
                className="ao-input"
                placeholder="Search marks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34, width: '100%' }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)',
                }}
              >
                <Rune kind="search" size={13} />
              </span>
            </div>

            <OrdoChip tone="gold" glyph="check">In use &middot; {inUseCount}</OrdoChip>
            <OrdoChip tone="rune" glyph="minus">Unused &middot; {unusedCount}</OrdoChip>

            <div style={{ flex: 1 }} />

            <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              sorted &middot; usage descending
            </span>
          </div>

          {/* table */}
          <table className="ao-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Mark</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Doctrines using</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>State</th>
                <th style={{ width: 80, padding: '12px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => b.usageCount - a.usageCount)
                .map((t) => (
                  <TagRow key={t.id} tag={t} onDelete={() => setDeleteId(t.id)} />
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      No marks match thy inquiry
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* footer note */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <p className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-faint)', margin: 0 }}>
              Marks bound to one or more doctrines cannot be unmade.
            </p>
          </div>
        </OrdoPanel>
      )}

      {/* ── delete confirmation ───────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Classification Mark?</AlertDialogTitle>
            <AlertDialogDescription>
              This mark will be permanently removed. Only unused marks can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag}>
              Delete Mark
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── tag row ─────────────────────────────────────────────────── */

function TagRow({ tag, onDelete }: { tag: HomebrewTagResponse; onDelete: () => void }) {
  const inUse = tag.usageCount > 0;

  return (
    <tr>
      {/* mark name with diamond dot */}
      <td style={{ padding: '10px 16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-bright)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              transform: 'rotate(45deg)',
              background: inUse ? 'var(--gold)' : 'var(--ink-faint)',
              flexShrink: 0,
            }}
          />
          {tag.name}
        </span>
      </td>

      {/* usage count */}
      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: inUse ? 'var(--ink-bright)' : 'var(--ink-faint)',
          }}
        >
          {tag.usageCount}
        </span>
      </td>

      {/* state chip */}
      <td style={{ padding: '10px 16px' }}>
        {inUse ? (
          <OrdoChip tone="gold" glyph="check">In use</OrdoChip>
        ) : (
          <OrdoChip tone="rune" glyph="minus">Unused</OrdoChip>
        )}
      </td>

      {/* actions */}
      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {/* audit */}
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title="Audit">
            <Rune kind="eye" size={12} />
          </button>
          {/* delete */}
          <button
            className="ao-iconbtn"
            style={{
              width: 26,
              height: 26,
              color: inUse ? 'var(--ink-faint)' : '#d8896a',
              cursor: inUse ? 'not-allowed' : 'pointer',
              opacity: inUse ? 0.4 : 1,
            }}
            title={inUse ? `Cannot delete: in use by ${tag.usageCount} doctrines` : 'Delete mark'}
            disabled={inUse}
            onClick={onDelete}
          >
            <Rune kind="x" size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}
