import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useT } from '@/i18n/I18nContext';
import type { HomebrewStatus, HomebrewPackageResponse, HomebrewTagResponse } from '@/types';

type AdminTab = 'moderation' | 'tags';
type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function formatContentSummary(pkg: HomebrewPackageResponse, t: TFunc) {
  const summary = pkg.contentSummary || {};
  return [
    t('adm.hb.summaryItems', { count: summary.itemTypeCount ?? summary.ITEM_TYPE ?? 0 }),
    t('adm.hb.summaryClasses', { count: summary.classCount ?? summary.CHARACTER_CLASS ?? 0 }),
    t('adm.hb.summarySkills', { count: summary.skillCount ?? summary.SKILL ?? 0 }),
    t('adm.hb.summaryFeats', { count: summary.featCount ?? summary.FEAT ?? 0 }),
  ].join(' · ');
}

export default function AdminHomebrewPage() {
  const t = useT();
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
            <CodexID>{t('adm.hb.identityName')}</CodexID>
            <h3 className="ao-h3" style={{ margin: 0, marginTop: 2 }}>{t('adm.hb.allDoctrines')}</h3>
          </div>
        </div>

        {/* right */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <OrdoChip tone="ember" glyph="flame">{t('adm.hb.inquisitorAccess')}</OrdoChip>
          <button className="ao-btn ao-btn--ghost">
            <Rune kind="scroll" size={11} /> {t('adm.hb.auditLog')}
          </button>
          <button className="ao-btn ao-btn--ghost">
            <Rune kind="book" size={11} /> {t('adm.hb.tagRegistryBtn')}
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
          {t('adm.hb.tabModeration')}
        </button>
        <button
          className={`ao-tab ${tab === 'tags' ? 'is-active' : ''}`}
          onClick={() => setTab('tags')}
        >
          {t('adm.hb.tabTags')}
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
  const t = useT();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<HomebrewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPkg, setViewPkg] = useState<HomebrewPackageResponse | null>(null);
  const [auditPkg, setAuditPkg] = useState<HomebrewPackageResponse | null>(null);

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
    { id: 'all', label: t('adm.hb.filterAll') },
    { id: 'PUBLISHED', label: t('adm.hb.filterSealed') },
    { id: 'DRAFT', label: t('adm.hb.filterDraft') },
    { id: 'UNPUBLISHED', label: t('adm.hb.filterWithheld') },
  ];

  return (
    <>
      {/* ── banner panel: stats grid ──────────────────────────── */}
      <OrdoPanel frame padding={0} style={{ marginBottom: 18 }}>
        <div
          className="ao-rgrid"
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
                {t('adm.hb.grandAssessor')}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-quiet)' }}>
                {t('adm.hb.inquisitorialReview')}
              </div>
            </div>
          </div>

          {/* stats */}
          {([
            { label: t('adm.hb.statTotal'),    value: totalElements, color: 'var(--ink-bright)' },
            { label: t('adm.hb.statSealed'),   value: sealedCount,   color: 'var(--gold)' },
            { label: t('adm.hb.statDraft'),    value: draftCount,     color: 'var(--ink-quiet)' },
            { label: t('adm.hb.statWithheld'), value: withheldCount,  color: 'var(--ink-quiet)' },
            { label: t('adm.hb.statFlagged'),  value: deletedCount,   color: 'var(--ember)' },
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
              placeholder={t('adm.hb.searchDoctrines')}
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
          <span className="ao-overline">{t('adm.hb.statusLabel')}</span>

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
          <span className="ao-overline">{t('adm.hb.authorLabel')}</span>
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
            <option value="">{t('adm.hb.allAuthors')}</option>
          </select>

          {/* spacer */}
          <div style={{ flex: 1 }} />

          {/* row count */}
          <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {t('adm.hb.rowsOf', { filtered: filtered.length, total: totalElements })}
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
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colCodex')}</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colDoctrine')}</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colAuthor')}</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colState')}</th>
                <th style={{ textAlign: 'right', padding: '12px 12px', width: 40 }}>{t('adm.hb.colVersion')}</th>
                <th style={{ textAlign: 'right', padding: '12px 12px' }}>{t('adm.hb.colDownloads')}</th>
                <th style={{ textAlign: 'right', padding: '12px 12px' }}>{t('adm.hb.colInstalls')}</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colInscribed')}</th>
                <th style={{ textAlign: 'left', padding: '12px 12px' }}>{t('adm.hb.colSealed')}</th>
                <th style={{ width: 110, padding: '12px 16px 12px 12px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <AdminDoctrineRow
                  key={r.id}
                  pkg={r}
                  onView={() => setViewPkg(r)}
                  onAudit={() => setAuditPkg(r)}
                  onHardDelete={() => setDeleteId(r.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      {t('adm.hb.noDoctrines')}
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
            <span>{t('adm.hb.pageOf', { page: page + 1, total: totalPages || 1 })}</span>
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
      <AlertDialog open={!!viewPkg} onOpenChange={(open) => !open && setViewPkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{viewPkg?.title ?? t('adm.hb.doctrineFallback')}</AlertDialogTitle>
            <AlertDialogDescription>
              {viewPkg?.description || t('adm.hb.noDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {viewPkg && (
            <div style={{ display: 'grid', gap: 10, fontSize: 13, color: 'var(--ink-quiet)' }}>
              <div><strong>{t('adm.hb.fieldCodex')}</strong> {viewPkg.id}</div>
              <div><strong>{t('adm.hb.fieldAuthor')}</strong> {viewPkg.authorUsername}</div>
              <div><strong>{t('adm.hb.fieldStatus')}</strong> {viewPkg.isDeleted ? t('adm.hb.statusDeleted') : viewPkg.status}</div>
              <div><strong>{t('adm.hb.fieldVersion')}</strong> {viewPkg.version}</div>
              <div><strong>{t('adm.hb.fieldContent')}</strong> {formatContentSummary(viewPkg, t)}</div>
              <div><strong>{t('adm.hb.fieldTags')}</strong> {viewPkg.tags.length > 0 ? viewPkg.tags.join(', ') : t('adm.hb.tagsNone')}</div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('adm.hb.close')}</AlertDialogCancel>
            {viewPkg && viewPkg.status === 'PUBLISHED' && !viewPkg.isDeleted && (
              <AlertDialogAction
                onClick={() => {
                  navigate(`/gm/homebrew/marketplace/${viewPkg.id}`);
                  setViewPkg(null);
                }}
              >
                {t('adm.hb.openMarketplace')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!auditPkg} onOpenChange={(open) => !open && setAuditPkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adm.hb.auditTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adm.hb.auditDescription', { title: auditPkg?.title ?? t('adm.hb.auditFallback') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {auditPkg && (
            <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div><span className="ao-overline">{t('adm.hb.labelPackageId')}</span><br />{auditPkg.id}</div>
              <div><span className="ao-overline">{t('adm.hb.labelAuthor')}</span><br />{auditPkg.authorUsername}</div>
              <div><span className="ao-overline">{t('adm.hb.labelStatus')}</span><br />{auditPkg.isDeleted ? t('adm.hb.statusDeleted') : auditPkg.status}</div>
              <div><span className="ao-overline">{t('adm.hb.labelVersion')}</span><br />v{auditPkg.version}</div>
              <div><span className="ao-overline">{t('adm.hb.labelCreated')}</span><br />{formatDate(auditPkg.createdAt)}</div>
              <div><span className="ao-overline">{t('adm.hb.labelPublished')}</span><br />{auditPkg.publishedAt ? formatDate(auditPkg.publishedAt) : '—'}</div>
              <div><span className="ao-overline">{t('adm.hb.labelDownloads')}</span><br />{auditPkg.downloadCount.toLocaleString()}</div>
              <div><span className="ao-overline">{t('adm.hb.labelContent')}</span><br />{formatContentSummary(auditPkg, t)}</div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('adm.hb.close')}</AlertDialogCancel>
            {auditPkg && (
              <AlertDialogAction
                onClick={() => {
                  setDeleteId(auditPkg.id);
                  setAuditPkg(null);
                }}
              >
                {t('adm.hb.prepareHardDelete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adm.hb.hardDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adm.hb.hardDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('adm.hb.withdrawOrder')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleHardDelete}>
              {t('adm.hb.authorizeUnmaking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── moderation row ──────────────────────────────────────────── */

function AdminDoctrineRow({
  pkg,
  onView,
  onAudit,
  onHardDelete,
}: {
  pkg: HomebrewPackageResponse;
  onView: () => void;
  onAudit: () => void;
  onHardDelete: () => void;
}) {
  const t = useT();
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
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title={t('adm.hb.viewDoctrine')} onClick={onView}>
            <Rune kind="book" size={12} />
          </button>
          {/* audit */}
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title={t('adm.hb.audit')} onClick={onAudit}>
            <Rune kind="eye" size={12} />
          </button>
          {/* hard delete */}
          <button
            className="ao-iconbtn"
            style={{ width: 26, height: 26, color: '#d8896a' }}
            title={t('adm.hb.hardDelete')}
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
  const t = useT();
  const { data: tags, isLoading } = useAdminTags();
  const deleteTagMutation = useAdminDeleteTag();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allTags = tags || [];
  const filtered = search
    ? allTags.filter((tg) => tg.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  const inUseCount = allTags.filter((tg) => tg.usageCount > 0).length;
  const unusedCount = allTags.filter((tg) => tg.usageCount === 0).length;

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
          {t('adm.hb.imperialClassification')}
        </p>
        <h3 className="ao-h3" style={{ margin: 0, marginTop: 2 }}>{t('adm.hb.classificationMarks')}</h3>
        <p className="ao-italic" style={{ marginTop: 6, color: 'var(--ink-quiet)', fontSize: 13 }}>
          {t('adm.hb.marksIntro')}
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
                placeholder={t('adm.hb.searchMarks')}
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

            <OrdoChip tone="gold" glyph="check">{t('adm.hb.inUseCount', { count: inUseCount })}</OrdoChip>
            <OrdoChip tone="rune" glyph="minus">{t('adm.hb.unusedCount', { count: unusedCount })}</OrdoChip>

            <div style={{ flex: 1 }} />

            <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {t('adm.hb.sortedUsage')}
            </span>
          </div>

          {/* table */}
          <table className="ao-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.hb.colMark')}</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>{t('adm.hb.colDoctrinesUsing')}</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.hb.colMarkState')}</th>
                <th style={{ width: 80, padding: '12px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => b.usageCount - a.usageCount)
                .map((tg) => (
                  <TagRow key={tg.id} tag={tg} onDelete={() => setDeleteId(tg.id)} />
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      {t('adm.hb.noMarks')}
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
              {t('adm.hb.marksFooter')}
            </p>
          </div>
        </OrdoPanel>
      )}

      {/* ── delete confirmation ───────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adm.hb.deleteMarkTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adm.hb.deleteMarkDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag}>
              {t('adm.hb.deleteMark')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── tag row ─────────────────────────────────────────────────── */

function TagRow({ tag, onDelete }: { tag: HomebrewTagResponse; onDelete: () => void }) {
  const t = useT();
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
          <OrdoChip tone="gold" glyph="check">{t('adm.hb.inUse')}</OrdoChip>
        ) : (
          <OrdoChip tone="rune" glyph="minus">{t('adm.hb.unused')}</OrdoChip>
        )}
      </td>

      {/* actions */}
      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {/* audit */}
          <button className="ao-iconbtn" style={{ width: 26, height: 26 }} title={t('adm.hb.tagAudit')}>
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
            title={inUse ? t('adm.hb.cannotDelete', { count: tag.usageCount }) : t('adm.hb.deleteMarkTooltip')}
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
