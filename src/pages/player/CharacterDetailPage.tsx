import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, ArrowLeft, Shield as ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import type { CharacterStat, InventorySlot } from '@/types';

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
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (charError || !character) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load character</p>
        <Button variant="outline" onClick={() => refetchChar()}>Retry</Button>
      </div>
    );
  }

  const defaultStats = stats?.filter((s) => s.statType.isDefault) || [];
  const customStats = stats?.filter((s) => !s.statType.isDefault) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold">{character.name}</h1>
              <Badge variant="gold" className="text-lg px-3">Lv. {character.level}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {character.race?.name} {character.characterClass?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isGmView && (
            <Badge variant="secondary" className="gap-1">
              <ShieldIcon className="h-3 w-3" /> Viewing as Game Master
            </Badge>
          )}
          {isOwner && !isGmView && (
            <Button variant="outline" onClick={() => navigate(`/characters/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-gold/20" />

      {/* Stats Section */}
      <div>
        <h2 className="text-xl font-heading font-semibold mb-4">Ability Scores</h2>
        {statsLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Custom Stats
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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

      <Separator className="bg-gold/20" />

      {/* Equipment Section */}
      <div>
        <h2 className="text-xl font-heading font-semibold mb-4">Equipment</h2>
        {invLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
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
