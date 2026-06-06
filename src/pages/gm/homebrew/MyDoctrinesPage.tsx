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
import { useT } from '@/i18n/I18nContext';
import { formatTimeAgo } from '@/lib/utils';
import type { HomebrewPackageResponse, HomebrewStatus } from '@/types';

type FilterStatus = 'all' | HomebrewStatus | 'DELETED';

export default function MyDoctrinesPage() {
  const t = useT();
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
        <div className="ao-rgrid" style={{
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
                {t('hb.my.gameMaster')} &middot; {user?.username}
              </div>
              <div className="ao-h5" style={{ marginTop: 4 }}>{t('hb.my.privateArchive')}</div>
              <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 2 }}>
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
              placeholder={t('hb.my.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: 34, width: 260 }}
            />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
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
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--rule)',
        marginBottom: 18,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ao-tab${filter === tab.id ? ' is-active' : ''}`}
            onClick={() => { setFilter(tab.id); setPage(0); }}
          >
            {tab.label}
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
            {t('hb.my.emptyOverline')}
          </div>
          <div className="ao-h5" style={{ marginTop: 10, color: 'var(--ink)' }}>{t('hb.my.emptyTitle')}</div>
          <p className="ao-italic" style={{ fontSize: 14, color: 'var(--ink-quiet)', maxWidth: 440, margin: '8px auto 0' }}>
            {t('hb.my.emptyBody')}
          </p>
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/new')}>
              <Rune kind="plus" size={11} /> {t('hb.my.authorFirst')}
            </button>
          </div>
        </div>
      ) : (
        <OrdoPanel padding={0} frame>
          {/* Header row */}
          <div className="ao-rgrid" style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 240px 200px 200px 60px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule)',
            background: 'rgba(0,0,0,0.25)',
            alignItems: 'center',
          }}>
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
    <div className="ao-rgrid" style={rowStyle}>
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
              {t('hb.my.redactedBadge')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <CodexID>{pkg.id.substring(0, 8)}</CodexID>
          <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>&middot;</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {pkg.tags.slice(0, 3).map((tag) => <HBTag key={tag}>{tag}</HBTag>)}
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
            {t('hb.my.installsPersist', { count: pkg.downloadCount })}
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
          <button className="ao-iconbtn" onClick={onDelete} title={t('hb.my.moreActions')} style={{ width: 28, height: 28 }}>
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
