# BACKEND_REQUIREMENTS — тактический бой (действия и размеры фишек)

Этот документ описывает доработки бэкенда, нужные для полной поддержки новых
фронтенд-фич: базовых действий (Сходить / Перелететь / Оттолкнуть), правила
high ground и размеров фишек существ. Часть уже сделана (отмечено ✅), часть
требует работы на бэкенде (отмечено ⛔ TODO).

Репозитории:
- **core** (бой): `C:\SuperHerecy\SuperManagerofHeresyforIdiots` (`com.dnd.app`)
- **map-service** (карта): `C:\SuperHerecy\SuperManagerofHeresyforIdiots-map` (`com.dnd.map.map_service`)

---

## 1. Размеры фишек существ

Правило: Tiny–Medium → 1×1, Large → 2×2, Huge → 3×3, Gargantuan → 4×4
(каждый размер выше Medium добавляет +1 к стороне).

### ✅ Сделано (этот PR)
- **map-service:** `CreateTokenFromCombatantRequest` теперь принимает необязательные
  `widthCells` / `heightCells`. `TokenCombatLinkService.createToken` применяет
  GM-выбранный размер (иначе — размер из combatant reference). Это даёт мастеру
  ручной выбор размера **при размещении** (фронтенд шлёт выбранный размер).
- **frontend:** в составе боя селектор «Размер фишки» (1×1…4×4); размер уходит в
  `from-combatant`. Хелпер `sizeToCells(sizeCode)` (FE) уже готов мапить
  категорию размера в клетки, как только бэкенд начнёт её отдавать (см. ниже).

### ⛔ TODO (core) — авторазмер по размеру существа
Сейчас `BattleService.getCombatantReference(...)` (файл
`src/main/java/com/dnd/app/controller/.../BattleService.java`, метод
`getCombatantReference`) **хардкодит** `widthCells = 1`, `heightCells = 1` для
любого существа. Нужно:
- для монстра брать `Monster.size` (`BestiarySize.code`: TINY/SMALL/MEDIUM/LARGE/
  HUGE/GARGANTUAN) и вычислять сторону: LARGE→2, HUGE→3, GARGANTUAN→4, иначе 1;
- для персонажа — взять размер расы (раса персонажа), по умолчанию MEDIUM→1;
- вернуть это в `CombatantReferenceResponse.widthCells/heightCells`.

Тогда фишки будут авторазмериваться при размещении даже без ручного выбора.

### ⛔ TODO (core, опционально) — размер во фронтенд для авто-дефолта селектора
Чтобы селектор размера на фронте по умолчанию вставал на «родной» размер существа,
добавить категорию размера в DTO, видимые фронту:
- `BattleCombatantResponse.sizeCode` (или `widthCells`), либо
- `MapTokenCombatLinkDto` / combatant reference, прокидываемые в снапшот.

### ⛔ TODO (map-service, опционально) — изменение размера после размещения
Сейчас изменить размер можно только при создании токена. Если нужно менять размер
уже размещённой фишки — добавить эндпоинт:
```
PATCH /api/map-sessions/{sessionId}/tokens/{tokenId}
body: { widthCells?, heightCells?, visible?, locked? }
```
с проверкой прав (GM) и broadcast события `TOKEN_UPDATED_EVENT`.

---

## 2. Действие «Оттолкнуть» (Shove)

В обоих бэкендах **нет** концепции shove/push/forced-movement (проверено grep:
`shove|push|knockback|forced.movement` — нет совпадений).

### ✅ Сделано (этот PR, фронтенд)
- Действие «Оттолкнуть» доступно у игрока и у монстра (базовое, не зависит от
  классовых/расовых навыков).
- Ручной шов: выбор соседнего противника → подтверждение → цель сдвигается на 1
  клетку прямо от толкающего через существующий `MOVE_TOKEN`. Работает для того,
  кто **имеет право двигать токен цели** (GM / `canMoveAnyToken`). Игрок толкнуть
  чужой токен через map-service не может (нет прав) — нужен бэкенд (ниже).

### ⛔ TODO (core + map-service) — полноценный контестед-shove
Нужен эндпоинт в core-бою, который:
- проверяет, что действие делает боец текущего хода;
- проводит состязание: Атлетика атакующего против Атлетики/Акробатики цели
  (с учётом размеров — нельзя толкнуть существо больше чем на категорию крупнее);
- при успехе: либо сдвиг на 5 фт (1 клетку) от атакующего, либо «сбит с ног»
  (prone), на выбор атакующего;
- сообщает map-service новую позицию цели (внутренний вызов), чтобы фишка
  сдвинулась авторитетно и с проверкой занятости/границ.

Предлагаемый контракт:
```
POST /api/campaigns/{campaignId}/battles/{battleId}/shove
body: {
  "targetCombatantId": "uuid",
  "mode": "PUSH" | "PRONE",
  "d20": 12,            // бросок атакующего (или rollMode как у attack)
  "targetD20": 9        // бросок цели (или авторолл на сервере)
}
response: {
  "success": boolean,
  "attackerTotal": int, "targetTotal": int,
  "result": "PUSHED" | "PRONE" | "RESISTED",
  "pushToGridX": int|null, "pushToGridY": int|null  // если PUSH, новая клетка цели
}
```
После ответа фронт (или map-service напрямую) применяет перемещение фишки цели.
До появления этого эндпоинта на фронте остаётся ручной GM-шов (см. выше).

---

## 3. High ground (нельзя идти с low ground на high ground)

### ✅ Сделано (этот PR, фронтенд)
- В алгоритме доступных клеток (`computeReach`) заложен **подключаемый** хук
  возвышенности: `ReachTerrainOptions.elevationAt(x,y)` + `ignoreGround`. Сейчас
  данных о рельефе нет → правило выключено (no-op). Полёт всегда передаёт
  `ignoreGround: true` (полёт игнорирует возвышенности).

### ⛔ TODO (map-service + frontend) — данные рельефа в снапшоте
map-service уже хранит тайлы/террейн (`tileStates` в
`MapSessionSnapshotResponse`), но **FE-тип снапшота их не парсит**. Нужно:
- убедиться, что в снапшоте у тайла есть уровень земли (например
  `terrainLevel` / `groundLevel: int`, где больше = выше);
- на фронте добавить `tileStates` в `MapSnapshotDto`/committed-store и заменить
  заглушку `elevationAt` в `TacticalMapCenterPanel` на чтение уровня клетки.

После этого правило «low→high запрещено для ходьбы, разрешено для полёта»
включится без изменений в алгоритме.

---

## Сводка приоритетов
1. (core) Авторазмер фишки по размеру существа в `getCombatantReference` — даёт
   корректные размеры монстров без ручного ввода. **Высокий приоритет.**
2. (core+map) Контестед-shove эндпоинт — чтобы «Оттолкнуть» работал у игроков и
   по правилам. **Средний.**
3. (map+FE) Рельеф в снапшоте — включает правило high ground. **Средний.**
4. (map) PATCH-ресайз токена — менять размер после размещения. **Низкий.**
