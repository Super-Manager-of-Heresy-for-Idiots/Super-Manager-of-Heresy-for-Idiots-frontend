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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCharacterInventory, useGrantItem, useTransferItem, useRenameItem } from '@/hooks/useInventoryV2';
import type { ItemInstanceResponse, GrantItemRequest, RenameItemRequest } from '@/types';

/* ── helpers ─────────────────────────────────────────────────── */

function rarityColor(rarity?: string): string {
  switch (rarity) {
    case 'LEGENDARY': return '#ff8c00';
    case 'VERY_RARE':  return '#a855f7';
    case 'RARE':       return '#3b82f6';
    case 'UNCOMMON':   return '#22c55e';
    default:           return 'var(--ink-faint)';
  }
}

/* ── page ────────────────────────────────────────────────────── */

export default function InventoryV2Page() {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: inventory, isLoading, error, refetch } = useCharacterInventory(campaignId!, characterId!);
  const grantMutation = useGrantItem();
  const transferMutation = useTransferItem();
  const renameMutation = useRenameItem();

  const [filterText, setFilterText] = useState('');
  const [grantOpen, setGrantOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  /* Grant form */
  const [grantTemplateId, setGrantTemplateId] = useState('');
  const [grantQuantity, setGrantQuantity] = useState('1');
  const [grantUnique, setGrantUnique] = useState(false);
  const [grantCustomName, setGrantCustomName] = useState('');

  /* Transfer state */
  const [transferInstanceId, setTransferInstanceId] = useState('');
  const [transferToCharId, setTransferToCharId] = useState('');

  /* Rename state */
  const [renameInstanceId, setRenameInstanceId] = useState('');
  const [renameCustomName, setRenameCustomName] = useState('');

  /* ── derived ───────────────────────────────────────────────── */

  const items: ItemInstanceResponse[] = inventory ?? [];

  const filtered = useMemo(() => {
    if (!filterText) return items;
    const q = filterText.toLowerCase();
    return items.filter(
      (item) =>
        item.templateName.toLowerCase().includes(q) ||
        (item.displayName?.toLowerCase() ?? '').includes(q) ||
        (item.customName?.toLowerCase() ?? '').includes(q),
    );
  }, [items, filterText]);

  const stackCount = items.filter((i) => !i.isUnique).length;
  const uniqueCount = items.filter((i) => i.isUnique).length;

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
      {
        campaignId,
        fromCharId: characterId,
        instanceId: transferInstanceId,
        data: { toCharacterId: transferToCharId },
      },
      {
        onSuccess: () => {
          setTransferOpen(false);
          setTransferInstanceId('');
          setTransferToCharId('');
        },
      },
    );
  };

  const openRename = (item: ItemInstanceResponse) => {
    setRenameInstanceId(item.id);
    setRenameCustomName(item.customName ?? item.displayName);
    setRenameOpen(true);
  };

  const handleRename = () => {
    if (!campaignId || !characterId || !renameInstanceId) return;
    const data: RenameItemRequest = {
      customName: renameCustomName,
      renameEntireStack: true,
    };
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

  const openTransfer = (item: ItemInstanceResponse) => {
    setTransferInstanceId(item.id);
    setTransferToCharId('');
    setTransferOpen(true);
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Armaments</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Arsenal</h3>
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

  /* ── error ───────────────────────────────────────────────── */

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

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Armaments</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Arsenal</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
            Inventory of arms, artefacts, and worldly possessions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Filter button area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              border: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <Rune kind="search" size={14} color="var(--ink-faint)" />
            <input
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                width: 140,
              }}
              placeholder="Filter items..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <button
            className="ao-btn ao-btn--primary"
            onClick={() => setGrantOpen(true)}
          >
            <Rune kind="plus" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>Grant Item</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--gold)' }}>{stackCount}</span>
          <span className="ao-stat-label">Stacks</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--arcane)' }}>{uniqueCount}</span>
          <span className="ao-stat-label">Unique</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" />

      {/* Inventory List */}
      {filtered.length === 0 ? (
        items.length === 0 ? (
          <EmptyVault
            glyph="sword"
            title="Empty Arsenal"
            body="No items have been granted. Use the Grant Item button to bestow equipment."
            action={
              <button className="ao-btn ao-btn--primary" onClick={() => setGrantOpen(true)}>
                <Rune kind="plus" size={14} color="currentColor" />
                <span style={{ marginLeft: 6 }}>Grant Item</span>
              </button>
            }
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
              No items match thy inquiry.
            </p>
          </div>
        )
      ) : (
        <OrdoPanel frame padding={0} style={{ marginTop: 16 }}>
          <PanelHeader
            title="INVENTORY"
            glyph="sword"
            sub={`${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
          />

          {filtered.map((item: ItemInstanceResponse, idx: number) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--hairline)' : 'none',
              }}
            >
              {/* Item icon */}
              <div style={{
                width: 32,
                height: 32,
                border: `1px solid ${rarityColor(item.rarity)}44`,
                background: 'var(--abyss)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Rune kind="sword" size={14} color={rarityColor(item.rarity)} />
              </div>

              {/* Item info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-bright)', fontWeight: 500 }}>
                    {item.displayName}
                  </span>
                  {item.customName && item.customName !== item.templateName && (
                    <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-ghost)' }}>
                      ({item.templateName})
                    </span>
                  )}
                  {item.rarity && (
                    <span className="ao-overline" style={{ fontSize: 8, color: rarityColor(item.rarity) }}>
                      {item.rarity.replace('_', ' ')}
                    </span>
                  )}
                  {item.isUnique && (
                    <OrdoChip tone="arcane" glyph="diamond">UNIQUE</OrdoChip>
                  )}
                </div>
                {item.slot && (
                  <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2, display: 'block' }}>
                    Slot: {item.slot.replace('_', ' ')}
                  </span>
                )}
                {item.enchantments && item.enchantments.length > 0 && (
                  <span className="ao-codex" style={{ fontSize: 10, color: 'var(--arcane)', marginTop: 2, display: 'block' }}>
                    {item.enchantments.length} enchantment{item.enchantments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Quantity */}
              <span
                className="ao-codex"
                style={{
                  fontSize: 12,
                  color: 'var(--ink-quiet)',
                  fontFamily: 'var(--font-mono)',
                  minWidth: 40,
                  textAlign: 'right',
                }}
              >
                x{item.quantity}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => openRename(item)}
                  title="Rename"
                >
                  <Rune kind="scroll" size={10} />
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => openTransfer(item)}
                  title="Transfer"
                >
                  <Rune kind="arrow-r" size={10} />
                </button>
              </div>
            </div>
          ))}
        </OrdoPanel>
      )}

      {/* Grant Item Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Item</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Template ID</label>
              <input
                className="ao-input"
                value={grantTemplateId}
                onChange={(e) => setGrantTemplateId(e.target.value)}
                placeholder="Item template ID"
              />
            </div>
            <div>
              <label className="ao-label">Quantity</label>
              <input
                className="ao-input"
                type="number"
                min="1"
                value={grantQuantity}
                onChange={(e) => setGrantQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="ao-label">Custom Name (optional)</label>
              <input
                className="ao-input"
                value={grantCustomName}
                onChange={(e) => setGrantCustomName(e.target.value)}
                placeholder="Override name"
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={grantUnique}
                onChange={(e) => setGrantUnique(e.target.checked)}
              />
              <span className="ao-label" style={{ marginBottom: 0 }}>Unique item</span>
            </label>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setGrantOpen(false)} disabled={grantMutation.isPending}>
              Withhold
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleGrant}
              disabled={!grantTemplateId || grantMutation.isPending}
            >
              {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Item</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Destination Character ID</label>
              <input
                className="ao-input"
                value={transferToCharId}
                onChange={(e) => setTransferToCharId(e.target.value)}
                placeholder="Target character ID"
              />
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending}>
              Withhold
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleTransfer}
              disabled={!transferToCharId || transferMutation.isPending}
            >
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item Stack</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="ao-label">Custom Name</label>
              <input
                className="ao-input"
                value={renameCustomName}
                onChange={(e) => setRenameCustomName(e.target.value)}
                placeholder="New name"
              />
            </div>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setRenameOpen(false)} disabled={renameMutation.isPending}>
              Withhold
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleRename}
              disabled={!renameCustomName || renameMutation.isPending}
            >
              {renameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
