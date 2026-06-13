import { useState } from 'react';
import type { CSSProperties } from 'react';
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
import { formatDate, cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import type { HomebrewStatus, HomebrewPackageResponse, HomebrewTagResponse } from '@/types';
import s from './AdminHomebrewPage.module.css';

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
      <div className={s.header}>
        {/* left */}
        <div className={s.headerLeft}>
          <Sigil size={48} color="var(--ember)" />
          <div>
            <CodexID>{t('adm.hb.identityName')}</CodexID>
            <h3 className={cn('ao-h3', s.titleH3)}>{t('adm.hb.allDoctrines')}</h3>
          </div>
        </div>

        {/* right */}
        <div className={s.headerRight}>
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
      <div className={s.tabsBar}>
        <button
          className={cn('ao-tab', tab === 'moderation' && 'is-active')}
          onClick={() => setTab('moderation')}
        >
          {t('adm.hb.tabModeration')}
        </button>
        <button
          className={cn('ao-tab', tab === 'tags' && 'is-active')}
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
      <OrdoPanel frame padding={0} className={s.mb18}>
        <div className={cn('ao-rgrid', s.bannerGrid)}>
          {/* user identity */}
          <div className={s.identity}>
            <Sigil size={40} color="var(--ember)" />
            <div>
              <div className={cn('ao-overline', s.identityOverline)}>
                {t('adm.hb.grandAssessor')}
              </div>
              <div className={s.identitySub}>
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
          ] as const).map((stat) => (
            <div key={stat.label} className={s.stat} style={{ '--c': stat.color } as CSSProperties}>
              <div className={cn('ao-num', s.statValue)}>
                {isLoading ? '—' : stat.value}
              </div>
              <div className={cn('ao-overline', s.statLabel)}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </OrdoPanel>

      {/* ── filter bar panel ──────────────────────────────────── */}
      <OrdoPanel frame padding={0} className={s.mb18}>
        <div className={s.filterBar}>
          {/* search */}
          <div className={s.searchWrap}>
            <input
              className={cn('ao-input', s.searchInput)}
              placeholder={t('adm.hb.searchDoctrines')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={s.searchIcon}>
              <Rune kind="search" size={13} />
            </span>
          </div>

          {/* divider */}
          <div className={s.vDivider} />

          {/* status label */}
          <span className="ao-overline">{t('adm.hb.statusLabel')}</span>

          {/* status filter buttons */}
          {statusFilters.map((sf) => (
            <button
              key={sf.id}
              className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.statusBtn, statusFilter === sf.id && s.active)}
              onClick={() => { setStatusFilter(sf.id); setPage(0); }}
            >
              {sf.label}
            </button>
          ))}

          {/* divider */}
          <div className={s.vDivider} />

          {/* author placeholder */}
          <span className="ao-overline">{t('adm.hb.authorLabel')}</span>
          <select className={cn('ao-input', s.authorSelect)}>
            <option value="">{t('adm.hb.allAuthors')}</option>
          </select>

          {/* spacer */}
          <div className={s.spacer} />

          {/* row count */}
          <span className={cn('ao-codex', s.rowCount)}>
            {t('adm.hb.rowsOf', { filtered: filtered.length, total: totalElements })}
          </span>
        </div>
      </OrdoPanel>

      {/* ── ledger table ──────────────────────────────────────── */}
      {isLoading ? (
        <OrdoPanel frame padding={0}>
          <div className={s.skelCol}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn('ao-ph', s.skelRow)} />
            ))}
          </div>
        </OrdoPanel>
      ) : (
        <OrdoPanel frame padding={0}>
          <table className={cn('ao-table', s.table)}>
            <thead>
              <tr>
                <th className={s.thCheck}>
                  <input type="checkbox" className={s.checkbox} />
                </th>
                <th className={s.th}>{t('adm.hb.colCodex')}</th>
                <th className={s.th}>{t('adm.hb.colDoctrine')}</th>
                <th className={s.th}>{t('adm.hb.colAuthor')}</th>
                <th className={s.th}>{t('adm.hb.colState')}</th>
                <th className={s.thVersion}>{t('adm.hb.colVersion')}</th>
                <th className={s.thRight}>{t('adm.hb.colDownloads')}</th>
                <th className={s.thRight}>{t('adm.hb.colInstalls')}</th>
                <th className={s.th}>{t('adm.hb.colInscribed')}</th>
                <th className={s.th}>{t('adm.hb.colSealed')}</th>
                <th className={s.thActions} />
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
                  <td colSpan={11} className={s.emptyCell}>
                    <span className={cn('ao-italic', s.emptyText)}>
                      {t('adm.hb.noDoctrines')}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* pagination footer */}
          <div className={s.pagination}>
            <span>{t('adm.hb.pageOf', { page: page + 1, total: totalPages || 1 })}</span>
            {totalPages > 1 && (
              <div className={s.pageBtns}>
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
            <div className={s.viewGrid}>
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
            <div className={cn('ao-rgrid', s.auditGrid)}>
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

  return (
    <tr className={cn(s.row, isDeleted && s.deleted)}>
      {/* checkbox */}
      <td className={s.tdCheck}>
        <input type="checkbox" className={s.checkbox} />
      </td>

      {/* codex */}
      <td className={s.td}>
        <CodexID>{pkg.id.substring(0, 8)}</CodexID>
      </td>

      {/* doctrine title */}
      <td className={s.td}>
        <span className={cn(s.doctrineTitle, isDeleted && s.deleted)}>
          {pkg.title}
        </span>
      </td>

      {/* author */}
      <td className={s.td}>
        <span className={s.author}>{pkg.authorUsername}</span>
      </td>

      {/* state */}
      <td className={s.td}>
        <StatusBadge status={isDeleted ? 'DELETED' : pkg.status} />
      </td>

      {/* version */}
      <td className={s.tdRight}>
        <span className={s.version}>{pkg.version}</span>
      </td>

      {/* downloads */}
      <td className={s.tdRight}>
        <span className={s.num}>{pkg.downloadCount.toLocaleString()}</span>
      </td>

      {/* installs (using downloadCount as proxy) */}
      <td className={s.tdRight}>
        <span className={s.num}>{pkg.downloadCount.toLocaleString()}</span>
      </td>

      {/* inscribed / created */}
      <td className={s.td}>
        <span className={cn('ao-codex', s.date)}>{formatDate(pkg.createdAt)}</span>
      </td>

      {/* sealed / published */}
      <td className={s.td}>
        <span className={cn('ao-codex', s.date)}>
          {pkg.publishedAt ? formatDate(pkg.publishedAt) : '—'}
        </span>
      </td>

      {/* actions */}
      <td className={s.tdActions}>
        <div className={s.rowActions}>
          {/* view */}
          <button className={cn('ao-iconbtn', s.iconBtn)} title={t('adm.hb.viewDoctrine')} onClick={onView}>
            <Rune kind="book" size={12} />
          </button>
          {/* audit */}
          <button className={cn('ao-iconbtn', s.iconBtn)} title={t('adm.hb.audit')} onClick={onAudit}>
            <Rune kind="eye" size={12} />
          </button>
          {/* hard delete */}
          <button
            className={cn('ao-iconbtn', s.iconBtnDanger)}
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
      <div className={s.tagHeading}>
        <p className={cn('ao-overline', s.tagOverline)}>
          {t('adm.hb.imperialClassification')}
        </p>
        <h3 className={cn('ao-h3', s.titleH3)}>{t('adm.hb.classificationMarks')}</h3>
        <p className={cn('ao-italic', s.tagIntro)}>
          {t('adm.hb.marksIntro')}
        </p>
      </div>

      {/* ── main panel ────────────────────────────────────────── */}
      {isLoading ? (
        <OrdoPanel frame padding={0}>
          <div className={s.skelCol}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('ao-ph', s.skelRow)} />
            ))}
          </div>
        </OrdoPanel>
      ) : (
        <OrdoPanel frame padding={0}>
          {/* search + chip row */}
          <div className={s.tagBar}>
            <div className={s.tagSearchWrap}>
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder={t('adm.hb.searchMarks')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className={s.searchIcon}>
                <Rune kind="search" size={13} />
              </span>
            </div>

            <OrdoChip tone="gold" glyph="check">{t('adm.hb.inUseCount', { count: inUseCount })}</OrdoChip>
            <OrdoChip tone="rune" glyph="minus">{t('adm.hb.unusedCount', { count: unusedCount })}</OrdoChip>

            <div className={s.spacer} />

            <span className={cn('ao-codex', s.tagSortNote)}>
              {t('adm.hb.sortedUsage')}
            </span>
          </div>

          {/* table */}
          <table className={cn('ao-table', s.table)}>
            <thead>
              <tr>
                <th className={s.tagTd}>{t('adm.hb.colMark')}</th>
                <th className={s.tagTdRight}>{t('adm.hb.colDoctrinesUsing')}</th>
                <th className={s.tagTd}>{t('adm.hb.colMarkState')}</th>
                <th className={s.tagTdRight} />
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
                  <td colSpan={4} className={s.emptyCell}>
                    <span className={cn('ao-italic', s.emptyText)}>
                      {t('adm.hb.noMarks')}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* footer note */}
          <div className={s.tagFooter}>
            <p className={cn('ao-italic', s.tagFooterText)}>
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
      <td className={s.tagTd}>
        <span className={s.tagChip}>
          <span className={cn(s.tagDot, inUse && s.inUse)} />
          {tag.name}
        </span>
      </td>

      {/* usage count */}
      <td className={s.tagTdRight}>
        <span className={cn(s.tagUsage, inUse && s.inUse)}>{tag.usageCount}</span>
      </td>

      {/* state chip */}
      <td className={s.tagTd}>
        {inUse ? (
          <OrdoChip tone="gold" glyph="check">{t('adm.hb.inUse')}</OrdoChip>
        ) : (
          <OrdoChip tone="rune" glyph="minus">{t('adm.hb.unused')}</OrdoChip>
        )}
      </td>

      {/* actions */}
      <td className={s.tagTdRight}>
        <div className={s.rowActions}>
          {/* audit */}
          <button className={cn('ao-iconbtn', s.iconBtn)} title={t('adm.hb.tagAudit')}>
            <Rune kind="eye" size={12} />
          </button>
          {/* delete */}
          <button
            className={cn('ao-iconbtn', s.tagDeleteBtn)}
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
