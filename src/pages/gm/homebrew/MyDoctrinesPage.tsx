import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, Sigil } from '@/components/ordo';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useMyPackages, useDeleteHomebrew, usePublishHomebrew, useUnpublishHomebrew } from '@/hooks/useHomebrew';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { formatTimeAgo, cn } from '@/lib/utils';
import type { CSSProperties } from 'react';
import type { HomebrewPackageResponse, HomebrewStatus } from '@/types';
import s from './MyDoctrinesPage.module.css';

type FilterStatus = 'all' | HomebrewStatus | 'DELETED';

export default function MyDoctrinesPage() {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore((st) => st.user);
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
    { id: 'all', label: t('hb.my.tabAll', { count: totalElements }) },
    { id: 'DRAFT', label: t('hb.my.tabDraft', { count: statusCounts.draft }) },
    { id: 'PUBLISHED', label: t('hb.my.tabSealed', { count: statusCounts.published }) },
    { id: 'UNPUBLISHED', label: t('hb.my.tabWithheld', { count: statusCounts.unpublished }) },
    { id: 'DELETED', label: t('hb.my.tabRedacted', { count: statusCounts.deleted }) },
  ];

  return (
    <div>
      {/* ── Banner panel ── */}
      <OrdoPanel padding={0} frame>
        <div className={cn('ao-rgrid', s.bannerGrid)}>
          {/* Author info */}
          <div className={s.authorCell}>
            <Sigil size={52} glyph="sigil-2" color="var(--gold)" />
            <div>
              <div className={cn('ao-overline', s.authorOverline)}>
                {t('hb.my.gameMaster')} &middot; {user?.username}
              </div>
              <div className={cn('ao-h5', s.authorTitle)}>{t('hb.my.privateArchive')}</div>
              <div className={cn('ao-italic', s.authorSub)}>
                {t('hb.my.restrictedWorkshop')}
              </div>
            </div>
          </div>

          {/* Stat columns */}
          {[
            { label: t('hb.my.drafts'), value: statusCounts.draft, color: 'var(--ink-quiet)' },
            { label: t('hb.my.sealed'), value: statusCounts.published, color: 'var(--gold)' },
            { label: t('hb.my.withheld'), value: statusCounts.unpublished, color: 'var(--ink-quiet)' },
            { label: t('hb.my.redacted'), value: statusCounts.deleted, color: 'var(--ember)' },
          ].map((stat, i) => (
            <div key={i} className={cn(s.statCell, i < 3 && s.divided)}>
              <div className={cn('ao-overline', s.statLabel)}>{stat.label}</div>
              <div className={s.statValue} style={{ '--c': stat.color } as CSSProperties}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </OrdoPanel>

      {/* ── Top actions ── */}
      <div className={s.topActions}>
        <div className={s.searchWrap}>
          <div className={s.searchRel}>
            <input
              className={cn('ao-input', s.searchInput)}
              placeholder={t('hb.my.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
            <span className={s.searchIcon}>
              <Rune kind="search" size={13} />
            </span>
          </div>
          <button className="ao-iconbtn" title={t('hb.my.filter')}>
            <Rune kind="filter" size={13} />
          </button>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
          <Rune kind="plus" size={11} /> {t('hb.my.authorNew')}
        </button>
      </div>

      {/* ── Status tabs ── */}
      <div className={s.tabsBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn('ao-tab', filter === tab.id && 'is-active')}
            onClick={() => { setFilter(tab.id); setPage(0); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Ledger ── */}
      {isLoading ? (
        <OrdoPanel padding={0} frame className={s.loadingPanel}>
          <div className={cn('ao-ph', s.loadingPh)} />
        </OrdoPanel>
      ) : packages.length === 0 ? (
        <div className={s.emptyBox}>
          <Rune kind="scroll" size={64} color="var(--ink-quiet)" />
          <div className={cn('ao-codex', s.emptyOverline)}>
            {t('hb.my.emptyOverline')}
          </div>
          <div className={cn('ao-h5', s.emptyTitle)}>{t('hb.my.emptyTitle')}</div>
          <p className={cn('ao-italic', s.emptyBody)}>
            {t('hb.my.emptyBody')}
          </p>
          <div className={s.emptyAction}>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
              <Rune kind="plus" size={11} /> {t('hb.my.authorFirst')}
            </button>
          </div>
        </div>
      ) : (
        <OrdoPanel padding={0} frame>
          {/* Header row */}
          <div className={cn('ao-rgrid', s.headerRow)}>
            <span className="ao-overline">{t('hb.my.colVer')}</span>
            <span className="ao-overline">{t('hb.my.colDoctrine')}</span>
            <span className="ao-overline">{t('hb.my.colState')}</span>
            <span className="ao-overline">{t('hb.my.colContent')}</span>
            <span className="ao-overline">{t('hb.my.colLastInscription')}</span>
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
            <AlertDialogTitle>{t('hb.my.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hb.my.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('hb.my.withhold')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('hb.my.redactAction')}
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
  const t = useT();
  const isDeleted = pkg.isDeleted;
  const isPublished = pkg.status === 'PUBLISHED';
  const isUnpub = pkg.status === 'UNPUBLISHED';
  const isDraft = pkg.status === 'DRAFT';
  const cs = pkg.contentSummary;

  return (
    <div className={cn('ao-rgrid', s.row, !isLast && s.divided, isDeleted && s.deleted)}>
      {/* Diagonal stripe overlay for deleted */}
      {isDeleted && <div className={s.deletedStripe} />}

      {/* Ver */}
      <VersionSeal version={isDraft ? '\u2014' : pkg.version} size={40} />

      {/* Doctrine */}
      <div className={s.doctrineCell}>
        <div className={s.doctrineHead}>
          <span className={cn('ao-h6', s.doctrineTitle, isDeleted && s.deleted)}>
            {pkg.title}
          </span>
          {isDeleted && (
            <span className={s.redactedBadge}>
              {t('hb.my.redactedBadge')}
            </span>
          )}
        </div>
        <div className={s.doctrineMeta}>
          <CodexID>{pkg.id.substring(0, 8)}</CodexID>
          <span className={s.metaDot}>&middot;</span>
          <div className={s.tagRow}>
            {pkg.tags.slice(0, 3).map((tag) => <HBTag key={tag}>{tag}</HBTag>)}
            {pkg.tags.length > 3 && (
              <span className={s.tagMore}>+{pkg.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* State */}
      <div>
        <StatusBadge status={isDeleted ? 'DELETED' : pkg.status} />
        {isPublished && (
          <div className={s.dlWrap}>
            <Downloads value={pkg.downloadCount} />
          </div>
        )}
        {isDeleted && (
          <div className={s.installsPersist}>
            {t('hb.my.installsPersist', { count: pkg.downloadCount })}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <ContentPills items={cs.itemTypeCount} classes={cs.classCount} skills={cs.skillCount} feats={cs.featCount} compact />
      </div>

      {/* Last Inscription */}
      <div className={s.lastInsc}>
        {formatTimeAgo(pkg.createdAt)}
      </div>

      {/* Actions */}
      <div className={s.actions}>
        {isDraft && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onEdit}>
            <Rune kind="diamond" size={9} /> {t('hb.my.edit')}
          </button>
        )}
        {isPublished && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onUnpublish}>
            <Rune kind="lock" size={9} /> {t('hb.my.withholdBtn')}
          </button>
        )}
        {isUnpub && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onPublish}>
            <Rune kind="diamond-fill" size={9} /> {t('hb.my.reSeal')}
          </button>
        )}
        {!isDeleted && (
          <button className={cn('ao-iconbtn', s.moreBtn)} onClick={onDelete} title={t('hb.my.moreActions')}>
            <Rune kind="dots" size={13} color="var(--ink-quiet)" />
          </button>
        )}
        {isDeleted && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onView}>
            {t('hb.my.auditBtn')}
          </button>
        )}
      </div>
    </div>
  );
}
