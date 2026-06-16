import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, Rune, OrdoField, EmptyVault, OrdoChip, OrdoDivider, Placeholder } from '@/components/ordo';
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
import { rarityColor, slotClass, itemGlyph } from '@/lib/itemVisuals';
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
  const [qty, setQty] = useState(1);
  const { data: inventory, isLoading } = useCharacterInventory(campaignId, characterId);
  const deposit = useDepositItem();

  const items = inventory ?? [];
  const selectedItem = items.find((it) => it.id === instanceId);
  const maxQty = selectedItem?.quantity ?? 1;
  const showQty = maxQty > 1;

  const clampQty = (n: number) => (Number.isNaN(n) ? 1 : Math.max(1, Math.min(maxQty, Math.floor(n))));

  const handleDeposit = () => {
    if (!instanceId || !characterId) return;
    deposit.mutate(
      { campaignId, storageId, instanceId, characterId, quantity: showQty ? qty : undefined },
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
                  onChange={(e) => { setCharacterId(e.target.value); setInstanceId(''); setQty(1); }}
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
                    onChange={(e) => {
                      setInstanceId(e.target.value);
                      const sel = items.find((it) => it.id === e.target.value);
                      setQty(sel?.quantity ?? 1);
                    }}
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
              {showQty && (
                <OrdoField label={t('camp2.storage.quantity')}>
                  <input
                    type="number"
                    className="ao-input"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => setQty(clampQty(Number(e.target.value)))}
                  />
                </OrdoField>
              )}
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
  const maxQty = item.quantity ?? 1;
  const showQty = maxQty > 1;
  const [qty, setQty] = useState(maxQty);
  const take = useTakeItem();

  const clampQty = (n: number) => (Number.isNaN(n) ? 1 : Math.max(1, Math.min(maxQty, Math.floor(n))));

  const handleTake = () => {
    if (!characterId) return;
    take.mutate(
      { campaignId, storageId, instanceId: item.id, characterId, quantity: showQty ? qty : undefined },
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
          {characters.length > 0 && showQty && (
            <OrdoField label={t('camp2.storage.quantity')}>
              <input
                type="number"
                className="ao-input"
                min={1}
                max={maxQty}
                value={qty}
                onChange={(e) => setQty(clampQty(Number(e.target.value)))}
              />
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

/* ── item preview (storage folio) ────────────────────────────── */

function StorageItemPreview({
  item,
  canInteract,
  onTake,
}: {
  item: StorageItemResponse;
  canInteract: boolean;
  onTake: () => void;
}) {
  const t = useT();
  const rarity = item.artifactRarity ?? item.rarity;
  const NA = '—';
  const stats: { label: string; value: string; color?: string }[] = [
    { label: t('camp2.storage.preview.type'), value: item.itemTypeName ?? item.templateName ?? NA },
    { label: t('camp2.storage.preview.rarity'), value: (rarity ?? 'COMMON').replace('_', ' '), color: rarityColor(rarity) },
    { label: t('camp2.storage.preview.quantity'), value: `x${item.quantity}` },
  ];

  return (
    <div className={s.previewBox}>
      <Placeholder className={s.previewImg}>{itemLabel(item)}</Placeholder>

      <div className={s.chipRow}>
        {rarity && (
          <OrdoChip tone={rarity === 'RARE' ? 'arcane' : 'gold'} glyph="diamond-fill">
            {rarity.replace('_', ' ')}
          </OrdoChip>
        )}
        {item.isUnique && (
          <OrdoChip tone="arcane" glyph="diamond">{t('camp2.storage.unique')}</OrdoChip>
        )}
      </div>

      <div className={cn('ao-h5', s.previewName)}>{item.artifactName ?? itemLabel(item)}</div>
      <div className={cn('ao-italic', s.previewType)}>{item.itemTypeName ?? item.templateName}</div>

      <OrdoDivider glyph="diamond-fill" color="var(--rule)" />

      <div className={cn('ao-rgrid', 'ao-rgrid--keep2', s.statGrid)}>
        {stats.map((st) => (
          <div key={st.label}>
            <div className="ao-overline">{st.label}</div>
            <div
              className={cn('ao-num', s.statValue)}
              style={st.color ? ({ '--stat-c': st.color } as CSSProperties) : undefined}
            >
              {st.value}
            </div>
          </div>
        ))}
      </div>

      {item.notes && (
        <>
          <OrdoDivider glyph="cross-pat" color="var(--rule)">{t('camp2.storage.preview.notes')}</OrdoDivider>
          <p className={cn('ao-italic', s.previewNotes)}>{item.notes}</p>
        </>
      )}

      {canInteract && (
        <div className={s.previewActions}>
          <button className={cn('ao-btn ao-btn--primary', s.grow)} onClick={onTake}>
            <Rune kind="arrow-r" size={11} color="currentColor" />
            <span className={s.ml6}>{t('camp2.storage.take.action')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── container card (tiles + preview) ────────────────────────── */

function StorageContainerCard({
  container,
  canInteract,
  onDeposit,
  onTake,
}: {
  container: StorageContainerResponse;
  canInteract: boolean;
  onDeposit: (storageId: string) => void;
  onTake: (storageId: string, item: StorageItemResponse) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items: StorageItemResponse[] = container.items ?? [];
  const selected = items.find((it) => it.id === selectedId) ?? null;

  return (
    <OrdoPanel frame padding={0}>
      <button onClick={() => setExpanded((v) => !v)} className={s.containerBtn}>
        <div className={s.containerIcon}>
          <Rune kind="sword" size={16} color="var(--brass)" />
        </div>
        <div className={s.containerMain}>
          <div className={s.containerName}>{container.name}</div>
          <div className={cn('ao-codex', s.containerCount)}>
            {items.length} {items.length === 1 ? t('camp2.storage.itemOne') : t('camp2.storage.itemMany')}
          </div>
        </div>
        <Rune kind={expanded ? 'chev-d' : 'chev-r'} size={14} color="var(--ink-faint)" />
      </button>

      {expanded && (
        <div className={s.itemsWrap}>
          {canInteract && (
            <div className={s.itemsActions}>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => onDeposit(container.id)}
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
            <div className={s.expandGrid}>
              <div className={s.cellGrid}>
                {items.map((item) => (
                  <button
                    key={item.id}
                    className={cn(slotClass(item.rarity), s.slotCell, item.id === selectedId && s.selected)}
                    onClick={() => setSelectedId(item.id)}
                    title={itemLabel(item)}
                  >
                    <Rune kind={itemGlyph(item)} size={18} color={rarityColor(item.rarity)} />
                    {item.quantity > 1 && (
                      <span className={cn('ao-num', s.qtyBadge)}>{item.quantity}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className={s.previewPanel}>
                {!selected ? (
                  <div className={s.previewEmpty}>
                    <Rune kind="diamond" size={24} color="var(--ink-faint)" />
                    <p className={cn('ao-italic', s.previewEmptyText)}>
                      {t('camp2.storage.preview.empty')}
                    </p>
                  </div>
                ) : (
                  <StorageItemPreview
                    item={selected}
                    canInteract={canInteract}
                    onTake={() => onTake(container.id, selected)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </OrdoPanel>
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
  const [depositStorageId, setDepositStorageId] = useState<string | null>(null);
  const [takeTarget, setTakeTarget] = useState<{ storageId: string; item: StorageItemResponse } | null>(null);

  // GM/Admin may move items for any character; a player only for their own.
  const eligibleCharacters = useMemo(() => {
    const all = characters ?? [];
    const isPrivileged = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
    return isPrivileged ? all : all.filter((c) => c.ownerId === user?.id);
  }, [characters, user?.id, user?.role]);

  const canInteract = eligibleCharacters.length > 0;

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
          {storageList.map((container: StorageContainerResponse) => (
            <StorageContainerCard
              key={container.id}
              container={container}
              canInteract={canInteract}
              onDeposit={(storageId) => setDepositStorageId(storageId)}
              onTake={(storageId, item) => setTakeTarget({ storageId, item })}
            />
          ))}
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
