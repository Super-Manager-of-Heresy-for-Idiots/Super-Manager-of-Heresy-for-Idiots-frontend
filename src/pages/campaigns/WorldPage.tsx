import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, MapPin, Users, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NpcInteractionDialog } from '@/components/world/NpcInteractionDialog';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useCampaignLocations } from '@/hooks/useLocations';
import {
  useLocationOccupants,
  useEnterLocation,
  useLeaveLocation,
  useCharacterQuestJournal,
  useAbandonQuest,
} from '@/hooks/useWorld';
import { useAuthStore } from '@/store/authStore';

/**
 * Экран мира игрока (WORLD_PLAN): персонаж находится в локации, видит обитателей,
 * подходит к NPC (осмотр/квесты/торговля), перемещается между видимыми локациями,
 * ведёт журнал квестов. Всё завязано на реальные endpoints присутствия.
 */
export default function WorldPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const cid = campaignId!;
  const user = useAuthStore((s) => s.user);

  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(cid);
  const { data: locations } = useCampaignLocations(cid);

  const myCharacters = useMemo(
    () => (characters ?? []).filter((c) => c.ownerId === user?.id),
    [characters, user?.id],
  );

  const [characterId, setCharacterId] = useState<string>('');
  const activeCharacter = useMemo(
    () => myCharacters.find((c) => c.id === characterId) ?? myCharacters[0],
    [myCharacters, characterId],
  );
  const currentLocationId = activeCharacter?.currentLocation?.id;

  const { data: occupants, isLoading: occLoading } = useLocationOccupants(cid, currentLocationId);
  const { data: journal } = useCharacterQuestJournal(cid, activeCharacter?.id);
  const enter = useEnterLocation();
  const leave = useLeaveLocation();
  const abandon = useAbandonQuest();

  const [interactNpcId, setInteractNpcId] = useState<string | null>(null);

  if (charsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!myCharacters.length) {
    return <p className="p-6 text-muted-foreground">В этой кампании у вас нет персонажей.</p>;
  }

  const visibleLocations = (locations ?? []).filter((l) => l.id !== currentLocationId);

  return (
    <div className="space-y-4 p-4">
      {/* Character selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Персонаж:</span>
        <Select value={activeCharacter?.id} onValueChange={setCharacterId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {myCharacters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {activeCharacter?.currentLocation?.name ?? 'Вне локаций'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentLocationId && (
            <p className="text-sm text-muted-foreground">
              Ваш персонаж пока не находится ни в одной локации. Выберите, куда отправиться.
            </p>
          )}

          {currentLocationId && (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Users className="h-4 w-4" /> Обитатели
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={leave.isPending}
                  onClick={() =>
                    leave.mutate({ campaignId: cid, locationId: currentLocationId, characterId: activeCharacter!.id })
                  }
                >
                  Покинуть локацию
                </Button>
              </div>

              {occLoading && <Loader2 className="h-4 w-4 animate-spin" />}

              <div className="space-y-1">
                {occupants?.npcs.map((npc) => (
                  <div key={npc.id} className="flex items-center justify-between rounded border p-2">
                    <span className="flex items-center gap-2">
                      {npc.portraitUrl && (
                        <img src={npc.portraitUrl} alt={npc.name} className="h-8 w-8 rounded object-cover" />
                      )}
                      {npc.name}
                      {npc.npcRole && <Badge variant="secondary">{npc.npcRole}</Badge>}
                    </span>
                    <Button size="sm" onClick={() => setInteractNpcId(npc.id)}>
                      Подойти
                    </Button>
                  </div>
                ))}
                {!occupants?.npcs.length && (
                  <p className="text-sm text-muted-foreground">Здесь нет NPC.</p>
                )}

                {occupants?.characters
                  .filter((c) => c.id !== activeCharacter?.id)
                  .map((c) => (
                    <div key={c.id} className="rounded border border-dashed p-2 text-sm text-muted-foreground">
                      {c.name} {c.ownerUsername ? `(${c.ownerUsername})` : ''}
                    </div>
                  ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Travel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Перемещение</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {visibleLocations.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant="outline"
              disabled={enter.isPending}
              onClick={() =>
                enter.mutate({ campaignId: cid, locationId: l.id, characterId: activeCharacter!.id })
              }
            >
              {l.name}
            </Button>
          ))}
          {!visibleLocations.length && (
            <p className="text-sm text-muted-foreground">Нет других доступных локаций.</p>
          )}
        </CardContent>
      </Card>

      {/* Quest journal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4" /> Журнал квестов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!journal?.length && <p className="text-sm text-muted-foreground">Журнал пуст.</p>}
          {journal?.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded border p-2">
              <div>
                <p className="font-medium">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary">{entry.status}</Badge>
                  {entry.givenByNpcName ? ` · от ${entry.givenByNpcName}` : ''}
                </p>
              </div>
              {entry.status === 'ACCEPTED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={abandon.isPending}
                  onClick={() =>
                    abandon.mutate({ campaignId: cid, characterId: activeCharacter!.id, questId: entry.questId })
                  }
                >
                  Отказаться
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {interactNpcId && activeCharacter && (
        <NpcInteractionDialog
          campaignId={cid}
          npcId={interactNpcId}
          characterId={activeCharacter.id}
          open={!!interactNpcId}
          onOpenChange={(o) => !o && setInteractNpcId(null)}
        />
      )}
    </div>
  );
}
