import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelHeader, Button, Chip, Rune, Divider } from '@/components/ao';
import { StatCard } from '@/components/characters/StatCard';
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
import { useAuthStore } from '@/store/authStore';
import type { InventorySlot } from '@/types';

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
  const updateStat = useUpdateStat();
  const updateInventory = useUpdateInventorySlot();

  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<InventorySlot | null>(null);

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
      { characterId: id!, slot: selectedSlot.slot, data },
      { onSuccess: () => setSelectedSlot(null) }
    );
  };

  if (charLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[96, 192, 256].map((h, i) => (
          <Panel key={i} style={{ height: h }} className="ao-breathe">
            <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
          </Panel>
        ))}
      </div>
    );
  }

  if (charError || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load character</p>
        <Button variant="ghost" onClick={() => refetchChar()}>Retry</Button>
      </div>
    );
  }

  const defaultStats = stats?.filter((s) => s.statType.isDefault) || [];
  const customStats = stats?.filter((s) => !s.statType.isDefault) || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} icon={<Rune kind="arrow-l" size={14} />}>
        Back
      </Button>

      {/* Header */}
      <Panel frame padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="ao-h2" style={{ margin: 0 }}>{character.name}</h1>
              <Chip tone="gold">Lv. {character.level}</Chip>
            </div>
            <p style={{ color: 'var(--ink-muted)', marginTop: 4 }}>
              {character.race?.name} {character.characterClass?.name}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isGmView && (
              <Chip tone="arcane" glyph="shield">Viewing as GM</Chip>
            )}
            {isOwner && !isGmView && (
              <Button
                variant="ghost"
                icon={<Rune kind="scroll" size={14} />}
                onClick={() => navigate(`/characters/${id}/edit`)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {/* Stats Section */}
      <div>
        <PanelHeader title="Ability Scores" glyph="sigil-1" />
        {statsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Panel key={i} style={{ height: 96 }} className="ao-breathe">
                <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
              </Panel>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12, marginTop: 12 }}>
              {defaultStats.map((stat) =>
                editingStatId === stat.id ? (
                  <StatEditor
                    key={stat.id}
                    stat={stat}
                    onSave={(value) => handleStatSave(stat.id, value)}
                    onCancel={() => setEditingStatId(null)}
                    isSaving={updateStat.isPending}
                  />
                ) : (
                  <StatCard
                    key={stat.id}
                    stat={stat}
                    onClick={canEditStats ? () => setEditingStatId(stat.id) : undefined}
                  />
                )
              )}
            </div>

            {customStats.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="ao-overline" style={{ color: 'var(--ink-muted)', marginBottom: 12 }}>
                  Custom Stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
                  {customStats.map((stat) =>
                    editingStatId === stat.id ? (
                      <StatEditor
                        key={stat.id}
                        stat={stat}
                        onSave={(value) => handleStatSave(stat.id, value)}
                        onCancel={() => setEditingStatId(null)}
                        isSaving={updateStat.isPending}
                      />
                    ) : (
                      <StatCard
                        key={stat.id}
                        stat={stat}
                        onClick={canEditStats ? () => setEditingStatId(stat.id) : undefined}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Divider />

      {/* Equipment Section */}
      <div>
        <PanelHeader title="Equipment" glyph="sword" />
        <div style={{ marginTop: 12 }}>
          {invLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Panel key={i} style={{ height: 96 }} className="ao-breathe">
                  <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
                </Panel>
              ))}
            </div>
          ) : (
            <EquipmentGrid
              inventory={inventory || []}
              onSlotClick={canEditInventory ? (slot) => setSelectedSlot(slot) : undefined}
              readOnly={!canEditInventory}
            />
          )}
        </div>
      </div>

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
