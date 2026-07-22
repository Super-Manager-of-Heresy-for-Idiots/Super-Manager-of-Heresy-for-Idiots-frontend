import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  useNpcInteraction,
  useAcceptQuest,
  useBuyItem,
} from '@/hooks/useWorld';

interface Props {
  campaignId: string;
  npcId: string;
  /** Персонаж игрока, от лица которого происходит взаимодействие (co-presence). */
  characterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Диалог взаимодействия с NPC (WORLD_PLAN Этап 3): осмотр, доступные квесты и лавка.
 * Данные приходят одним агрегированным запросом interact, гейтятся co-presence на бэке.
 */
export function NpcInteractionDialog({ campaignId, npcId, characterId, open, onOpenChange }: Props) {
  const { data, isLoading, error } = useNpcInteraction(campaignId, npcId, characterId, open);
  const acceptQuest = useAcceptQuest();
  const buyItem = useBuyItem();
  const [tab, setTab] = useState('look');

  const isMerchant = data?.npcRole === 'MERCHANT';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.name ?? 'NPC'}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="py-4 text-sm text-red-500">
            Взаимодействие недоступно: персонаж должен находиться в одной локации с NPC.
          </p>
        )}

        {data && !isLoading && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="look">Осмотр</TabsTrigger>
              <TabsTrigger value="quests">
                Квесты{data.availableQuests?.length ? ` (${data.availableQuests.length})` : ''}
              </TabsTrigger>
              {isMerchant && <TabsTrigger value="trade">Торговля</TabsTrigger>}
            </TabsList>

            <TabsContent value="look">
              <div className="flex gap-4 py-2">
                {data.portraitUrl && (
                  <img
                    src={data.portraitUrl}
                    alt={data.name}
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                <div className="space-y-1 text-sm">
                  {data.location && (
                    <p className="text-muted-foreground">Локация: {data.location.name}</p>
                  )}
                  <p>{data.publicDescription || 'NPC молча смотрит на вас.'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quests">
              {!data.availableQuests?.length && (
                <p className="py-4 text-sm text-muted-foreground">Нет доступных квестов.</p>
              )}
              <ul className="space-y-2 py-2">
                {data.availableQuests?.map((q) => (
                  <li key={q.id} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <p className="font-medium">{q.title}</p>
                      {q.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{q.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={acceptQuest.isPending}
                      onClick={() =>
                        acceptQuest.mutate({ campaignId, npcId, questId: q.id, characterId })
                      }
                    >
                      Взять
                    </Button>
                  </li>
                ))}
              </ul>
            </TabsContent>

            {isMerchant && (
              <TabsContent value="trade">
                {!data.shopItems?.length && (
                  <p className="py-4 text-sm text-muted-foreground">Лавка пуста.</p>
                )}
                <ul className="space-y-2 py-2">
                  {data.shopItems?.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded border p-2">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.priceGold ?? '—'} зм
                          {typeof item.quantity === 'number' ? ` · в наличии: ${item.quantity}` : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={buyItem.isPending}
                        onClick={() =>
                          buyItem.mutate({
                            campaignId,
                            npcId,
                            data: { characterId, itemTemplateId: item.itemTemplateId, quantity: 1 },
                          })
                        }
                      >
                        Купить
                      </Button>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
