import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Rune, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useArtifacts, useCreateArtifact, useUpdateArtifact, useDeleteArtifact } from '@/hooks/useArtifacts';
import { useItemTypes } from '@/hooks/useAdmin';
import type { ArtifactResponse, Rarity } from '@/types';

/* ── Rarity system ─────────────────────────────────────────────── */

const RARITY = {
  COMMON:    { label: 'Common',    c: '#968c75', glyph: 'square' },
  UNCOMMON:  { label: 'Uncommon',  c: '#7a9866', glyph: 'tri' },
  RARE:      { label: 'Rare',      c: '#6f93c4', glyph: 'diamond' },
  VERY_RARE: { label: 'Very Rare', c: '#9a7ec0', glyph: 'hex' },
  LEGENDARY: { label: 'Legendary', c: '#d4b478', glyph: 'sigil-2', glow: true },
} as const;

const RARITIES: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY'];

/* ── Rarity badge ──────────────────────────────────────────────── */

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const m = RARITY[rarity] ?? RARITY.COMMON;
  const glow = 'glow' in m && m.glow;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 7px 2px 6px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${m.c}`,
        borderLeft: `2px solid ${m.c}`,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.2em',
        color: m.c,
        textTransform: 'uppercase',
        boxShadow: glow
          ? `0 0 10px ${m.c}55, inset 0 0 8px ${m.c}22`
          : 'none',
      }}
    >
      <Rune kind={m.glyph} size={8} color={m.c} />
      {m.label}
    </span>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function ArtifactsPage() {
  const { data, isLoading, error, refetch } = useArtifacts();
  const { data: itemTypes } = useItemTypes();
  const createMutation = useCreateArtifact();
  const updateMutation = useUpdateArtifact();
  const deleteMutation = useDeleteArtifact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArtifactResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | 'ALL'>('ALL');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formItemTypeId, setFormItemTypeId] = useState('');
  const [formRarity, setFormRarity] = useState<string>('COMMON');
  const [formProperties, setFormProperties] = useState('');
  const [formSpecialAbilities, setFormSpecialAbilities] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormItemTypeId('');
    setFormRarity('COMMON');
    setFormProperties('');
    setFormSpecialAbilities('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: ArtifactResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormItemTypeId(item.itemTypeId);
    setFormRarity(item.rarity || 'COMMON');
    setFormProperties(item.properties || '');
    setFormSpecialAbilities(item.specialAbilities || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      description: formDescription || undefined,
      itemTypeId: formItemTypeId,
      rarity: (formRarity as Rarity) || undefined,
      properties: formProperties || undefined,
      specialAbilities: formSpecialAbilities || undefined,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const filteredData = data?.filter((item) => {
    if (filterRarity === 'ALL') return true;
    return (item.rarity || 'COMMON') === filterRarity;
  });

  /* ── Loading skeleton ───────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>The Reliquary</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>Wonders &amp; Relics</h3>
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
              Curated wonders of the realm, sealed by the Game-Master's hand.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 180 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '50%', height: 14, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '70%', height: 18, marginBottom: 10 }} />
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The Reliquary could not be opened. Its wards remain sealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────── */

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        {/* Left: title block */}
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>The Reliquary</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Wonders &amp; Relics</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            Curated wonders of the realm, sealed by the Game-Master's hand.
          </p>
        </div>

        {/* Right: filters + forge button + role chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Rarity filter buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterRarity('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: filterRarity === 'ALL' ? 'rgba(0,0,0,0.4)' : 'transparent',
                border: `1px solid ${filterRarity === 'ALL' ? 'var(--gold)' : 'var(--hairline)'}`,
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                color: filterRarity === 'ALL' ? 'var(--gold)' : 'var(--ink-faint)',
                cursor: 'pointer',
              }}
            >
              All
            </button>

            {RARITIES.map((r) => {
              const m = RARITY[r];
              const active = filterRarity === r;
              return (
                <button
                  key={r}
                  onClick={() => setFilterRarity(r)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    background: active ? 'rgba(0,0,0,0.4)' : 'transparent',
                    border: `1px solid ${active ? m.c : 'var(--hairline)'}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase' as const,
                    color: active ? m.c : 'var(--ink-faint)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: m.c,
                      transform: 'rotate(45deg)',
                      boxShadow: r === 'LEGENDARY' ? `0 0 6px ${m.c}` : 'none',
                    }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Forge button */}
          <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
            <Rune kind="plus" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>Forge New Artifact</span>
          </button>

          {/* Role chip */}
          <OrdoChip tone="arcane" glyph="shield">Game-Master</OrdoChip>
        </div>
      </div>

      {/* Card Grid */}
      {!filteredData || filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
            The reliquary stands empty. No artifacts dwell herein.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filteredData.map((item) => {
            const rarity = (item.rarity as Rarity) || 'COMMON';
            const m = RARITY[rarity] ?? RARITY.COMMON;
            const isLegendary = rarity === 'LEGENDARY';

            return (
              <OrdoPanel
                key={item.id}
                frame
                padding={0}
                style={{
                  position: 'relative',
                  borderColor: isLegendary ? `${m.c}88` : undefined,
                  boxShadow: isLegendary
                    ? `var(--shadow-inset), var(--shadow-low), 0 0 22px ${m.c}1f`
                    : undefined,
                }}
              >
                <div style={{ padding: 18 }}>
                  {/* Top row: name block + rarity icon box */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="ao-codex">{item.id.slice(0, 8).toUpperCase()}</span>
                      <div
                        className="ao-h5"
                        style={{
                          marginTop: 4,
                          color: isLegendary ? '#e6cf94' : 'var(--ink-bright)',
                          textShadow: isLegendary ? `0 0 14px ${m.c}55` : 'none',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        border: `1px solid ${m.c}`,
                        background: 'var(--abyss)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `inset 0 0 12px ${m.c}22`,
                      }}
                    >
                      <Rune kind={m.glyph} size={20} color={m.c} />
                    </div>
                  </div>

                  {/* Chips row: rarity badge + type + slot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <RarityBadge rarity={rarity} />
                    {item.itemTypeName && (
                      <OrdoChip tone="gold" glyph="sword">{item.itemTypeName}</OrdoChip>
                    )}
                    {item.itemTypeSlot && (
                      <OrdoChip tone="rune">{item.itemTypeSlot}</OrdoChip>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p
                      className="ao-italic"
                      style={{
                        fontSize: 13.5,
                        marginTop: 12,
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Properties + Abilities */}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.properties && (
                      <div>
                        <span className="ao-overline" style={{ fontSize: 9, color: 'var(--brass)' }}>Properties</span>
                        <span className="ao-codex" style={{ marginLeft: 8 }}>{item.properties}</span>
                      </div>
                    )}
                    {item.specialAbilities && (
                      <div>
                        <span className="ao-overline" style={{ fontSize: 9, color: 'var(--arcane)' }}>Abilities</span>
                        <span className="ao-codex" style={{ marginLeft: 8 }}>{item.specialAbilities}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions footer */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '12px 18px',
                    borderTop: '1px solid var(--hairline)',
                    background: 'var(--abyss)',
                  }}
                >
                  <button className="ao-btn ao-btn--sm" onClick={() => handleEdit(item)}>
                    <Rune kind="scroll" size={10} /> Edit
                  </button>
                  <button className="ao-btn ao-btn--sm ao-btn--danger" onClick={() => setDeleteId(item.id)}>
                    <Rune kind="x" size={10} />
                  </button>
                </div>
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Alter Artifact' : 'Forge New Artifact'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name of the artifact"
              />
            </OrdoField>

            <OrdoField label="Description">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the artifact"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <OrdoField label="Item Type" required>
              <Select value={formItemTypeId} onValueChange={setFormItemTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {(itemTypes || []).map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label="Rarity">
              <Select value={formRarity} onValueChange={setFormRarity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RARITY[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label="Properties">
              <textarea
                className="ao-input"
                value={formProperties}
                onChange={(e) => setFormProperties(e.target.value)}
                placeholder="Artifact properties"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <OrdoField label="Special Abilities">
              <textarea
                className="ao-input"
                value={formSpecialAbilities}
                onChange={(e) => setFormSpecialAbilities(e.target.value)}
                placeholder="Special abilities"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Withhold
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || !formItemTypeId || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Seal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Artifact?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The artifact shall be erased from the reliquary for all eternity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unmake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
