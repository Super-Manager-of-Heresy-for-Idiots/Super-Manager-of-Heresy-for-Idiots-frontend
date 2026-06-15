import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdoPanel, Rune, OrdoDivider, EmptyVault } from '@/components/ordo';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  useMyBlueprints,
  useDeleteBlueprint,
  usePublishBlueprint,
} from '@/hooks/useCampaignBlueprints';
import { InstantiateModal } from './InstantiateModal';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignBlueprintResponse } from '@/types';
import s from './blueprints.module.css';

export default function MyBlueprintsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useMyBlueprints();
  const deleteMutation = useDeleteBlueprint();
  const publishMutation = usePublishBlueprint();

  const [deleteTarget, setDeleteTarget] = useState<CampaignBlueprintResponse | null>(null);
  const [instTarget, setInstTarget] = useState<CampaignBlueprintResponse | null>(null);

  const blueprints = data ?? [];

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className={s.headerLg}>
          <p className={cn('ao-overline', s.overline)}>{t('bp.my.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{t('bp.my.heading')}</h3>
        </div>
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.skelLine1)} />
              <div className={cn('ao-ph', s.skelLine2)} />
              <div className={cn('ao-ph', s.skelLine3)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>{t('bp.my.error')}</p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div>
      <div className={s.headRow}>
        <div className={s.header}>
          <p className={cn('ao-overline', s.overline)}>{t('bp.my.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{t('bp.my.heading')}</h3>
          <p className={cn('ao-italic', s.subtitle)}>{t('bp.my.subtitle')}</p>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('/blueprints/my/new')}>
          <Rune kind="plus" size={12} color="currentColor" />
          <span className={s.btnLabelL}>{t('bp.my.create')}</span>
        </button>
      </div>

      <OrdoDivider glyph="diamond" />

      {blueprints.length === 0 ? (
        <EmptyVault glyph="scroll" title={t('bp.my.emptyTitle')} body={t('bp.my.emptyBody')} />
      ) : (
        <div className={cn('ao-rgrid', s.grid, s.gridTop)}>
          {blueprints.map((bp) => {
            const isPublished = bp.status === 'PUBLISHED';
            return (
              <OrdoPanel key={bp.id} frame padding={0} className={s.card}>
                <div className={s.cardBody}>
                  <div className={s.cardHead}>
                    <Rune kind="hex" size={22} color="var(--gold)" />
                    <div className={s.cardTitleWrap}>
                      <h5 className={cn('ao-h5', s.cardTitle)}>{bp.title}</h5>
                      <div className={cn('ao-codex', s.cardBy)}>v{bp.version}</div>
                    </div>
                    <span className={cn(s.statusChip, s[`status${bp.status}`])}>
                      {t(`bp.status.${bp.status}`)}
                    </span>
                  </div>

                  {bp.loreDescription && (
                    <p className={cn('ao-italic', s.cardDesc)}>{bp.loreDescription}</p>
                  )}

                  <div className={s.badgeRow}>
                    <span className={s.uniBadge}>
                      <Rune kind="cir-dot" size={9} color="var(--arcane)" /> {bp.universeName}
                    </span>
                    {bp.parentId && <span className="ao-chip ao-chip--rune">{t('bp.my.forked')}</span>}
                  </div>
                </div>

                <div className={s.cardActionsFoot}>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={() => navigate(`/blueprints/my/${bp.id}/edit`)}
                  >
                    <Rune kind="diamond" size={9} color="currentColor" /> {t('common.edit')}
                  </button>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={() => publishMutation.mutate({ id: bp.id, publish: !isPublished })}
                    disabled={publishMutation.isPending}
                  >
                    <Rune kind={isPublished ? 'lock' : 'diamond-fill'} size={9} color="currentColor" />
                    {isPublished ? t('bp.my.unpublish') : t('bp.my.publish')}
                  </button>
                  <button
                    className="ao-btn ao-btn--primary ao-btn--sm"
                    onClick={() => setInstTarget(bp)}
                  >
                    <Rune kind="flame" size={9} color="currentColor" /> {t('bp.my.instantiate')}
                  </button>
                  <button
                    className={cn('ao-iconbtn', s.delBtn)}
                    onClick={() => setDeleteTarget(bp)}
                    title={t('common.delete')}
                  >
                    <Rune kind="x" size={13} color="var(--ink-quiet)" />
                  </button>
                </div>
              </OrdoPanel>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bp.my.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bp.my.deleteBody', { title: deleteTarget?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {instTarget && (
        <InstantiateModal
          open={!!instTarget}
          onOpenChange={(open) => !open && setInstTarget(null)}
          blueprint={instTarget}
        />
      )}
    </div>
  );
}
