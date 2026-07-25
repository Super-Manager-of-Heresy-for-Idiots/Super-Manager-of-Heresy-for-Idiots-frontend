import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCampaignLocations } from '@/hooks/useLocations';
import { useCampaignNpcs } from '@/hooks/useNpcs';
import { useCampaignMaps } from '@/features/map/hooks/useMapQueries';
import {
  useLocationOccupants,
  useSetNpcLocation,
  useLocationMaps,
  useAttachLocationMap,
  useDetachLocationMap,
  useMapTransitions,
  useCreateMapTransition,
  useUpdateMapTransition,
  useDeleteMapTransition,
} from '@/hooks/useWorld';

/**
 * ГМ-панель управления миром (WORLD_PLAN Этап 4-5): размещение NPC в локациях,
 * привязка карт к локациям и управление переходами между картами (ключевые клетки).
 */
export default function WorldManagementPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const cid = campaignId!;

  const { data: locations, isLoading: locLoading } = useCampaignLocations(cid);
  const { data: npcs } = useCampaignNpcs(cid);
  const { data: maps } = useCampaignMaps(cid);

  const [locationId, setLocationId] = useState<string>('');
  const activeLocation = useMemo(
    () => (locations ?? []).find((l) => l.id === locationId) ?? (locations ?? [])[0],
    [locations, locationId],
  );
  const activeLocationId = activeLocation?.id;

  const { data: occupants } = useLocationOccupants(cid, activeLocationId);
  const { data: locationMaps } = useLocationMaps(cid, activeLocationId);
  const { data: transitions } = useMapTransitions(cid);

  const setNpcLocation = useSetNpcLocation();
  const attachMap = useAttachLocationMap();
  const detachMap = useDetachLocationMap();
  const createTransition = useCreateMapTransition();
  const updateTransition = useUpdateMapTransition();
  const deleteTransition = useDeleteMapTransition();

  // Transition form state
  const [fromMapId, setFromMapId] = useState('');
  const [toMapId, setToMapId] = useState('');
  const [fromX, setFromX] = useState('0');
  const [fromY, setFromY] = useState('0');
  const [toX, setToX] = useState('0');
  const [toY, setToY] = useState('0');
  const [label, setLabel] = useState('');

  if (locLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const unplacedNpcs = (npcs ?? []).filter((n) => n.location?.id !== activeLocationId);

  const mapName = (id: string) => (maps ?? []).find((m) => m.id === id)?.name ?? id.slice(0, 8);

  const submitTransition = () => {
    if (!fromMapId || !toMapId) return;
    createTransition.mutate({
      campaignId: cid,
      data: {
        fromMapId,
        toMapId,
        fromCells: [{ gridX: Number(fromX), gridY: Number(fromY) }],
        toCell: { gridX: Number(toX), gridY: Number(toY) },
        toLocationId: activeLocationId,
        label: label || undefined,
        enabled: true,
      },
    });
    setLabel('');
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Локация:</span>
        <Select value={activeLocationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Выберите локацию" />
          </SelectTrigger>
          <SelectContent>
            {(locations ?? []).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!activeLocationId && <p className="text-muted-foreground">Создайте локацию, чтобы управлять миром.</p>}

      {activeLocationId && (
        <>
          {/* Occupants + NPC placement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Обитатели локации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {occupants?.npcs.map((npc) => (
                  <div key={npc.id} className="flex items-center justify-between rounded border p-2">
                    <span className="flex items-center gap-2">
                      {npc.name}
                      {npc.npcRole && <Badge variant="secondary">{npc.npcRole}</Badge>}
                      {!npc.isVisibleToPlayers && <Badge variant="outline">скрыт</Badge>}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNpcLocation.mutate({ campaignId: cid, npcId: npc.id, locationId: null })}
                    >
                      Убрать
                    </Button>
                  </div>
                ))}
                {occupants?.characters.map((c) => (
                  <div key={c.id} className="rounded border border-dashed p-2 text-sm text-muted-foreground">
                    {c.name} {c.ownerUsername ? `(${c.ownerUsername})` : ''}
                  </div>
                ))}
                {!occupants?.npcs.length && !occupants?.characters.length && (
                  <p className="text-sm text-muted-foreground">Локация пуста.</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  onValueChange={(npcId) =>
                    setNpcLocation.mutate({ campaignId: cid, npcId, locationId: activeLocationId })
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Разместить NPC здесь…" />
                  </SelectTrigger>
                  <SelectContent>
                    {unplacedNpcs.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location maps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Карты локации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {locationMaps?.map((lm) => (
                  <div key={lm.id} className="flex items-center justify-between rounded border p-2">
                    <span className="flex items-center gap-2">
                      {mapName(lm.externalMapId)}
                      {lm.isDefault && <Badge>по умолчанию</Badge>}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => detachMap.mutate({ campaignId: cid, locationId: activeLocationId, linkId: lm.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {!locationMaps?.length && <p className="text-sm text-muted-foreground">Карты не привязаны.</p>}
              </div>

              <Select
                onValueChange={(mapId) =>
                  attachMap.mutate({
                    campaignId: cid,
                    locationId: activeLocationId,
                    data: { externalMapId: mapId, isDefault: !locationMaps?.length },
                  })
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Привязать карту…" />
                </SelectTrigger>
                <SelectContent>
                  {(maps ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Map transitions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Переходы между картами (ключевые клетки)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {transitions?.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>
                      {tr.label || 'Переход'}: {mapName(tr.fromMapId)} → {mapName(tr.toMapId)}
                      {' '}
                      {tr.fromCells[0] && `[${tr.fromCells[0].gridX},${tr.fromCells[0].gridY}]`}
                      {' → '}
                      [{tr.toCell.gridX},{tr.toCell.gridY}]
                      {!tr.enabled && <Badge variant="outline" className="ml-2">заперт</Badge>}
                    </span>
                    <span className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateTransition.mutate({
                            campaignId: cid,
                            transitionId: tr.id,
                            data: { enabled: !tr.enabled },
                          })
                        }
                      >
                        {tr.enabled ? 'Запереть' : 'Отпереть'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTransition.mutate({ campaignId: cid, transitionId: tr.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                ))}
                {!transitions?.length && <p className="text-sm text-muted-foreground">Переходов нет.</p>}
              </div>

              {/* New transition form */}
              <div className="grid grid-cols-2 gap-2 rounded border p-3">
                <Select value={fromMapId} onValueChange={setFromMapId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Из карты" />
                  </SelectTrigger>
                  <SelectContent>
                    {(maps ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={toMapId} onValueChange={setToMapId}>
                  <SelectTrigger>
                    <SelectValue placeholder="В карту" />
                  </SelectTrigger>
                  <SelectContent>
                    {(maps ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="из X" value={fromX} onChange={(e) => setFromX(e.target.value)} />
                  <Input placeholder="из Y" value={fromY} onChange={(e) => setFromY(e.target.value)} />
                </div>
                <div className="flex gap-1">
                  <Input placeholder="в X" value={toX} onChange={(e) => setToX(e.target.value)} />
                  <Input placeholder="в Y" value={toY} onChange={(e) => setToY(e.target.value)} />
                </div>
                <Input
                  className="col-span-2"
                  placeholder="Метка (напр. «Дверь в подвал»)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <Button
                  className="col-span-2"
                  disabled={!fromMapId || !toMapId || createTransition.isPending}
                  onClick={submitTransition}
                >
                  Создать переход
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
