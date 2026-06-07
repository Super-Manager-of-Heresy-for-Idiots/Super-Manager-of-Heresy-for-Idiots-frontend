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
import { useT } from '@/i18n/I18nContext';

export default function CharacterRacesPage() {
  const t = useT();
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
          <h1 className="text-2xl font-heading font-bold">{t('adm.races.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('adm.races.subtitle')}</p>
        </div>
        <Button variant="gold" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> {t('adm.races.addSpecies')}
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
          <p className="text-lg">{t('adm.races.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('adm.races.emptyHint')}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colName')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colSource')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colSize')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colSpeed')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colLineages')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('adm.races.colStatus')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold w-32">{t('adm.races.colActions')}</th>
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
                        {race.sourceType === 'SYSTEM' ? t('adm.races.sourceSystem') : (race.homebrewPackageTitle ? t('adm.races.sourceHomebrewNamed', { title: race.homebrewPackageTitle }) : t('adm.races.sourceHomebrew'))}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{race.defaultSize}</td>
                    <td className="px-4 py-3 text-sm">{race.speed?.walk ?? '—'} {t('adm.races.speedUnit')}</td>
                    <td className="px-4 py-3 text-sm">
                      {race.lineageOptions?.length ?? 0}
                      {race.lineageRequired && <span className="text-xs text-dnd-red ml-1">{t('adm.races.lineageRequired')}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={race.active ? 'default' : 'outline'}>{race.active ? t('adm.races.statusActive') : t('adm.races.statusDisabled')}</Badge>
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
                            title={t('adm.races.disable')}
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
                            title={t('adm.races.enable')}
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
