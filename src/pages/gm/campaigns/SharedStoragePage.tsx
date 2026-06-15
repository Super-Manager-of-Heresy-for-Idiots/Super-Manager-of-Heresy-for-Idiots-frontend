import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, Rune, OrdoField, EmptyVault } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCampaignStorage,
  useCreateStorageContainer,
  useDepositItem,
  useTakeItem,
} from '@/hooks/useCampaigns';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useCharacterInventory } from '@/hooks/useInventory';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type {
  CharacterResponse,
  ItemInstanceResponse,
  StorageContainerResponse,
  StorageItemResponse,
} from '@/types';
import s from './SharedStoragePage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

const itemLabel = (item: ItemInstanceResponse): string =>
  item.displayName || item.customName || item.name || item.templateName;

/* ── deposit dialog ──────────────────────────────────────────── */

function DepositDialog({
  campaignId,
  storageId,
  characters,
  onClose,
}: {
  campaignId: string;
  storageId: string;
  characters: CharacterResponse[];
  onClose: () => void;
}) {
  const t = useT();
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? '');
  const [instanceId, setInstanceId] = useState('');
  const { data: inventory, isLoading } = useCharacterInventory(campaignId, characterId);
  const deposit = useDepositItem();

  const items = inventory ?? [];

  const handleDeposit = () => {
    if (!instanceId || !characterId) return;
    deposit.mutate(
      { campaignId, storageId, instanceId, characterId },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('camp2.storage.deposit.title')}</DialogTitle>
        </DialogHeader>
        <div className={s.dialogCol}>
          {characters.length === 0 ? (
            <p className={cn('ao-italic', s.dialogHint)}>{t('camp2.storage.deposit.noCharacters')}</p>
          ) : (
            <>
              <OrdoField label={t('camp2.storage.deposit.character')} required>
                <select
                  className="ao-input"
                  value={characterId}
                  onChange={(e) => { setCharacterId(e.target.value); setInstanceId(''); }}
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </OrdoField>
              <OrdoField label={t('camp2.storage.deposit.item')} required>
                {isLoading ? (
                  <div className={s.dialogLoading}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <p className={cn('ao-italic', s.dialogHint)}>{t('camp2.storage.deposit.noItems')}</p>
                ) : (
                  <select
                    className="ao-input"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                  >
                    <option value="">{t('camp2.storage.deposit.itemPlaceholder')}</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {itemLabel(it)} ×{it.quantity}{it.isUnique ? ` · ${t('camp2.storage.unique')}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </OrdoField>
            </>
          )}
        </div>
        <DialogFooter>
          <button className="ao-btn ao-btn--ghost" onClick={onClose} disabled={deposit.isPending}>
            {t('camp2.storage.withhold')}
          </button>
          <button
            type="button"
            className="ao-btn ao-btn--primary"
            onClick={handleDeposit}
            disabled={!instanceId || deposit.isPending}
          >
            {deposit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('camp2.storage.deposit.submit')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── take dialog ─────────────────────────────────────────────── */

function TakeDialog({
  campaignId,
  storageId,
  item,
  characters,
  onClose,
}: {
  campaignId: string;
  storageId: string;
  item: StorageItemResponse;
  characters: CharacterResponse[];
  onClose: () => void;
}) {
  const t = useT();
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? '');
  const take = useTakeItem();

  const handleTake = () => {
    if (!characterId) return;
    take.mutate(
      { campaignId, storageId, instanceId: item.id, characterId },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('camp2.storage.take.title')}</DialogTitle>
        </DialogHeader>
        <div className={s.dialogCol}>
          <p className={cn('ao-italic', s.dialogHint)}>
            {t('camp2.storage.take.body', { item: itemLabel(item) })}
          </p>
          {characters.length === 0 ? (
            <p className={cn('ao-italic', s.dialogHint)}>{t('camp2.storage.take.noCharacters')}</p>
          ) : (
            <OrdoField label={t('camp2.storage.take.character')} required>
              <select
                className="ao-input"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </OrdoField>
          )}
        </div>
        <DialogFooter>
          <button className="ao-btn ao-btn--ghost" onClick={onClose} disabled={take.isPending}>
            {t('camp2.storage.withhold')}
          </button>
          <button
            type="button"
            className="ao-btn ao-btn--primary"
            onClick={handleTake}
            disabled={!characterId || take.isPending}
          >
            {take.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('camp2.storage.take.submit')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function SharedStoragePage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: containers, isLoading, error, refetch } = useCampaignStorage(campaignId!);
  const { data: characters } = useCampaignCharacters(campaignId!);
  const { user } = useAuthStore();
  const createMutation = useCreateStorageContainer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [depositStorageId, setDepositStorageId] = useState<string | null>(null);
  const [takeTarget, setTakeTarget] = useState<{ storageId: string; item: StorageItemResponse } | null>(null);

  // GM/Admin may move items for any character; a player only for their own.
  const eligibleCharacters = useMemo(() => {
    const all = characters ?? [];
    const isPrivileged = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
    return isPrivileged ? all : all.filter((c) => c.ownerId === user?.id);
  }, [characters, user?.id, user?.role]);

  const canInteract = eligibleCharacters.length > 0;

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
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backBtn} />

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
                    {canInteract && (
                      <div className={s.itemsActions}>
                        <button
                          className="ao-btn ao-btn--ghost ao-btn--sm"
                          onClick={() => setDepositStorageId(container.id)}
                        >
                          <Rune kind="plus" size={12} color="currentColor" />
                          <span className={s.ml6}>{t('camp2.storage.deposit.add')}</span>
                        </button>
                      </div>
                    )}
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
                              {itemLabel(item)}
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
                          {canInteract && (
                            <button
                              className="ao-btn ao-btn--ghost ao-btn--sm"
                              onClick={() => setTakeTarget({ storageId: container.id, item })}
                            >
                              <Rune kind="arrow-r" size={12} color="currentColor" />
                              <span className={s.ml4}>{t('camp2.storage.take.action')}</span>
                            </button>
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

      {/* Deposit Item Dialog */}
      {depositStorageId && (
        <DepositDialog
          campaignId={campaignId!}
          storageId={depositStorageId}
          characters={eligibleCharacters}
          onClose={() => setDepositStorageId(null)}
        />
      )}

      {/* Take Item Dialog */}
      {takeTarget && (
        <TakeDialog
          campaignId={campaignId!}
          storageId={takeTarget.storageId}
          item={takeTarget.item}
          characters={eligibleCharacters}
          onClose={() => setTakeTarget(null)}
        />
      )}
    </div>
  );
}
