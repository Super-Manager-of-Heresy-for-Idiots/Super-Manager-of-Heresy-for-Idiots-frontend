import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoChip } from '@/components/ordo';
import { StatEditor } from '@/components/characters/StatEditor';
import { EquipmentGrid } from '@/components/characters/EquipmentGrid';
import { EquipmentSlotModal } from '@/components/characters/EquipmentSlotModal';
import {
  useCharacter,
  useCharacterStats,
  useCharacterInventory,
  useUpdateStat,
  useUpdateInventorySlot,
} from '@/hooks/useCharacters';
import { useCharacterConditions } from '@/hooks/useConditions';
import { useAuthStore } from '@/store/authStore';
import { formatModifier } from '@/lib/utils';
import type { CharacterStatResponse, InventorySlotResponse, CharacterConditionResponse, ConditionModifierResponse } from '@/types';

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

  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<InventorySlotResponse | null>(null);

  const isOwner = user?.id === character?.ownerId;
  const canEditStats = isOwner || isGmView;
  const canEditInventory = isOwner && !isGmView;

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

      {invLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="ao-breathe" style={{ height: 96, background: 'var(--abyss)', borderRadius: 4 }} />
          ))}
        </div>
      ) : (
        <EquipmentGrid
          inventory={inventory || []}
          onSlotClick={canEditInventory ? (slot) => setSelectedSlot(slot) : undefined}
          readOnly={!canEditInventory}
        />
      )}

      {/* Equipment Modal */}
      <EquipmentSlotModal
        slot={selectedSlot}
        characterId={id!}
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onSave={handleInventorySave}
        isSaving={updateInventory.isPending}
      />
    </div>
  );
}
