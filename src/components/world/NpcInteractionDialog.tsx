import { useEffect, useState } from 'react';
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
  useTurnInQuest,
  useBuyItem,
  useSellItem,
} from '@/hooks/useWorld';
import { useBackpackInventory } from '@/hooks/useInventory';
import {
  availableOptions,
  chooseOption,
  startDialogue,
  EMPTY_DIALOGUE_STATE,
  type DialogueState,
} from '@/lib/dialogueRuntime';
import s from './NpcInteractionDialog.module.css';

interface Props {
  campaignId: string;
  npcId: string;
  /** Персонаж игрока, от лица которого происходит взаимодействие (co-presence). */
  characterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

/**
 * Диалог взаимодействия с NPC (WORLD_PLAN Этап 3): осмотр, доступные квесты и лавка.
 * Данные приходят одним агрегированным запросом interact, гейтятся co-presence на бэке.
 */
export function NpcInteractionDialog({ campaignId, npcId, characterId, open, onOpenChange }: Props) {
  const { data, isLoading, error } = useNpcInteraction(campaignId, npcId, characterId, open);
  const acceptQuest = useAcceptQuest();
  const turnInQuest = useTurnInQuest();
  const buyItem = useBuyItem();
  const sellItem = useSellItem();
  const [tab, setTab] = useState('look');

  const isMerchant = data?.npcRole === 'MERCHANT';
  const backpack = useBackpackInventory(campaignId, isMerchant && open ? characterId : '');
  const goldBalance = toNumber(data?.goldBalance);
  const sellable = (backpack.data ?? []).filter((item) => toNumber(item.priceGold) !== null);
  /** Курс выкупа приходит с бэкенда, чтобы клиент не дублировал константу (по умолчанию 50%). */
  const buybackRate = (data?.buybackRatePercent ?? 50) / 100;

  const busy = buyItem.isPending || sellItem.isPending;
  const questCount = (data?.availableQuests?.length ?? 0) + (data?.turnInQuests?.length ?? 0);

  // WORLD_PLAN Этап 4: опциональный диалог. Обход дерева — на клиенте (реплики авторские).
  const dialogue = data?.dialogue;
  const hasDialogue = !!dialogue?.nodes?.length;
  const [talk, setTalk] = useState<DialogueState>(EMPTY_DIALOGUE_STATE);
  const talkOptions = availableOptions(dialogue, talk, 'Уйти');
  // Разговор начинается сам, как только игрок подошёл: NPC здоровается первым.
  // Перезапуск привязан к смене узлов дерева, иначе рефетч interact обрывал бы беседу.
  const nodeSignature = dialogue?.nodes.map((n) => n.id).join('|') ?? '';
  useEffect(() => {
    setTalk(open && nodeSignature ? startDialogue(dialogue) : EMPTY_DIALOGUE_STATE);
    // dialogue меняется по ссылке при каждом рефетче — следим за составом узлов.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeSignature]);

  // Игрок сразу попадает в разговор, если мастер его настроил — как в RPG.
  useEffect(() => {
    if (open) setTab(hasDialogue ? 'talk' : 'look');
  }, [open, hasDialogue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.name ?? 'NPC'}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className={s.loading}>
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className={s.error}>
            Взаимодействие недоступно: персонаж должен находиться в одной локации с NPC.
          </p>
        )}

        {data && !isLoading && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="look">Осмотр</TabsTrigger>
              {hasDialogue && <TabsTrigger value="talk">Разговор</TabsTrigger>}
              <TabsTrigger value="quests">
                Квесты{questCount ? ` (${questCount})` : ''}
              </TabsTrigger>
              {isMerchant && <TabsTrigger value="trade">Торговля</TabsTrigger>}
            </TabsList>

            {hasDialogue && (
              <TabsContent value="talk">
                <div className={s.dlgLog}>
                  {talk.history.map((turn, i) => (
                    <p
                      key={i}
                      className={turn.speaker === 'npc' ? s.dlgNpcLine : s.dlgPlayerLine}
                    >
                      {turn.speaker === 'npc' ? `${data.name}: ` : '— '}
                      {turn.text}
                    </p>
                  ))}
                </div>

                {talk.finished ? (
                  <div className={s.dlgEnd}>
                    <span className={s.muted}>Разговор окончен.</span>
                    <Button size="sm" variant="outline" onClick={() => setTalk(startDialogue(dialogue))}>
                      Заговорить снова
                    </Button>
                  </div>
                ) : (
                  <ul className={s.dlgOptions}>
                    {talkOptions.map((opt, i) => (
                      <li key={i}>
                        <button
                          className={s.dlgOption}
                          onClick={() => {
                            setTalk((prev) => chooseOption(dialogue, prev, opt));
                            if (opt.actionType === 'OPEN_SHOP' && isMerchant) setTab('trade');
                            else if (opt.actionType === 'OFFER_QUEST') setTab('quests');
                          }}
                        >
                          {opt.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            )}

            <TabsContent value="look">
              <div className={s.look}>
                {data.portraitUrl && (
                  <img src={data.portraitUrl} alt={data.name} className={s.portrait} />
                )}
                <div className={s.lookBody}>
                  {data.location && <p className={s.muted}>Локация: {data.location.name}</p>}
                  <p>{data.publicDescription || 'NPC молча смотрит на вас.'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quests">
              {!questCount && <p className={s.empty}>Нет доступных квестов.</p>}

              {!!data.availableQuests?.length && <p className={s.sectionTitle}>Доступные</p>}
              <ul className={s.list}>
                {data.availableQuests?.map((q) => (
                  <li key={q.id} className={s.row}>
                    <div>
                      <p className={s.itemName}>{q.title}</p>
                      {q.description && <p className={s.desc}>{q.description}</p>}
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

              {!!data.turnInQuests?.length && <p className={s.sectionTitle}>К сдаче</p>}
              <ul className={s.list}>
                {data.turnInQuests?.map((q) => {
                  const pending = q.status === 'READY_FOR_TURN_IN';
                  const objectives = q.objectives ?? [];
                  const objectivesDone = objectives.every((o) => o.completed);
                  return (
                    <li key={q.id} className={s.row}>
                      <div className={s.turnInMain}>
                        <p className={s.itemName}>{q.title}</p>
                        {pending && <p className={s.muted}>Ожидает подтверждения мастера</p>}
                        {objectives.map((o) => (
                          <p
                            key={o.objectiveId}
                            className={o.completed ? s.objectiveDone : s.objective}
                          >
                            {o.completed ? '✓' : '•'} {o.targetLabel || o.objectiveType} —{' '}
                            {o.currentCount ?? 0}/{o.requiredCount ?? 1}
                          </p>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || !objectivesDone || turnInQuest.isPending}
                        title={!objectivesDone ? 'Не все цели выполнены' : undefined}
                        onClick={() =>
                          turnInQuest.mutate({ campaignId, npcId, questId: q.questId, characterId })
                        }
                      >
                        {pending ? 'Ожидает' : 'Сдать'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </TabsContent>

            {isMerchant && (
              <TabsContent value="trade">
                <div className={s.balance}>
                  <span>Золото персонажа</span>
                  <span className={s.balanceValue}>
                    {goldBalance !== null ? `${goldBalance} зм` : '—'}
                  </span>
                </div>

                <p className={s.sectionTitle}>Купить</p>
                {!data.shopItems?.length && <p className={s.empty}>Лавка пуста.</p>}
                <ul className={s.list}>
                  {data.shopItems?.map((item) => {
                    const price = toNumber(item.priceGold);
                    const affordable =
                      price === null || goldBalance === null || goldBalance >= price;
                    // Позиции с базовым запасом остаются в витрине с нулём — покупать нечего.
                    const outOfStock = item.quantity === 0;
                    return (
                      <li key={item.id} className={s.row}>
                        <div>
                          <p className={s.itemName}>{item.itemName}</p>
                          <p className={s.itemMeta}>
                            {price ?? '—'} зм
                            {typeof item.quantity === 'number'
                              ? outOfStock
                                ? ' · нет в наличии'
                                : ` · в наличии: ${item.quantity}`
                              : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={busy || !affordable || outOfStock}
                          title={
                            outOfStock
                              ? 'Товар распродан'
                              : !affordable
                                ? 'Недостаточно золота'
                                : undefined
                          }
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
                    );
                  })}
                </ul>

                <p className={s.sectionTitle}>Продать</p>
                {backpack.isLoading && <p className={s.muted}>Загрузка инвентаря…</p>}
                {!backpack.isLoading && !sellable.length && (
                  <p className={s.empty}>Нет предметов на продажу.</p>
                )}
                <ul className={s.list}>
                  {sellable.map((item) => {
                    const base = toNumber(item.priceGold) ?? 0;
                    const payout = Math.round(base * buybackRate * 100) / 100;
                    return (
                      <li key={item.id} className={s.row}>
                        <div>
                          <p className={s.itemName}>{item.displayName}</p>
                          <p className={s.itemMeta}>
                            выкуп: {payout} зм
                            {item.quantity > 1 ? ` · у вас: ${item.quantity}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            sellItem.mutate({
                              campaignId,
                              npcId,
                              data: { characterId, itemInstanceId: item.id, quantity: 1 },
                            })
                          }
                        >
                          Продать
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
