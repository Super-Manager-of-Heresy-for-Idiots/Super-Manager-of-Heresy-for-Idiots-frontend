import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, OrdoDivider, EmptyVault } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCampaignStorage, useCreateStorageContainer } from '@/hooks/useCampaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { StorageContainerResponse, StorageItemResponse } from '@/types';
import s from './SharedStoragePage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function SharedStoragePage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: containers, isLoading, error, refetch } = useCampaignStorage(campaignId!);
  const createMutation = useCreateStorageContainer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (containerId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) next.delete(containerId);
      else next.add(containerId);
      return next;
    });
  };

  const handleCreate = () => {
    if (!campaignId || !formName) return;
    createMutation.mutate(
      { campaignId, data: { name: formName } },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormName('');
        },
      },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div className={s.head}>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.storage.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.storage.title')}</h3>
        </div>
        <div className={s.skelCol}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW40)} />
              <div className={cn('ao-ph', s.phW60)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp2.storage.loadError')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  const storageList: StorageContainerResponse[] = containers ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.backBtn)}
        onClick={() => navigate(`/campaigns/${campaignId}`)}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span className={s.ml4}>{t('camp2.storage.backToDashboard')}</span>
      </button>

      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.storage.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.storage.title')}</h3>
          <p className={cn('ao-italic', s.sub)}>
            {t('camp2.storage.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { setFormName(''); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp2.storage.newContainer')}</span>
        </button>
      </div>

      {/* Container List */}
      {storageList.length === 0 ? (
        <EmptyVault
          glyph="sword"
          title={t('camp2.storage.empty.title')}
          body={t('camp2.storage.empty.body')}
          action={
            <button
              className="ao-btn ao-btn--primary"
              onClick={() => { setFormName(''); setDialogOpen(true); }}
            >
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp2.storage.newContainer')}</span>
            </button>
          }
        />
      ) : (
        <div className={s.list}>
          {storageList.map((container: StorageContainerResponse) => {
            const isExpanded = expandedIds.has(container.id);
            const items: StorageItemResponse[] = container.items ?? [];

            return (
              <OrdoPanel key={container.id} frame padding={0}>
                {/* Container header */}
                <button onClick={() => toggleExpanded(container.id)} className={s.containerBtn}>
                  <div className={s.containerIcon}>
                    <Rune kind="sword" size={16} color="var(--brass)" />
                  </div>
                  <div className={s.containerMain}>
                    <div className={s.containerName}>
                      {container.name}
                    </div>
                    <div className={cn('ao-codex', s.containerCount)}>
                      {items.length} {items.length === 1 ? t('camp2.storage.itemOne') : t('camp2.storage.itemMany')}
                    </div>
                  </div>
                  <Rune
                    kind={isExpanded ? 'chev-d' : 'chev-r'}
                    size={14}
                    color="var(--ink-faint)"
                  />
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className={s.itemsWrap}>
                    {items.length === 0 ? (
                      <div className={s.emptyItems}>
                        <p className={cn('ao-italic', s.emptyItemsText)}>
                          {t('camp2.storage.containerEmpty')}
                        </p>
                      </div>
                    ) : (
                      items.map((item: StorageItemResponse) => (
                        <div key={item.id} className={s.itemRow}>
                          <Rune kind="diamond" size={8} color="var(--brass)" />
                          <div className={s.itemMain}>
                            <span className={s.itemName}>
                              {item.name}
                            </span>
                            {item.rarity && (
                              <span className={cn('ao-overline', s.itemRarity)}>
                                {item.rarity}
                              </span>
                            )}
                          </div>
                          <span className={cn('ao-codex', s.itemQty)}>
                            x{item.quantity}
                          </span>
                          {item.isUnique && (
                            <span className={cn('ao-overline', s.itemUnique)}>
                              {t('camp2.storage.unique')}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create Container Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.storage.dialog.title')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('camp2.storage.field.name')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('camp2.storage.field.namePlaceholder')}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('camp2.storage.withhold')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!formName || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('camp2.storage.create')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
