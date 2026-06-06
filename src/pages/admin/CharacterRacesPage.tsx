import { useState } from 'react';
import { Plus, Pencil, Power, PowerOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RaceEditor } from '@/components/admin/RaceEditor';
import {
  useAdminRaces,
  useCreateAdminRace,
  useUpdateAdminRace,
  useEnableAdminRace,
  useDisableAdminRace,
} from '@/hooks/useRaces';
import type { RaceRequest, RaceResponse } from '@/types';

export default function CharacterRacesPage() {
  const { data, isLoading } = useAdminRaces();
  const createMutation = useCreateAdminRace();
  const updateMutation = useUpdateAdminRace();
  const enableMutation = useEnableAdminRace();
  const disableMutation = useDisableAdminRace();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RaceResponse | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const handleEdit = (race: RaceResponse) => {
    setEditing(race);
    setEditorOpen(true);
  };

  const handleSubmit = (data: RaceRequest) => {
    if (editing) {
      updateMutation.mutate(
        { raceId: editing.id, data },
        { onSuccess: () => setEditorOpen(false) },
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setEditorOpen(false) });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const togglingId =
    enableMutation.isPending
      ? enableMutation.variables
      : disableMutation.isPending
        ? disableMutation.variables
        : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Species / Races</h1>
          <p className="text-sm text-muted-foreground">System (PHB 2024) reference species. Homebrew species live inside doctrines.</p>
        </div>
        <Button variant="gold" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Species
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No species found</p>
          <p className="text-sm mt-1">Click "Add Species" to seed your D&amp;D 2024 races.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Size</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Speed</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Lineages</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((race) => {
                const toggling = togglingId === race.id;
                return (
                  <tr key={race.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{race.name}</div>
                      {race.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{race.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={race.sourceType === 'SYSTEM' ? 'default' : 'secondary'}>
                        {race.sourceType === 'SYSTEM' ? 'System' : (race.homebrewPackageTitle ? `Homebrew: ${race.homebrewPackageTitle}` : 'Homebrew')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{race.defaultSize}</td>
                    <td className="px-4 py-3 text-sm">{race.speed?.walk ?? '—'} ft</td>
                    <td className="px-4 py-3 text-sm">
                      {race.lineageOptions?.length ?? 0}
                      {race.lineageRequired && <span className="text-xs text-dnd-red ml-1">required</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={race.active ? 'default' : 'outline'}>{race.active ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(race)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {race.active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Disable"
                            disabled={toggling}
                            onClick={() => disableMutation.mutate(race.id)}
                          >
                            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Enable"
                            disabled={toggling}
                            onClick={() => enableMutation.mutate(race.id)}
                          >
                            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RaceEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        scope={{ kind: 'system' }}
        initial={editing}
      />
    </div>
  );
}
