import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoChip, OrdoField } from '@/components/ordo';
import { StatEditor } from '@/components/characters/StatEditor';
import { EquipmentGrid } from '@/components/characters/EquipmentGrid';
import { EquipmentSlotModal } from '@/components/characters/EquipmentSlotModal';
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
  useCharacter,
  useCharacterStats,
  useCharacterInventory,
  useUpdateStat,
  useUpdateInventorySlot,
} from '@/hooks/useCharacters';
import { useCharacterConditions } from '@/hooks/useConditions';
import { useArtifacts, usePlaceArtifact } from '@/hooks/useArtifacts';
import { useEnchantmentTypes, useSlotEnchantments, useAddEnchantment, useRemoveEnchantment } from '@/hooks/useEnchantments';
import { useAuthStore } from '@/store/authStore';
import { formatModifier } from '@/lib/utils';
import type { CharacterStatResponse, InventorySlotResponse, CharacterConditionResponse, ConditionModifierResponse, EquipmentSlot } from '@/types';

interface CharacterDetailPageProps {
  isGmView?: boolean;
}

export default function CharacterDetailPage({ isGmView = false }: CharacterDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: character, isLoading: charLoading, error: charError, refetch: refetchChar } = useCharacter(id!);
  const { data: stats, isLoading: statsLoading } = useCharacterStats(id!);
  const { data: inventory, isLoading: invLoading } = useCharacterInventory(id!);
  const { data: conditions } = useCharacterConditions(id!);
  const updateStat = useUpdateStat();
  const updateInventory = useUpdateInventorySlot();

  // Artifact placement (GM)
  const { data: artifacts } = useArtifacts();
  const placeArtifact = usePlaceArtifact();
  const [placeSlot, setPlaceSlot] = useState<InventorySlotResponse | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState('');

  // Enchantments (Player)
  const { data: enchantmentTypes } = useEnchantmentTypes();
  const [enchantmentSlot, setEnchantmentSlot] = useState<InventorySlotResponse | null>(null);
  const [selectedEnchTypeId, setSelectedEnchTypeId] = useState('');
  const [enchantmentNotes, setEnchantmentNotes] = useState('');
  const addEnchantment = useAddEnchantment();
  const removeEnchantment = useRemoveEnchantment();

  // Load enchantments for the currently viewed slot
  const { data: slotEnchantments } = useSlotEnchantments(id!, enchantmentSlot?.id || '');

  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<InventorySlotResponse | null>(null);

  const isOwner = user?.id === character?.ownerId;
  const canEditStats = isOwner || isGmView;
  const canEditInventory = isOwner && !isGmView;
  const canPlaceArtifact = isGmView;
  const canManageEnchantments = isOwner && !isGmView;

  const handleStatSave = (statId: string, value: number) => {
    updateStat.mutate(
      { characterId: id!, statId, data: { value } },
      { onSuccess: () => setEditingStatId(null) }
    );
  };

  const handleInventorySave = (data: { itemTypeId: string | null; quantity: number; notes: string | null }) => {
    if (!selectedSlot) return;
    updateInventory.mutate(
      { characterId: id!, slot: selectedSlot.slot, data: { itemTypeId: data.itemTypeId, quantity: data.quantity, notes: data.notes || undefined } },
      { onSuccess: () => setSelectedSlot(null) }
    );
  };

  const handlePlaceArtifact = () => {
    if (!placeSlot || !selectedArtifactId) return;
    placeArtifact.mutate(
      { characterId: id!, slot: placeSlot.slot, artifactId: selectedArtifactId },
      {
        onSuccess: () => {
          setPlaceSlot(null);
          setSelectedArtifactId('');
        },
      }
    );
  };

  const handleAddEnchantment = () => {
    if (!enchantmentSlot || !selectedEnchTypeId) return;
    addEnchantment.mutate(
      {
        characterId: id!,
        slotId: enchantmentSlot.id,
        data: { enchantmentTypeId: selectedEnchTypeId, notes: enchantmentNotes || undefined },
      },
      {
        onSuccess: () => {
          setSelectedEnchTypeId('');
          setEnchantmentNotes('');
        },
      }
    );
  };

  const handleRemoveEnchantment = (enchantmentId: string) => {
    if (!enchantmentSlot) return;
    removeEnchantment.mutate({
      characterId: id!,
      slotId: enchantmentSlot.id,
      enchantmentId,
    });
  };

  const handleSlotClick = (slot: InventorySlotResponse) => {
    if (canEditInventory) {
      setSelectedSlot(slot);
    } else if (canPlaceArtifact) {
      setPlaceSlot(slot);
      setSelectedArtifactId('');
    }
  };

  // Filter artifacts that match the slot type
  const getMatchingArtifacts = (slot: EquipmentSlot) => {
    return (artifacts || []).filter((a) => a.itemTypeSlot === slot);
  };

  if (charLoading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0' }}>
        <div className="ao-breathe" style={{ height: 96, background: 'var(--abyss)', borderRadius: 4 }} />
        <div className="ao-breathe" style={{ height: 192, background: 'var(--abyss)', borderRadius: 4 }} />
        <div className="ao-breathe" style={{ height: 256, background: 'var(--abyss)', borderRadius: 4 }} />
      </div>
    );
  }

  if (charError || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Sigil size={56} glyph="eye" />
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', margin: '16px 0' }}>
          Failed to load character folio
        </p>
        <button className="ao-btn ao-btn--ghost" onClick={() => refetchChar()}>Retry</button>
      </div>
    );
  }

  const classDisplay = character.classLevels
    ?.map((cl) => `${cl.className} ${cl.classLevel}`)
    .join(' / ') || 'Unknown';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 0' }}>
      {/* Back button */}
      <button className="ao-btn ao-btn--ghost" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Rune kind="arrow-l" size={14} /> Back
      </button>

      {/* Header Panel */}
      <OrdoPanel frame padding={24}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Sigil size={64} glyph="sigil-2" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 className="ao-h3" style={{ margin: 0 }}>{character.name}</h1>
                <span className="ao-num" style={{ fontSize: 28, color: 'var(--gold)', lineHeight: 1 }}>
                  {character.totalLevel}
                </span>
              </div>
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginTop: 4 }}>
                {character.race?.name} &middot; {classDisplay}
              </p>
              {character.experience !== undefined && (
                <span className="ao-codex" style={{ color: 'var(--ink-faint)', marginTop: 2, display: 'block' }}>
                  XP: {character.experience}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isGmView && (
              <OrdoChip tone="arcane" glyph="shield">Viewing as Game Master</OrdoChip>
            )}
            {isOwner && !isGmView && (
              <>
                <Link to={`/characters/${id}/level-up`} className="ao-btn ao-btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  <Rune kind="arrow-up" size={14} /> Level Up
                </Link>
                <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/characters/${id}/edit`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Rune kind="scroll" size={14} /> Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* HP & XP bars */}
        {character.experience !== undefined && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="ao-overline">Ascent Progress</span>
            </div>
            <div className="ao-bar">
              <div
                className="ao-bar-fill ao-bar-fill--gold"
                style={{ width: `${Math.min(100, (character.experience % 100))}%` }}
              />
            </div>
          </div>
        )}
      </OrdoPanel>

      {/* Active Conditions */}
      {conditions && conditions.length > 0 && (
        <>
          <OrdoDivider glyph="eye">ACTIVE CONDITIONS</OrdoDivider>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {conditions.map((c: CharacterConditionResponse) => (
              <OrdoChip key={c.id} tone="ember" glyph="flame">
                {c.conditionName}
                {c.modifiers.length > 0 && (
                  <span style={{ marginLeft: 4, opacity: 0.75, fontSize: '0.8em' }}>
                    ({c.modifiers.map((m: ConditionModifierResponse) => `${m.statTypeName} ${m.modifierValue > 0 ? '+' : ''}${m.modifierValue}`).join(', ')})
                  </span>
                )}
              </OrdoChip>
            ))}
          </div>
        </>
      )}

      {/* Stats Section */}
      <OrdoDivider glyph="sigil-3">ASPECTS</OrdoDivider>

      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-breathe" style={{ height: 96, background: 'var(--abyss)', borderRadius: 4 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {(stats || []).map((stat: CharacterStatResponse) =>
            editingStatId === stat.id ? (
              <StatEditor
                key={stat.id}
                stat={stat}
                onSave={(value) => handleStatSave(stat.id, value)}
                onCancel={() => setEditingStatId(null)}
                isSaving={updateStat.isPending}
              />
            ) : (
              <button
                key={stat.id}
                className="ao-stat"
                onClick={canEditStats ? () => setEditingStatId(stat.id) : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 12,
                  background: 'var(--abyss)',
                  border: '1px solid var(--rule)',
                  borderRadius: 4,
                  cursor: canEditStats ? 'pointer' : 'default',
                  minWidth: 100,
                }}
              >
                <span className="ao-stat-label">
                  {stat.statTypeName.length > 3
                    ? stat.statTypeName.slice(0, 3).toUpperCase()
                    : stat.statTypeName.toUpperCase()}
                </span>
                <span
                  className="ao-stat-value"
                  style={{
                    color:
                      stat.effectiveValue != null && stat.effectiveValue !== stat.value
                        ? stat.effectiveValue > stat.value
                          ? '#6ee77a'
                          : '#e76e6e'
                        : 'var(--ink)',
                  }}
                >
                  {stat.effectiveValue ?? stat.value}
                </span>
                {stat.effectiveValue != null && stat.effectiveValue !== stat.value && (
                  <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: '0.7em' }}>
                    base {stat.value}
                  </span>
                )}
                <span className="ao-stat-mod">
                  {formatModifier(stat.effectiveValue ?? stat.value)}
                </span>
              </button>
            )
          )}
        </div>
      )}

      {/* Equipment Section */}
      <OrdoDivider glyph="helm">EQUIPMENT</OrdoDivider>

      {isGmView && (
        <p className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: -16 }}>
          Click a slot to place an artifact
        </p>
      )}
      {canManageEnchantments && (
        <p className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: -16 }}>
          Click a slot to manage equipment &middot; Use the enchant button to add enchantments
        </p>
      )}

      {invLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="ao-breathe" style={{ height: 96, background: 'var(--abyss)', borderRadius: 4 }} />
          ))}
        </div>
      ) : (
        <EquipmentGrid
          inventory={inventory || []}
          onSlotClick={(canEditInventory || canPlaceArtifact) ? handleSlotClick : undefined}
          readOnly={!canEditInventory && !canPlaceArtifact}
          onEnchantClick={canManageEnchantments ? (slot) => {
            setEnchantmentSlot(slot);
            setSelectedEnchTypeId('');
            setEnchantmentNotes('');
          } : undefined}
        />
      )}

      {/* Equipment Modal (Player edits inventory) */}
      <EquipmentSlotModal
        slot={selectedSlot}
        characterId={id!}
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onSave={handleInventorySave}
        isSaving={updateInventory.isPending}
      />

      {/* Place Artifact Modal (GM) */}
      <Dialog open={!!placeSlot} onOpenChange={() => { setPlaceSlot(null); setSelectedArtifactId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Artifact — {placeSlot?.slot && placeSlot.slot.replace(/_/g, ' ')}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {placeSlot?.artifactName && (
              <div style={{ padding: 12, background: 'var(--abyss)', border: '1px solid var(--rule)', borderRadius: 4 }}>
                <span className="ao-overline" style={{ fontSize: 9 }}>Currently Equipped</span>
                <div className="ao-h5" style={{ marginTop: 4 }}>{placeSlot.artifactName}</div>
                {placeSlot.artifactRarity && (
                  <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 11 }}>{placeSlot.artifactRarity}</span>
                )}
              </div>
            )}
            <OrdoField label="Select Artifact" required>
              <Select value={selectedArtifactId} onValueChange={setSelectedArtifactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an artifact" />
                </SelectTrigger>
                <SelectContent>
                  {placeSlot && getMatchingArtifacts(placeSlot.slot).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.rarity || 'COMMON'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>
            {placeSlot && getMatchingArtifacts(placeSlot.slot).length === 0 && (
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
                No artifacts available for this slot. Create one in the Artifacts page first.
              </p>
            )}
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => { setPlaceSlot(null); setSelectedArtifactId(''); }} disabled={placeArtifact.isPending}>
              Cancel
            </button>
            <button className="ao-btn ao-btn--primary" onClick={handlePlaceArtifact} disabled={!selectedArtifactId || placeArtifact.isPending}>
              {placeArtifact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Artifact
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enchantments Modal (Player) */}
      <Dialog open={!!enchantmentSlot} onOpenChange={() => setEnchantmentSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enchantments — {enchantmentSlot?.itemTypeName || enchantmentSlot?.artifactName || enchantmentSlot?.slot?.replace(/_/g, ' ')}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current enchantments */}
            {slotEnchantments && slotEnchantments.length > 0 ? (
              <div>
                <span className="ao-overline" style={{ fontSize: 10 }}>Active Enchantments</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {slotEnchantments.map((ench) => (
                    <div
                      key={ench.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--abyss)',
                        border: '1px solid var(--rule)',
                        borderRadius: 4,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ench.enchantmentType.name}</div>
                        {ench.enchantmentType.damageDice && (
                          <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                            {ench.enchantmentType.damageDice}
                            {ench.enchantmentType.damageBonus ? `+${ench.enchantmentType.damageBonus}` : ''}{' '}
                            {ench.enchantmentType.damageType}
                          </span>
                        )}
                        {ench.enchantmentType.buffDebuff && (
                          <span className="ao-codex" style={{ fontSize: 11, color: ench.enchantmentType.buffDebuff.isBuff ? '#6ee77a' : '#e76e6e', marginLeft: 8 }}>
                            {ench.enchantmentType.buffDebuff.name}
                          </span>
                        )}
                        {ench.notes && (
                          <div className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                            {ench.notes}
                          </div>
                        )}
                      </div>
                      <button
                        className="ao-btn ao-btn--sm ao-btn--danger"
                        onClick={() => handleRemoveEnchantment(ench.id)}
                        disabled={removeEnchantment.isPending}
                      >
                        <Rune kind="x" size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
                No enchantments on this item.
              </p>
            )}

            {/* Add new enchantment */}
            {enchantmentSlot?.itemTypeId && (
              <>
                <OrdoDivider>ADD ENCHANTMENT</OrdoDivider>
                <OrdoField label="Enchantment Type" required>
                  <Select value={selectedEnchTypeId} onValueChange={setSelectedEnchTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose enchantment" />
                    </SelectTrigger>
                    <SelectContent>
                      {(enchantmentTypes || []).map((et) => (
                        <SelectItem key={et.id} value={et.id}>
                          {et.name}
                          {et.damageDice ? ` (${et.damageDice} ${et.damageType})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OrdoField>
                <OrdoField label="Notes (optional)">
                  <input
                    className="ao-input"
                    value={enchantmentNotes}
                    onChange={(e) => setEnchantmentNotes(e.target.value)}
                    placeholder="E.g., Found in dragon's lair"
                    maxLength={255}
                  />
                </OrdoField>
                <button
                  className="ao-btn ao-btn--primary"
                  onClick={handleAddEnchantment}
                  disabled={!selectedEnchTypeId || addEnchantment.isPending}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {addEnchantment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enchant
                </button>
              </>
            )}
            {!enchantmentSlot?.itemTypeId && (
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
                Equip an item first to add enchantments.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
