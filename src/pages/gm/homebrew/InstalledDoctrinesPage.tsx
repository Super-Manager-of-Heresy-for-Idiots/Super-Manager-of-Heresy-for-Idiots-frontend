import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip } from '@/components/ordo';
import { VersionSeal, StatusBadge, ContentPills, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useInstalledPackages, useUninstallPackage } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { formatDate, cn } from '@/lib/utils';
import type { InstalledHomebrewResponse } from '@/types';
import s from './InstalledDoctrinesPage.module.css';

export default function InstalledDoctrinesPage() {
  const t = useT();
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
      <div className={s.headBand}>
        <div>
          <div className="ao-overline">{t('hb.installed.overline')}</div>
          <div className={cn('ao-h3', s.headTitle)}>{t('hb.installed.heading')}</div>
          <div className={cn('ao-italic', s.headSub)}>
            {t('hb.installed.subtitle')}
          </div>
        </div>

        <div className={s.statsRow}>
          <div className={s.statBox}>
            <div className="ao-overline">{t('hb.installed.active')}</div>
            <div className={s.statNum}>
              {activeCount}
            </div>
          </div>
          <div className={s.statDivider} />
          <div className={s.statBox}>
            <div className="ao-overline">{t('hb.installed.redacted')}</div>
            <div className={cn(s.statNum, s.red)}>
              {redactedCount}
            </div>
          </div>
          <div className={s.statDivider} />
          <div className={s.statBox}>
            <div className="ao-overline">{t('hb.installed.behind')}</div>
            <div className={cn(s.statNum, s.gold)}>
              {behindCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Redacted warning band ── */}
      {redactedCount > 0 && (
        <div className={s.warnBand}>
          <Rune kind="flame" size={16} color="var(--ember)" />
          <div className={s.warnGrow}>
            <span className={s.warnTitle}>
              {redactedCount > 1
                ? t('hb.installed.warningMany', { count: redactedCount })
                : t('hb.installed.warningOne', { count: redactedCount })}
            </span>
            <span className={cn('ao-italic', s.warnNote)}>
              {t('hb.installed.warningNote')}
            </span>
          </div>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => { /* scroll to first redacted */ }}>
            <Rune kind="eye" size={10} /> {t('hb.installed.audit')}
          </button>
        </div>
      )}

      {/* ── Content list ── */}
      {isLoading ? (
        <OrdoPanel padding={0} frame className={s.loadingPanel}>
          <div className={cn('ao-ph', s.loadingPh)} />
        </OrdoPanel>
      ) : packages.length === 0 ? (
        <div className={s.emptyBox}>
          <Rune kind="book" size={64} color="var(--ink-quiet)" />
          <div className={cn('ao-codex', s.emptyOverline)}>
            {t('hb.installed.emptyOverline')}
          </div>
          <div className={cn('ao-h3', s.emptyTitle)}>{t('hb.installed.emptyTitle')}</div>
          <p className={cn('ao-italic', s.emptyBody)}>
            {t('hb.installed.emptyBody')}
          </p>
          <div className={s.emptyActions}>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/gm/homebrew/marketplace')}>
              <Rune kind="arrow-r" size={11} /> {t('hb.installed.browseCatalogue')}
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
          <div className={s.listFooter}>
            <span className={cn('ao-codex', s.listFooterText)}>
              {totalElements !== 1
                ? t('hb.installed.footerMany', { count: totalElements })
                : t('hb.installed.footerOne', { count: totalElements })}
            </span>
          </div>
        </OrdoPanel>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={s.pager}>
          <span className="ao-codex">
            {t('hb.installed.pageInfo', { page: page + 1, total: totalPages, shown: packages.length, total2: totalElements })}
          </span>
          <div className={s.pagerBtns}>
            <button
              className={cn('ao-iconbtn', s.pagerBtn)}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <Rune kind="arrow-l" size={11} />
            </button>
            <button
              className={cn('ao-iconbtn', s.pagerBtn)}
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
            <AlertDialogTitle>{t('hb.installed.revokeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hb.installed.revokeDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className={s.revokeAction}
            >
              {t('hb.installed.revoke')}
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
  const t = useT();
  const deleted = pkg.isDeleted;
  const cs = pkg.contentSummary;

  return (
    <div className={cn('ao-rgrid', s.row, !isLast && s.divided, deleted && s.deleted)}>
      {/* Diagonal stripe overlay for deleted rows */}
      {deleted && <div className={s.deletedStripe} />}

      {/* Col 1: VersionSeal */}
      <VersionSeal version={pkg.sourceVersion} size={42} />

      {/* Col 2: Title + Author + CodexID */}
      <div className={s.titleCell}>
        <div className={s.titleHead}>
          <span className={cn('ao-h6', s.title, deleted && s.deleted)}>
            {pkg.title}
          </span>
          {deleted && (
            <span className={s.redactedBadge}>
              {t('hb.installed.redactedBadge')}
            </span>
          )}
        </div>
        <div className={s.byRow}>
          <span className={cn('ao-codex', s.byText)}>
            {t('hb.installed.byLabel')} <span className={s.byName}>{pkg.authorUsername}</span>
          </span>
          <span className={s.byDot}>&middot;</span>
          <CodexID>{pkg.packageId.substring(0, 8)}</CodexID>
        </div>
      </div>

      {/* Col 3: StatusBadge + status text */}
      <div>
        <StatusBadge status={deleted ? 'DELETED' : 'INSTALLED'} />
        <div className={cn('ao-codex', s.stateText)}>
          {deleted ? t('hb.installed.referencePersists') : t('hb.installed.liveLink')}
        </div>
      </div>

      {/* Col 4: ContentPills */}
      <ContentPills
        items={cs.itemTypeCount}
        classes={cs.classCount}
        skills={cs.skillCount}
        feats={cs.featCount}
        compact
      />

      {/* Col 5: Instated date */}
      <div>
        <div className={cn('ao-overline', s.dateLabel)}>{t('hb.installed.instated')}</div>
        <div className={cn('ao-codex', s.dateValue)}>
          {formatDate(pkg.installedAt)}
        </div>
      </div>

      {/* Col 6: Actions */}
      <div className={s.actions}>
        {!deleted && (
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onView}>
            <Rune kind="book" size={10} /> {t('hb.installed.view')}
          </button>
        )}
        <button className="ao-btn ao-btn--danger ao-btn--sm" onClick={onRevoke}>
          <Rune kind="x" size={10} /> {t('hb.installed.revoke')}
        </button>
      </div>
    </div>
  );
}
