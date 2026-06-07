Готово. WebSocket теперь подключён по спеке.

Что сделано

src/hooks/useWebSocket.tsx — переписан диспетчер. Раньше использовались неверные query-keys (['characters', id]) и обработчики были «плоские». Теперь:

Событие	Что делает
HP_CHANGED	Оптимистично патчит кэш ['campaigns', cid, 'characters', charId] (currentHp/tempHp/maxHp — мгновенный апдейт HP-полоски), затем инвалидирует.
CHARACTER_UPDATED	setQueryData на полный DTO + invalidate.
XP_GRANTED	Инвалидирует каждого из data.characterIds + список.
ITEM_GRANTED/ITEM_REMOVED	Invalidate inventory, characters/:id, и storage кампании.
BUFF_APPLIED/BUFF_REMOVED	Invalidate effects, stats (т.к. бафы влияют на модификаторы) и сам персонаж.
NPC_REVEALED/HIDDEN	Invalidate список NPC + конкретный npcId.
QUEST_UPDATED	Invalidate список квестов + конкретный data.questId.
CAMPAIGN_STATUS_CHANGED	Invalidate ['campaigns', cid] и ['campaigns'].
MEMBER_KICKED	По форме data: { userId } → topic (другой кикнут → invalidate roster); { campaignId } → user-queue (текущего пользователя кикнули) → removeQueries кампании, wsService.disconnect(), navigate('/campaigns', { replace: true }).
Свои тосты глушатся: если event.triggeredBy === currentUser.id, кэш всё равно обновляется, но toast.custom не вызывается — GM не видит уведомления о собственных действиях.

Точка монтирования

src/components/layout/AppLayout.tsx — добавлен внутренний <CampaignWsBridge />:

function CampaignWsBridge() {
const match = useMatch('/campaigns/:campaignId/*');
useWebSocket(match?.params.campaignId);
return null;
}

Раньше useWebSocket был объявлен, но нигде не вызывался — сокет вообще не открывался. Bridge живёт в стабильной позиции внутри AppLayout (над <Outlet />), поэтому:

навигация внутри /campaigns/:campaignId/* — соединение не дёргается;
смена campaignId — disconnect → connect с новым id;
уход на не-campaign-роут (/marketplace, /admin/...) — disconnect;
на /campaigns (список) сокет тоже закрыт — на странице кампаний ещё ничего не подписано.
Что НЕ покрыто (намеренно)

Реконнект отключён в wsService (reconnectDelay: 0) — это решение архитектуры WS-сервиса, не трогал.
Дедуп в стороне wsStore.addNotification (UUID на клиенте) — спека упоминает идемпотентность; инвалидация по природе идемпотентна, но если хочется убирать дубли в Notification-стрипе, надо завести ключ по (type, campaignId, characterId, timestamp). Скажешь — добавлю.
tsc --noEmit — чисто.