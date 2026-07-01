import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackLink } from '@/components/campaigns';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  Placeholder,
  ErrorAltar,
} from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCharacterInventory,
  useEquippedInventory,
  useBackpackInventory,
  useTransferItem,
  useRenameItem,
  useEquipItem,
  useUnequipItem,
  useRemoveItem,
  useUpdateItemBuffs,
} from '@/hooks/useInventory';
import { useCharacter, useCharacterWallet, useCampaignCharacters } from '@/hooks/useCharacter';
import { useAuthStore } from '@/store/authStore';
import { rarityColor, slotClass, itemGlyph } from '@/lib/itemVisuals';
import { RarityBadge, rarityLabelKey } from '@/components/items/RarityBadge';
import { useT } from '@/i18n/I18nContext';
import { formatApproxGold, stackGoldValue } from '@/lib/price';
import { effectNature, effectSummary } from '@/lib/effects';
import type {
  ItemInstanceResponse,
  RenameItemRequest,
  EquipmentSlot,
} from '@/types';
import { GrantItemDialog } from './GrantItemDialog';
import { ItemBuffPickerDialog } from './ItemBuffPickerDialog';
import s from './InventoryPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

const SLOT_LAYOUT: { slot: EquipmentSlot; glyph: string }[] = [
  { slot: 'HEAD', glyph: 'helm' },
  { slot: 'NECK', glyph: 'cir-dot' },
  { slot: 'CLOAK', glyph: 'shield' },
  { slot: 'CHEST', glyph: 'shield' },
  { slot: 'MAIN_HAND', glyph: 'sword' },
  { slot: 'OFF_HAND', glyph: 'shield' },
  { slot: 'RING_LEFT', glyph: 'cir' },
  { slot: 'RING_RIGHT', glyph: 'cir' },
  { slot: 'LEGS', glyph: 'square' },
  { slot: 'FEET', glyph: 'tri-inv' },
];

const BAG_MIN_CELLS = 30;

const COIN_COLOR: Record<string, string> = {
  platinum: 'var(--ink-bright)',
  gold: 'var(--gold-pale)',
  silver: 'var(--ink)',
  copper: '#a87858',
};

/* ── page ────────────────────────────────────────────────────── */

export default function InventoryPage() {
  const t = useT();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data: inventory, isLoading, error, refetch } = useCharacterInventory(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const { data: backpack } = useBackpackInventory(campaignId!, characterId!);
  const { data: wallet } = useCharacterWallet(campaignId!, characterId!);
  const { data: campaignCharacters } = useCampaignCharacters(campaignId!);

  const transferMutation = useTransferItem();
  const renameMutation = useRenameItem();
  const equipMutation = useEquipItem();
  const unequipMutation = useUnequipItem();
  const removeMutation = useRemoveItem();
  const updateItemBuffsMutation = useUpdateItemBuffs();

  const [filterText, setFilterText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);
  const [itemBuffsOpen, setItemBuffsOpen] = useState(false);

  /* Transfer / Rename / Equip state */
  const [transferInstanceId, setTransferInstanceId] = useState('');
  const [transferToCharId, setTransferToCharId] = useState('');
  const [renameInstanceId, setRenameInstanceId] = useState('');
  const [renameCustomName, setRenameCustomName] = useState('');
  const [equipInstanceId, setEquipInstanceId] = useState('');
  const [equipSlot, setEquipSlot] = useState<EquipmentSlot>('MAIN_HAND');
  const [itemBuffsInstanceId, setItemBuffsInstanceId] = useState('');

  /* ── derived ───────────────────────────────────────────────── */

  const items: ItemInstanceResponse[] = useMemo(() => inventory ?? [], [inventory]);
  const equippedItems: ItemInstanceResponse[] = useMemo(() => equipped ?? [], [equipped]);
  const backpackItems: ItemInstanceResponse[] = useMemo(() => backpack ?? [], [backpack]);

  const equippedBySlot = useMemo(() => {
    const map = new Map<string, ItemInstanceResponse>();
    equippedItems.forEach((it) => { if (it.slot) map.set(it.slot, it); });
    return map;
  }, [equippedItems]);

  const filteredBag = useMemo(() => {
    if (!filterText) return backpackItems;
    const q = filterText.toLowerCase();
    return backpackItems.filter(
      (item) =>
        item.templateName.toLowerCase().includes(q) ||
        (item.displayName?.toLowerCase() ?? '').includes(q) ||
        (item.customName?.toLowerCase() ?? '').includes(q),
    );
  }, [backpackItems, filterText]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const itemBuffsTarget = useMemo(
    () => items.find((i) => i.id === itemBuffsInstanceId) ?? null,
    [items, itemBuffsInstanceId],
  );

  const transferCandidates = useMemo(
    () => (campaignCharacters ?? []).filter((c) => c.status === 'ACTIVE' && c.id !== characterId),
    [campaignCharacters, characterId],
  );

  const slotsFilled = equippedItems.length;
  const attunedCount = items.filter((i) => i.isUnique || i.artifactName).length;
  const inventoryValueGold = useMemo(
    () => items.reduce((sum, item) => sum + (stackGoldValue(item.priceGold, item.quantity) ?? 0), 0),
    [items],
  );
  const pricedItemsCount = items.filter((item) => stackGoldValue(item.priceGold, item.quantity) != null).length;
  const unpricedItemsCount = Math.max(0, items.length - pricedItemsCount);

  /* ── handlers ──────────────────────────────────────────────── */

  const handleTransfer = () => {
    if (!campaignId || !characterId || !transferInstanceId || !transferToCharId) return;
    transferMutation.mutate(
      { campaignId, fromCharId: characterId, instanceId: transferInstanceId, data: { toCharacterId: transferToCharId } },
      {
        onSuccess: () => {
          setTransferOpen(false);
          setTransferInstanceId('');
          setTransferToCharId('');
          setSelectedId(null);
        },
      },
    );
  };

  const handleRename = () => {
    if (!campaignId || !characterId || !renameInstanceId) return;
    const data: RenameItemRequest = { customName: renameCustomName, renameEntireStack: true };
    renameMutation.mutate(
      { campaignId, characterId, instanceId: renameInstanceId, data },
      {
        onSuccess: () => {
          setRenameOpen(false);
          setRenameInstanceId('');
          setRenameCustomName('');
        },
      },
    );
  };

  const handleEquip = () => {
    if (!campaignId || !characterId || !equipInstanceId) return;
    equipMutation.mutate(
      { campaignId, characterId, instanceId: equipInstanceId, data: { slot: equipSlot } },
      {
        onSuccess: () => {
          setEquipOpen(false);
          setEquipInstanceId('');
        },
      },
    );
  };

  const handleUnequip = (item: ItemInstanceResponse) => {
    if (!campaignId || !characterId) return;
    unequipMutation.mutate({ campaignId, characterId, instanceId: item.id });
  };

  const handleRemove = (item: ItemInstanceResponse) => {
    if (!campaignId || !characterId) return;
    removeMutation.mutate(
      { campaignId, characterId, instanceId: item.id },
      { onSuccess: () => setSelectedId(null) },
    );
  };

  const openRename = (item: ItemInstanceResponse) => {
    setRenameInstanceId(item.id);
    setRenameCustomName(item.customName ?? item.displayName);
    setRenameOpen(true);
  };

  const openTransfer = (item: ItemInstanceResponse) => {
    setTransferInstanceId(item.id);
    setTransferToCharId('');
    setTransferOpen(true);
  };

  const openEquip = (item: ItemInstanceResponse) => {
    setEquipInstanceId(item.id);
    setEquipSlot(item.slot ?? 'MAIN_HAND');
    setEquipOpen(true);
  };

  const openItemBuffs = (item: ItemInstanceResponse) => {
    setItemBuffsInstanceId(item.id);
    setItemBuffsOpen(true);
  };

  const handleSaveItemBuffs = (buffDebuffIds: string[]) => {
    if (!campaignId || !characterId || !itemBuffsInstanceId) return;
    updateItemBuffsMutation.mutate(
      { campaignId, characterId, instanceId: itemBuffsInstanceId, buffDebuffIds },
      {
        onSuccess: () => {
          setItemBuffsOpen(false);
          setItemBuffsInstanceId('');
        },
      },
    );
  };

  /* ── loading / error ───────────────────────────────────────── */

  const backTo = `/campaigns/${campaignId}/characters/${characterId}`;

  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
        <PageHeader name={character?.name} slotsFilled={0} held={0} />
        <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-rgrid', s.cellGrid, s.slotGrid)}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={cn('ao-ph', s.phCell)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
        <ErrorAltar
          title={t('camp2.inv.loadError')}
          error={error}
          onRetry={() => refetch()}
          retryLabel={t('common.retry')}
        />
      </div>
    );
  }

  /* ── render ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
      <PageHeader
        name={character?.name}
        slotsFilled={slotsFilled}
        held={items.length}
        right={
          <div className={s.headerActions}>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setShowSearch((s) => !s)}
            >
              <Rune kind="filter" size={11} /> {t('camp2.inv.filter')}
            </button>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => selected && openTransfer(selected)}
              disabled={!selected}
            >
              <Rune kind="arrow-r" size={11} /> {t('camp2.inv.transfer')}
            </button>
            {isGm && (
              <button className="ao-btn ao-btn--primary" onClick={() => setGrantOpen(true)}>
                <Rune kind="plus" size={11} /> {t('camp2.inv.inscribeRelic')}
              </button>
            )}
          </div>
        }
      />

      <div className={cn('ao-rgrid', s.mainGrid)}>
        {/* ── LEFT: equipped slots (paper-doll) ──────────── */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.inv.boundToBody')}
            sub={t('camp2.inv.boundSub', { slots: SLOT_LAYOUT.length, attuned: attunedCount })}
            glyph="shield"
          />
          <div className={s.panelPad}>
            <div className={s.dollWrap}>
              <Placeholder className={s.dollFill}>
                {t('camp2.inv.silhouette')} · {character?.name ?? t('camp2.inv.vellan')}
              </Placeholder>
              {[
                { t: 14, l: '50%' }, { t: 64, l: 14 }, { t: 64, r: 14 },
                { t: 130, l: '50%' }, { t: 200, l: 14 }, { t: 200, r: 14 },
                { t: 260, l: '50%' },
              ].map((p, i) => (
                <div
                  key={i}
                  className={s.dollSlot}
                  style={{ top: p.t, left: p.l, right: p.r }}
                >
                  <Rune
                    kind={['helm', 'shield', 'sword', 'flame', 'square', 'tri-inv', 'cir-dot'][i] || 'square'}
                    size={14}
                    color="var(--gold-pale)"
                  />
                </div>
              ))}
            </div>

            <OrdoDivider glyph="diamond-fill" color="var(--rule)">{t('camp2.inv.loadout')}</OrdoDivider>

            <div className={cn('ao-rgrid', s.quad, s.slotGrid)}>
              {SLOT_LAYOUT.map(({ slot, glyph }) => {
                const it = equippedBySlot.get(slot);
                const isSel = it != null && it.id === selectedId;
                const label = t(`camp2.inv.slotLabel.${slot}`);
                return (
                  <button
                    key={slot}
                    title={it ? `${label}: ${it.displayName}` : label}
                    onClick={() => (it ? setSelectedId(it.id) : null)}
                    className={cn(it ? slotClass(it.rarity) : 'ao-slot', s.slotCell, !it && s.empty, isSel && s.selected)}
                  >
                    {it ? (
                      <Rune kind={glyph} size={20} color={rarityColor(it.rarity)} />
                    ) : (
                      <span className={s.slotPlus}>+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </OrdoPanel>

        {/* ── MIDDLE: bag grid + coin ────────────────────── */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.inv.theBag')}
            sub={t('camp2.inv.bagSub', { held: backpackItems.length, max: BAG_MIN_CELLS })}
            glyph="scroll"
            right={
              <div className={s.iconRow}>
                <button
                  className={cn('ao-iconbtn', s.iconBtn28)}
                  onClick={() => setShowSearch((v) => !v)}
                  title={t('camp2.inv.search')}
                >
                  <Rune kind="search" size={12} />
                </button>
                {isGm && (
                  <button
                    className={cn('ao-iconbtn', s.iconBtn28)}
                    onClick={() => setGrantOpen(true)}
                    title={t('camp2.inv.grantItem')}
                  >
                    <Rune kind="plus" size={12} />
                  </button>
                )}
              </div>
            }
          />
          <div className={s.panelPad}>
            {showSearch && (
              <div className={s.searchBar}>
                <Rune kind="search" size={13} color="var(--ink-faint)" />
                <input
                  autoFocus
                  className={s.searchInput}
                  placeholder={t('camp2.inv.searchBag')}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
                {filterText && (
                  <button
                    onClick={() => setFilterText('')}
                    className={s.searchClear}
                    title={t('camp2.inv.clear')}
                  >
                    <Rune kind="x" size={11} color="var(--ink-faint)" />
                  </button>
                )}
              </div>
            )}

            <div className={cn('ao-rgrid', s.cellGrid, s.slotGrid)}>
              {Array.from({ length: Math.max(BAG_MIN_CELLS, filteredBag.length) }).map((_, i) => {
                const item = filteredBag[i];
                if (!item) return <div key={i} className={cn('ao-slot', s.phCell)} />;
                const isSel = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    className={cn(slotClass(item.rarity), s.slotCell, isSel && s.selected)}
                    onClick={() => setSelectedId(item.id)}
                    title={item.displayName}
                  >
                    <Rune kind={itemGlyph(item)} size={18} color={rarityColor(item.rarity)} />
                    {item.quantity > 1 && (
                      <span className={cn('ao-num', s.qtyBadge)}>
                        {item.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {backpackItems.length === 0 && (
              <p className={cn('ao-italic', s.bagEmpty)}>
                {t('camp2.inv.bagEmpty')}
              </p>
            )}
            {backpackItems.length > 0 && filteredBag.length === 0 && (
              <p className={cn('ao-italic', s.bagEmpty)}>
                {t('camp2.inv.noMatch')}
              </p>
            )}

            <OrdoDivider glyph="diamond-fill" color="var(--rule)">{t('camp2.inv.coinWealth')}</OrdoDivider>

            <div className={s.valueCard}>
              <Rune kind="coin" size={16} color="var(--gold-pale)" />
              <div className={s.valueMain}>
                <div className={cn('ao-overline', s.coinLabel)}>Inventory value</div>
                <div className={cn('ao-num', s.valueAmount)}>
                  {pricedItemsCount > 0 ? formatApproxGold(inventoryValueGold) : '-'}
                </div>
                {unpricedItemsCount > 0 && (
                  <div className={s.valueHint}>{unpricedItemsCount} without price</div>
                )}
              </div>
            </div>

            {wallet && wallet.length > 0 ? (
              <div className={cn('ao-rgrid', 'ao-rgrid--keep2', s.quad)}>
                {wallet.map((c) => {
                  const color = COIN_COLOR[c.currencyName.toLowerCase()] ?? 'var(--gold-pale)';
                  return (
                    <div key={c.currencyTypeId} className={s.coinCard}>
                      <Rune kind="coin" size={16} color={color} />
                      <div className={s.coinMain}>
                        <div className={cn('ao-overline', s.coinLabel)}>{c.currencyName}</div>
                        <div className={cn('ao-num', s.coinAmount)} style={{ '--coin': color } as CSSProperties}>{c.amount}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={cn('ao-italic', s.noCoin)}>
                {t('camp2.inv.noCoin')}
              </p>
            )}
          </div>
        </OrdoPanel>

        {/* ── RIGHT: selected item detail (Relic Folio) ──── */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.inv.relicFolio')}
            sub={selected ? selected.displayName : t('camp2.inv.noRelicChosen')}
            glyph="sword"
            tone="ember"
          />
          {!selected ? (
            <div className={s.folioEmpty}>
              <Rune kind="diamond" size={26} color="var(--ink-faint)" />
              <p className={cn('ao-italic', s.folioEmptyText)}>
                {t('camp2.inv.selectToInspect')}
              </p>
            </div>
          ) : (
            <RelicDetail
              item={selected}
              isGm={isGm}
              busy={equipMutation.isPending || unequipMutation.isPending || removeMutation.isPending || updateItemBuffsMutation.isPending}
              onEquip={() => openEquip(selected)}
              onUnequip={() => handleUnequip(selected)}
              onRename={() => openRename(selected)}
              onTransfer={() => openTransfer(selected)}
              onConfigureBuffs={() => openItemBuffs(selected)}
              onRemove={() => handleRemove(selected)}
            />
          )}
        </OrdoPanel>
      </div>

      {/* Grant Item Dialog */}
      <GrantItemDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        campaignId={campaignId!}
        characterId={characterId!}
      />

      <ItemBuffPickerDialog
        open={itemBuffsOpen}
        onOpenChange={setItemBuffsOpen}
        selectedIds={itemBuffsTarget?.itemBuffs?.map((effect) => effect.id) ?? []}
        onSave={handleSaveItemBuffs}
        saving={updateItemBuffsMutation.isPending}
        title="Configure item buffs"
        itemName={itemBuffsTarget?.displayName}
      />

      {/* Equip Dialog */}
      <Dialog open={equipOpen} onOpenChange={setEquipOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('camp2.inv.dialog.equipTitle')}</DialogTitle></DialogHeader>
          <div className={s.dialogCol}>
            <div>
              <label className="ao-label">{t('camp2.inv.field.slot')}</label>
              <select className="ao-input" value={equipSlot} onChange={(e) => setEquipSlot(e.target.value as EquipmentSlot)}>
                {SLOT_LAYOUT.map((sl) => (
                  <option key={sl.slot} value={sl.slot}>{t(`camp2.inv.slotLabel.${sl.slot}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setEquipOpen(false)} disabled={equipMutation.isPending}>{t('camp2.inv.withhold')}</button>
            <button className="ao-btn ao-btn--primary" onClick={handleEquip} disabled={equipMutation.isPending}>
              {equipMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.inv.equip')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('camp2.inv.dialog.transferTitle')}</DialogTitle></DialogHeader>
          <div className={s.dialogCol12}>
            <label className="ao-label">{t('camp2.inv.field.chooseRecipient')}</label>
            {transferCandidates.length === 0 ? (
              <p className={cn('ao-italic', s.recipientEmpty)}>
                {t('camp2.inv.field.noActiveChars')}
              </p>
            ) : (
              <div className={s.recipientList}>
                {transferCandidates.map((c) => {
                  const isSel = c.id === transferToCharId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTransferToCharId(c.id)}
                      className={cn(s.recipient, isSel && s.selected)}
                    >
                      <Rune kind="cir-dot" size={14} color={isSel ? 'var(--gold)' : 'var(--ink-faint)'} />
                      <div className={s.recipientMain}>
                        <div className={s.recipientName}>{c.name}</div>
                        <div className={s.recipientMeta}>
                          {c.classLevels?.[0]?.className ?? ''} · {t('camp2.inv.field.ownerLabel', { owner: c.ownerUsername })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending}>{t('camp2.inv.withhold')}</button>
            <button className="ao-btn ao-btn--primary" onClick={handleTransfer} disabled={!transferToCharId || transferMutation.isPending}>
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.inv.transfer')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('camp2.inv.dialog.renameTitle')}</DialogTitle></DialogHeader>
          <div className={s.dialogCol}>
            <div>
              <label className="ao-label">{t('camp2.inv.field.customName')}</label>
              <input className="ao-input" value={renameCustomName} onChange={(e) => setRenameCustomName(e.target.value)} placeholder={t('camp2.inv.field.newName')} />
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setRenameOpen(false)} disabled={renameMutation.isPending}>{t('camp2.inv.withhold')}</button>
            <button className="ao-btn ao-btn--primary" onClick={handleRename} disabled={!renameCustomName || renameMutation.isPending}>
              {renameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.inv.rename')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── page header ─────────────────────────────────────────────── */

function PageHeader({
  name,
  slotsFilled,
  held,
  right,
}: {
  name?: string;
  slotsFilled: number;
  held: number;
  right?: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className={s.pageHeader}>
      <div>
        <p className={cn('ao-overline', s.headerOverline)}>{t('camp2.inv.armaments')}</p>
        <h3 className={cn('ao-h3', s.headerTitle)}>{t('camp2.inv.arsenalReliquary')}</h3>
        <p className={cn('ao-italic', s.headerSub)}>
          {t('camp2.inv.headerSub', { name: name ?? t('camp2.inv.headerLoadout'), slots: slotsFilled, held })}
        </p>
      </div>
      {right}
    </div>
  );
}

/* ── relic detail ────────────────────────────────────────────── */

function RelicDetail({
  item,
  isGm,
  busy,
  onEquip,
  onUnequip,
  onRename,
  onTransfer,
  onConfigureBuffs,
  onRemove,
}: {
  item: ItemInstanceResponse;
  isGm: boolean;
  busy: boolean;
  onEquip: () => void;
  onUnequip: () => void;
  onRename: () => void;
  onTransfer: () => void;
  onConfigureBuffs: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const rarity = item.artifactRarity ?? item.rarity;
  const dmgEnchant = item.enchantments?.find((e) => e.enchantmentType.damageDice);
  const NA = '—';

  const stats: { label: string; value: string; color?: string }[] = [
    {
      label: t('camp2.inv.relic.damage'),
      value: dmgEnchant?.enchantmentType.damageDice
        ? `${dmgEnchant.enchantmentType.damageDice}${dmgEnchant.enchantmentType.damageBonus ? ` + ${dmgEnchant.enchantmentType.damageBonus}` : ''}`
        : NA,
      color: dmgEnchant ? 'var(--ink-bright)' : undefined,
    },
    { label: t('camp2.inv.relic.type'), value: item.itemTypeName ?? item.templateName },
    { label: t('camp2.inv.relic.rarity'), value: t(rarityLabelKey(rarity)), color: rarityColor(rarity) },
    { label: t('camp2.inv.relic.slot'), value: item.slot ? item.slot.replace('_', ' ') : t('camp2.inv.relic.unbound') },
    { label: 'Price', value: formatApproxGold(item.priceGold), color: item.priceGold != null ? 'var(--gold-pale)' : undefined },
    { label: t('camp2.inv.relic.quantity'), value: `x${item.quantity}` },
    { label: t('camp2.inv.relic.charges'), value: NA },
  ];

  return (
    <div className={s.relicBox}>
      <Placeholder className={s.relicImg}>
        {item.displayName}
      </Placeholder>

      <div className={s.chipRow}>
        {rarity && <RarityBadge rarity={rarity} size="md" />}
        {item.slot && <OrdoChip tone="ember" glyph="flame">{t('camp2.inv.relic.equipped')}</OrdoChip>}
        {item.isUnique && <OrdoChip tone="arcane" glyph="diamond">{t('camp2.inv.relic.unique')}</OrdoChip>}
      </div>

      <div className={cn('ao-h5', s.relicName)}>{item.artifactName ?? item.displayName}</div>
      <div className={cn('ao-italic', s.relicType)}>
        {item.itemTypeName ?? item.templateName}
      </div>

      <OrdoDivider glyph="diamond-fill" color="var(--rule)" />

      <div className={cn('ao-rgrid', 'ao-rgrid--keep2', s.statGrid)}>
        {stats.map((st) => (
          <div key={st.label}>
            <div className="ao-overline">{st.label}</div>
            <div className={cn('ao-num', s.statValue)} style={st.color ? { color: st.color } : undefined}>{st.value}</div>
          </div>
        ))}
      </div>

      <OrdoDivider glyph="cross-pat" color="var(--rule)">{t('camp2.inv.relic.inscription')}</OrdoDivider>

      {item.enchantments && item.enchantments.length > 0 ? (
        <div className={s.enchList}>
          {item.enchantments.map((e) => (
            <div key={e.id} className={s.enchRow}>
              <Rune kind="diamond" size={8} color="var(--arcane)" />
              <div className={s.enchMain}>
                <div className={s.enchName}>{e.enchantmentType.name}</div>
                {(e.notes ?? e.enchantmentType.description) && (
                  <div className={cn('ao-italic', s.enchDesc)}>
                    {e.notes ?? e.enchantmentType.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={cn('ao-italic', s.noEnch)}>
          {t('camp2.inv.relic.noInscriptions')}
        </p>
      )}

      {item.templateBuffs && item.templateBuffs.length > 0 && (
        <>
          <OrdoDivider glyph="hex" color="var(--rule)">Template effects</OrdoDivider>
          <div className={s.effectList}>
            {item.templateBuffs.map((effect) => (
              <div key={effect.id} className={s.effectRow} style={{ '--c': effect.isBuff ? '#7a9866' : '#c0584a' } as CSSProperties}>
                <Rune kind={effect.isBuff ? 'diamond-fill' : 'tri-inv'} size={8} color="var(--c)" />
                <div className={s.effectMain}>
                  <div className={s.effectName}>
                    {effect.name}
                    <span className={s.effectKind}>{effectNature(effect)}</span>
                  </div>
                  <div className={cn('ao-italic', s.effectDesc)}>
                    {effectSummary(effect) || effect.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {item.itemBuffs && item.itemBuffs.length > 0 && (
        <>
          <OrdoDivider glyph="hex" color="var(--rule)">Item buffs</OrdoDivider>
          <div className={s.effectList}>
            {item.itemBuffs.map((effect) => (
              <div key={effect.id} className={s.effectRow} style={{ '--c': effect.isBuff ? '#7a9866' : '#c0584a' } as CSSProperties}>
                <Rune kind={effect.isBuff ? 'diamond-fill' : 'tri-inv'} size={8} color="var(--c)" />
                <div className={s.effectMain}>
                  <div className={s.effectName}>
                    {effect.name}
                    <span className={s.effectKind}>{effectNature(effect)}</span>
                  </div>
                  <div className={cn('ao-italic', s.effectDesc)}>
                    {effectSummary(effect) || effect.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <OrdoDivider glyph="diamond-fill" color="var(--rule)">{t('camp2.inv.relic.provenance')}</OrdoDivider>

      <div className={s.provList}>
        <div className={s.provRow}>
          <Rune kind="diamond" size={8} color="var(--bronze)" />
          <span>{t('camp2.inv.relic.template')} · {item.templateName}</span>
        </div>
        {item.customName && item.customName !== item.templateName && (
          <div className={s.provRow}>
            <Rune kind="diamond" size={8} color="var(--bronze)" />
            <span>{t('camp2.inv.relic.renamed')} · {item.customName}</span>
          </div>
        )}
        {item.notes && (
          <div className={s.provRow}>
            <Rune kind="diamond" size={8} color="var(--bronze)" />
            <span>{item.notes}</span>
          </div>
        )}
      </div>

      <div className={s.relicActions}>
        {item.slot ? (
          <button className={cn('ao-btn ao-btn--primary', s.grow)} onClick={onUnequip} disabled={busy}>
            <Rune kind="x" size={10} /> {t('camp2.inv.relic.unequip')}
          </button>
        ) : (
          <button className={cn('ao-btn ao-btn--primary', s.grow)} onClick={onEquip} disabled={busy}>
            <Rune kind="check" size={10} /> {t('camp2.inv.relic.equip')}
          </button>
        )}
        <button className="ao-btn ao-btn--ghost" onClick={onRename} title={t('camp2.inv.relic.renameTitle')}><Rune kind="scroll" size={10} /></button>
        <button className="ao-btn ao-btn--ghost" onClick={onTransfer} title={t('camp2.inv.relic.transferTitle')}><Rune kind="arrow-r" size={10} /></button>
        {isGm && (
          <>
            <button className="ao-btn ao-btn--ghost" onClick={onConfigureBuffs} disabled={busy} title="Configure item buffs"><Rune kind="hex" size={10} /></button>
            <button className="ao-btn ao-btn--danger" onClick={onRemove} disabled={busy} title={t('camp2.inv.relic.removeTitle')}><Rune kind="x" size={10} /></button>
          </>
        )}
      </div>
    </div>
  );
}
