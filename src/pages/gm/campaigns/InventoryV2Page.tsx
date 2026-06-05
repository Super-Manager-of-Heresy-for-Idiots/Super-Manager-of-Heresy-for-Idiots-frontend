import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  EmptyVault,
} from '@/components/ordo';
import { WalletPanel } from '@/components/characters/v2';
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
  useGrantItem,
  useTransferItem,
  useRenameItem,
  useEquipItem,
  useUnequipItem,
} from '@/hooks/useInventoryV2';
import { useCharacterV2, useCharacterWallet } from '@/hooks/useCharacterV2';
import { useAuthStore } from '@/store/authStore';
import type {
  ItemInstanceResponse,
  GrantItemRequest,
  RenameItemRequest,
  EquipmentSlot,
} from '@/types';

/* ── helpers ─────────────────────────────────────────────────── */

function rarityColor(rarity?: string): string {
  switch (rarity) {
    case 'LEGENDARY': return '#ff8c00';
    case 'VERY_RARE': return '#a855f7';
    case 'RARE':      return '#3b82f6';
    case 'UNCOMMON':  return '#22c55e';
    default:          return 'var(--ink-faint)';
  }
}

const SLOT_LAYOUT: { slot: EquipmentSlot; label: string; glyph: string }[] = [
  { slot: 'HEAD',       label: 'Head',         glyph: 'helm' },
  { slot: 'NECK',       label: 'Neck',         glyph: 'cir-dot' },
  { slot: 'CLOAK',      label: 'Cloak',        glyph: 'shield' },
  { slot: 'CHEST',      label: 'Chest',        glyph: 'shield' },
  { slot: 'MAIN_HAND',  label: 'Main Hand',    glyph: 'sword' },
  { slot: 'OFF_HAND',   label: 'Off Hand',     glyph: 'shield' },
  { slot: 'RING_LEFT',  label: 'Ring · Left',  glyph: 'cir' },
  { slot: 'RING_RIGHT', label: 'Ring · Right', glyph: 'cir' },
  { slot: 'LEGS',       label: 'Legs',         glyph: 'shield' },
  { slot: 'FEET',       label: 'Feet',         glyph: 'shield' },
];

const ALL_SLOTS: EquipmentSlot[] = SLOT_LAYOUT.map((s) => s.slot);

/* ── page ────────────────────────────────────────────────────── */

export default function InventoryV2Page() {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();
  const canGrantItem = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const { data: character } = useCharacterV2(campaignId!, characterId!);
  const { data: inventory, isLoading, error, refetch } = useCharacterInventory(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const { data: backpack } = useBackpackInventory(campaignId!, characterId!);
  const { data: wallet } = useCharacterWallet(campaignId!, characterId!);

  const grantMutation = useGrantItem();
  const transferMutation = useTransferItem();
  const renameMutation = useRenameItem();
  const equipMutation = useEquipItem();
  const unequipMutation = useUnequipItem();

  const [filterText, setFilterText] = useState('');
  const [selected, setSelected] = useState<ItemInstanceResponse | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);

  /* Grant form */
  const [grantTemplateId, setGrantTemplateId] = useState('');
  const [grantQuantity, setGrantQuantity] = useState('1');
  const [grantUnique, setGrantUnique] = useState(false);
  const [grantCustomName, setGrantCustomName] = useState('');

  /* Transfer / Rename / Equip state */
  const [transferInstanceId, setTransferInstanceId] = useState('');
  const [transferToCharId, setTransferToCharId] = useState('');
  const [renameInstanceId, setRenameInstanceId] = useState('');
  const [renameCustomName, setRenameCustomName] = useState('');
  const [equipInstanceId, setEquipInstanceId] = useState('');
  const [equipSlot, setEquipSlot] = useState<EquipmentSlot>('MAIN_HAND');

  /* ── derived ───────────────────────────────────────────────── */

  const items: ItemInstanceResponse[] = inventory ?? [];
  const equippedItems: ItemInstanceResponse[] = equipped ?? [];
  const backpackItems: ItemInstanceResponse[] = backpack ?? [];

  const equippedBySlot = useMemo(() => {
    const map = new Map<string, ItemInstanceResponse>();
    equippedItems.forEach((it) => { if (it.slot) map.set(it.slot, it); });
    return map;
  }, [equippedItems]);

  const relics = useMemo(() => items.filter((i) => i.isUnique || i.artifactName), [items]);

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

  const slotsFilled = equippedItems.length;

  /* ── handlers ──────────────────────────────────────────────── */

  const handleGrant = () => {
    if (!campaignId || !characterId || !grantTemplateId) return;
    const data: GrantItemRequest = {
      templateId: grantTemplateId,
      quantity: Number(grantQuantity) || 1,
      isUnique: grantUnique || undefined,
      customName: grantCustomName || undefined,
    };
    grantMutation.mutate(
      { campaignId, characterId, data },
      {
        onSuccess: () => {
          setGrantOpen(false);
          setGrantTemplateId('');
          setGrantQuantity('1');
          setGrantUnique(false);
          setGrantCustomName('');
        },
      },
    );
  };

  const handleTransfer = () => {
    if (!campaignId || !characterId || !transferInstanceId || !transferToCharId) return;
    transferMutation.mutate(
      { campaignId, fromCharId: characterId, instanceId: transferInstanceId, data: { toCharacterId: transferToCharId } },
      {
        onSuccess: () => {
          setTransferOpen(false);
          setTransferInstanceId('');
          setTransferToCharId('');
          setSelected(null);
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
          setSelected(null);
        },
      },
    );
  };

  const handleUnequip = (item: ItemInstanceResponse) => {
    if (!campaignId || !characterId) return;
    unequipMutation.mutate(
      { campaignId, characterId, instanceId: item.id },
      { onSuccess: () => setSelected(null) },
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

  /* ── loading / error ───────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Armaments</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Arsenal &amp; Reliquary</h3>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 300 }}>
          <span className="ao-frame-c" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div className="ao-ph" style={{ width: '30%', height: 14 }} />
              <div className="ao-ph" style={{ width: '15%', height: 14 }} />
              <div className="ao-ph" style={{ width: '10%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The arsenal could not be inspected. Its wards remain unbroken.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── render ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Armaments</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Arsenal &amp; Reliquary</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
            {character?.name ?? 'Loadout'} · {slotsFilled} slot{slotsFilled !== 1 ? 's' : ''} bound · {items.length} held
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--rule)', background: 'var(--abyss)' }}>
            <Rune kind="search" size={14} color="var(--ink-faint)" />
            <input
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 13, width: 140 }}
              placeholder="Filter the bag..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          {canGrantItem && (
            <button className="ao-btn ao-btn--primary" onClick={() => setGrantOpen(true)}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>Grant Item</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Left column: Loadout + Coin ── */}
        <div style={{ flex: '1 1 320px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Loadout */}
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="Loadout"
              glyph="helm"
              tone="gold"
              right={<span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)' }}>{slotsFilled} / {ALL_SLOTS.length} · — attuned</span>}
            />
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SLOT_LAYOUT.map(({ slot, label, glyph }) => {
                const it = equippedBySlot.get(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => it && setSelected(it)}
                    className="ao-panel"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: it ? 'pointer' : 'default',
                      border: `1px solid ${it ? `${rarityColor(it.rarity)}55` : 'var(--hairline)'}`,
                      background: 'var(--abyss)',
                      opacity: it ? 1 : 0.55,
                    }}
                  >
                    <Rune kind={glyph} size={14} color={it ? rarityColor(it.rarity) : 'var(--ink-faint)'} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="ao-overline" style={{ fontSize: 7, color: 'var(--ink-faint)', display: 'block' }}>{label}</span>
                      <span style={{ fontSize: 11, color: it ? 'var(--ink-bright)' : 'var(--ink-ghost)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it ? it.displayName : 'empty'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </OrdoPanel>

          {/* Coin & Wealth */}
          <WalletPanel characterId={characterId!} wallet={wallet ?? []} />
        </div>

        {/* ── Middle column: Relic Folio + The Bag ── */}
        <div style={{ flex: '1.4 1 360px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Relic Folio */}
          <OrdoPanel frame padding={0}>
            <PanelHeader title="Relic Folio" glyph="diamond" tone="arcane" right={<OrdoChip tone="arcane" glyph="diamond">{relics.length}</OrdoChip>} />
            {relics.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>No relics are sealed in this folio.</p>
              </div>
            ) : (
              relics.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                    padding: '12px 18px', cursor: 'pointer', background: 'none',
                    border: 'none', borderBottom: idx < relics.length - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <Rune kind="diamond" size={14} color={rarityColor(item.artifactRarity ?? item.rarity)} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-bright)', display: 'block' }}>{item.artifactName ?? item.displayName}</span>
                    {item.rarity && (
                      <span className="ao-overline" style={{ fontSize: 8, color: rarityColor(item.rarity) }}>{item.rarity.replace('_', ' ')}</span>
                    )}
                  </span>
                  <Rune kind="chev-r" size={12} color="var(--ink-faint)" />
                </button>
              ))
            )}
          </OrdoPanel>

          {/* The Bag */}
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="The Bag"
              glyph="sword"
              right={<span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)' }}>{filteredBag.length} · weight —</span>}
            />
            {backpackItems.length === 0 ? (
              <EmptyVault
                glyph="sword"
                title="Empty Bag"
                body={canGrantItem ? 'No items rest in the bag. Grant equipment to fill it.' : 'No items rest in the bag.'}
                action={canGrantItem ? (
                  <button className="ao-btn ao-btn--primary" onClick={() => setGrantOpen(true)}>
                    <Rune kind="plus" size={14} color="currentColor" />
                    <span style={{ marginLeft: 6 }}>Grant Item</span>
                  </button>
                ) : undefined}
              />
            ) : filteredBag.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>No items match thy inquiry.</p>
              </div>
            ) : (
              filteredBag.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: idx < filteredBag.length - 1 ? '1px solid var(--hairline)' : 'none' }}
                >
                  <button
                    onClick={() => setSelected(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ width: 30, height: 30, border: `1px solid ${rarityColor(item.rarity)}44`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Rune kind="sword" size={13} color={rarityColor(item.rarity)} />
                    </div>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-bright)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.displayName}</span>
                      {item.itemTypeName && (
                        <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{item.itemTypeName}</span>
                      )}
                    </span>
                    {item.isUnique && <OrdoChip tone="arcane" glyph="diamond">UNIQUE</OrdoChip>}
                  </button>
                  <span className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-quiet)', fontFamily: 'var(--font-mono)', minWidth: 34, textAlign: 'right' }}>x{item.quantity}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => openEquip(item)} title="Equip"><Rune kind="shield" size={10} /></button>
                    <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => openRename(item)} title="Rename"><Rune kind="scroll" size={10} /></button>
                    <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => openTransfer(item)} title="Transfer"><Rune kind="arrow-r" size={10} /></button>
                  </div>
                </div>
              ))
            )}
          </OrdoPanel>
        </div>

        {/* ── Right column: Item detail / Provenance ── */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <OrdoPanel frame padding={0}>
            <PanelHeader title="Provenance" glyph="eye" tone="gold" />
            {!selected ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                  Select an item to inspect its lineage.
                </p>
              </div>
            ) : (
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Rune kind={selected.isUnique ? 'diamond' : 'sword'} size={18} color={rarityColor(selected.artifactRarity ?? selected.rarity)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: 'var(--ink-bright)', fontFamily: 'var(--font-display)' }}>{selected.artifactName ?? selected.displayName}</div>
                    {selected.customName && selected.customName !== selected.templateName && (
                      <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-ghost)' }}>({selected.templateName})</div>
                    )}
                  </div>
                </div>

                <OrdoDivider glyph="diamond" color="var(--rule)" />

                <DetailRow label="Type" value={selected.itemTypeName ?? '—'} />
                <DetailRow label="Rarity" value={(selected.rarity ?? 'COMMON').replace('_', ' ')} color={rarityColor(selected.rarity)} />
                <DetailRow label="Slot" value={selected.slot ? selected.slot.replace('_', ' ') : 'Unbound'} />
                <DetailRow label="Quantity" value={`x${selected.quantity}`} />
                <DetailRow label="Enchantments" value={selected.enchantments?.length ? `${selected.enchantments.length}` : 'None'} color={selected.enchantments?.length ? 'var(--arcane)' : undefined} />

                {/* Fields not provided by the API */}
                <DetailRow label="Weight" value="—" muted />
                <DetailRow label="Charges" value="—" muted />
                <DetailRow label="Inscription" value="—" muted />

                {selected.notes && (
                  <p className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 12, lineHeight: 1.5 }}>
                    {selected.notes}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                  {selected.slot ? (
                    <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => handleUnequip(selected)} disabled={unequipMutation.isPending}>
                      Unequip
                    </button>
                  ) : (
                    <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => openEquip(selected)}>
                      Equip
                    </button>
                  )}
                  <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => openRename(selected)}>Rename</button>
                </div>
              </div>
            )}
          </OrdoPanel>
        </div>
      </div>

      {/* Grant Item Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant Item</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Template ID</label>
              <input className="ao-input" value={grantTemplateId} onChange={(e) => setGrantTemplateId(e.target.value)} placeholder="Item template ID" />
            </div>
            <div>
              <label className="ao-label">Quantity</label>
              <input className="ao-input" type="number" min="1" value={grantQuantity} onChange={(e) => setGrantQuantity(e.target.value)} />
            </div>
            <div>
              <label className="ao-label">Custom Name (optional)</label>
              <input className="ao-input" value={grantCustomName} onChange={(e) => setGrantCustomName(e.target.value)} placeholder="Override name" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={grantUnique} onChange={(e) => setGrantUnique(e.target.checked)} />
              <span className="ao-label" style={{ marginBottom: 0 }}>Unique item</span>
            </label>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setGrantOpen(false)} disabled={grantMutation.isPending}>Withhold</button>
            <button className="ao-btn ao-btn--primary" onClick={handleGrant} disabled={!grantTemplateId || grantMutation.isPending}>
              {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equip Dialog */}
      <Dialog open={equipOpen} onOpenChange={setEquipOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Equip Item</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Slot</label>
              <select className="ao-input" value={equipSlot} onChange={(e) => setEquipSlot(e.target.value as EquipmentSlot)}>
                {SLOT_LAYOUT.map((s) => (
                  <option key={s.slot} value={s.slot}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setEquipOpen(false)} disabled={equipMutation.isPending}>Withhold</button>
            <button className="ao-btn ao-btn--primary" onClick={handleEquip} disabled={equipMutation.isPending}>
              {equipMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Equip
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Item</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Destination Character ID</label>
              <input className="ao-input" value={transferToCharId} onChange={(e) => setTransferToCharId(e.target.value)} placeholder="Target character ID" />
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending}>Withhold</button>
            <button className="ao-btn ao-btn--primary" onClick={handleTransfer} disabled={!transferToCharId || transferMutation.isPending}>
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Item Stack</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Custom Name</label>
              <input className="ao-input" value={renameCustomName} onChange={(e) => setRenameCustomName(e.target.value)} placeholder="New name" />
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setRenameOpen(false)} disabled={renameMutation.isPending}>Withhold</button>
            <button className="ao-btn ao-btn--primary" onClick={handleRename} disabled={!renameCustomName || renameMutation.isPending}>
              {renameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── small detail row ────────────────────────────────────────── */

function DetailRow({ label, value, color, muted }: { label: string; value: string; color?: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
      <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>{label}</span>
      <span style={{ fontSize: 12, color: muted ? 'var(--ink-ghost)' : (color ?? 'var(--ink-bright)'), fontFamily: muted ? 'var(--font-mono)' : undefined }}>
        {value}
      </span>
    </div>
  );
}
