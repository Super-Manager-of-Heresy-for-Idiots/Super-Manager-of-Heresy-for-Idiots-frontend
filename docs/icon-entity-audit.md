# Аудит значков для UI/UX

Дата: 2026-07-05.

Цель документа: отделить сущности, которым реально нужен собственный значок в интерфейсе, от сущностей, которые были включены в прошлую версию слишком широко. Значок нужен там, где он помогает пользователю быстрее распознавать раздел, объект, действие или состояние. Значок не нужен там, где сущность является внутренней моделью, редким enum, техническим событием или хорошо читается обычным текстовым бейджем.

## Проверенные источники

- `src/components/layout/AppLayout.tsx` - основная навигация по ролям.
- `src/components/layout/CampaignLayout.tsx` - навигация внутри кампании.
- `src/router.tsx` - реальные страницы приложения.
- `src/types/index.ts` - core/frontend DTO, enum и union-типы.
- `src/features/map/types/mapApiTypes.ts` - map-service DTO и enum-типы.
- `src/features/messenger/types/index.ts` - messenger DTO и enum-типы.
- `src/components/content-rewards/grants.ts` и `RewardGroupRenderer.tsx` - типы наград и grant'ов.
- Backend domain: `SuperManagerofHeresyforIdiots/src/main/java/com/dnd/app/domain`.
- Map domain: `SuperManagerofHeresyforIdiots-map/src/main/java/com/dnd/map/map_service`.
- Messenger domain: `SuperManagerofHeresyforIdiots-messenger/src/main/java/com/dnd/messenger/chat`.

## Критерий отбора

Сущность реально требует отдельный значок, если выполняется хотя бы одно условие:

- она видна в основной навигации, табах, карточках или списках;
- пользователь часто выбирает ее среди похожих сущностей;
- значок ускоряет сканирование плотного интерфейса;
- состояние важно распознавать мгновенно: активен/закрыт, видим/скрыт, прочитано/непрочитано, выбран/заблокирован;
- это повторяемый доменный тип: предмет, персонаж, монстр, карта, квест, заклинание, слот экипировки.

Сущности не нужен отдельный значок, если это:

- внутренняя backend/model сущность без самостоятельного UI;
- техническое событие WebSocket или audit/log запись;
- enum, который появляется редко и лучше читается текстом;
- подтип, где достаточно цвета, бейджа или числа;
- промежуточная таблица, DTO, request/response или join entity.

## Текущая проблема

В `AppLayout.tsx` разные сущности сейчас получают одинаковые глифы:

| Текущий glyph | Где переиспользуется | Почему это проблема |
| --- | --- | --- |
| `helm` | кампании, пользователи, NPC, ход игрока | не отличает организационный раздел от персонажа/NPC |
| `shield` | персонажи, классы, admin characters | смешивает героя, класс и защиту |
| `scroll` | сообщения, item templates, homebrew, notes, quests | слишком общий знак для разных типов контента |
| `sword` | item catalog, bestiary, storage | смешивает оружие, монстров и хранилище |
| `book` | marketplace, library, admin, dictionaries | не различает каталог, админку и справочник |
| `hex` / `sigil-*` | blueprints, effects, species, maps | декоративный знак вместо предметного |
| `diamond` | stats, quality, rule workbench, modifiers | теряется смысл показателя, проверки и правила |

## Часть 1. Реально нужны значки

Это практический UI/UX backlog. Эти значки стоит завести как `entityIcon` / `statusIcon` / `actionIcon` и использовать в навигации, карточках, табах, списках, picker'ах, empty/error states и компактных бейджах.

### P0 - основные разделы и сущности

| Сущность | Нужные значки | Где нужны |
| --- | --- | --- |
| Кампания | `campaign`, `campaign-active`, `campaign-paused`, `campaign-completed` | основная навигация, список кампаний, campaign shell |
| Персонаж | `character`, `character-template`, `character-in-campaign` | навигация, карточки персонажей, ростер |
| Пользователь | `user`, `user-player`, `user-game-master`, `user-admin` | админка, account switcher, участники кампании |
| Друзья | `friends`, `friend-request`, `blocked-user` | social page, invite/chat flows |
| Сообщения | `messages`, `unread-message`, `read-message`, `typing` | навигация, список чатов, уведомления |
| Homebrew package | `homebrew-package`, `homebrew-draft`, `homebrew-published`, `homebrew-installed` | marketplace, GM library, installed doctrines |
| Campaign blueprint | `campaign-blueprint`, `blueprint-draft`, `blueprint-published`, `blueprint-fork` | blueprint marketplace, my blueprints |
| Админ-панель | `admin-dashboard`, `admin-users`, `admin-content` | admin navigation |
| Класс | `class`, `subclass`, `class-feature`, `class-level` | class pages, character wizard, level-up |
| Раса / species | `race`, `species`, `lineage`, `species-trait` | wizard, admin species, NPC origin |
| Заклинание | `spell`, `spellbook`, `known-spell`, `prepared-spell` | spell picker, character sheet, class grants |
| Ячейка заклинаний | `spell-slot`, `spell-slot-used`, `spell-slot-available` | character sheet, spellcasting panels |
| Предмет | `item`, `item-template`, `item-instance`, `item-equipped` | inventory, catalog, rewards, storage |
| Бестиарий / монстр | `bestiary`, `monster`, `monster-system`, `monster-homebrew`, `monster-campaign` | bestiary pages, encounter builder |
| Квест | `quest`, `quest-active`, `quest-completed`, `quest-failed`, `quest-hidden`, `quest-archived` | quest list/detail, campaign dashboard |
| Локация | `location`, `location-visible`, `location-hidden` | locations list/detail, blueprint content |
| NPC | `npc`, `npc-freeform`, `npc-class-based`, `npc-monster-based` | NPC manager, NPC detail, encounter tools |
| Бой | `battle`, `battle-assembling`, `battle-active`, `battle-completed` | combat tracker, campaign battle panel |
| Карта | `map`, `map-editor`, `map-session`, `tactical-map` | campaign maps, map editor/session, tactical battle |
| Кошелек/валюта | `wallet`, `currency`, `transaction` | campaign balances, character wallet |
| Общее хранилище | `shared-storage`, `deposit`, `withdraw` | campaign storage |
| Заметка сессии | `session-note`, `private-note`, `public-note` | notes page, GM/player visibility |

### P1 - частые подтипы и статусы

| Сущность | Нужные значки | Где нужны |
| --- | --- | --- |
| Роли | `role-player`, `role-game-master`, `role-admin`, `campaign-creator` | role badges, registration, admin users |
| Статусы персонажа | `character-active`, `character-dead`, `character-reserve` | roster, character cards |
| Видимость | `visible`, `hidden`, `locked`, `unlocked`, `private`, `public` | quests, locations, NPC, notes, map tokens |
| Характеристики | `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma` | character sheet, ability checks, race bonuses |
| Проверки/спасброски | `ability-check`, `saving-throw`, `proficiency`, `expertise` | sheet, spell details, monster statblock |
| HP и здоровье | `hp`, `temporary-hp`, `damage`, `healing`, `downed`, `death-save` | sheet, combat tracker |
| Скорость | `speed-walk`, `speed-fly`, `speed-swim`, `speed-climb`, `speed-burrow` | race/species, monsters, character sheet |
| Размер существа | `size-tiny`, `size-small`, `size-medium`, `size-large`, `size-huge`, `size-gargantuan` | race/species, monsters, map token size |
| Навыки | `skill`, `skill-passive`, `skill-active`, `skill-proficiency` | class grants, sheet, admin skill refs |
| Ресурсы | `resource`, `resource-spent`, `resource-restored`, `custom-resource` | character resources, feature runtime panels |
| Умения | `feature`, `feature-action`, `feature-choice`, `feature-effect`, `pending-prompt` | character feature panels, level-up |
| Формы/трансформации | `known-form`, `transformation`, `companion` | known forms, companions panels |
| Слоты экипировки | `slot-head`, `slot-chest`, `slot-legs`, `slot-feet`, `slot-main-hand`, `slot-off-hand`, `slot-ring`, `slot-neck`, `slot-cloak` | inventory loadout, item detail, equip dialogs |
| Редкость | `rarity-common`, `rarity-uncommon`, `rarity-rare`, `rarity-very-rare`, `rarity-legendary` | item catalog, inventory, storage |
| Тип предмета | `equipment`, `weapon`, `armor`, `shield-item`, `magic-item`, `consumable`, `tool` | catalog filters, item cards |
| Тип урона | `damage-slashing`, `damage-piercing`, `damage-bludgeoning`, `damage-fire`, `damage-cold`, `damage-lightning`, `damage-poison`, `damage-necrotic`, `damage-radiant`, `damage-psychic`, `damage-force`, `damage-thunder`, `damage-acid` | spell detail, monster statblock, combat result |
| Устойчивость к урону | `damage-vulnerability`, `damage-resistance`, `damage-immunity` | monster detail |
| Состояния/conditions | `condition`, `condition-active`, `condition-immunity` | bestiary, combat, effects |
| Действия боя | `action`, `bonus-action`, `reaction`, `legendary-action` | combat tracker, feature actions |
| Результат атаки | `hit`, `miss`, `crit`, `target` | combat log/result |
| Награды | `reward`, `reward-item`, `reward-currency`, `reward-xp`, `reward-choice` | quest detail, level-up, loot |
| Grant-типы | `grant-feature`, `grant-subclass`, `grant-feat`, `grant-spell`, `grant-skill`, `grant-ability`, `grant-modifier`, `grant-custom`, `grant-unknown` | level-up reward renderer, content quality |
| Баф/дебаф | `buff`, `debuff`, `active-effect`, `expired-effect` | effects pages, character sheet, item buffs |
| Зачарование | `enchantment`, `enchantment-type`, `attunement`, `charges` | item template/detail, admin enchantments |
| Источник контента | `system-content`, `homebrew-content`, `campaign-content`, `source-book` | bestiary, races, marketplace |
| Рейтинг/загрузки | `rating-like`, `rating-dislike`, `downloads`, `author`, `tag` | marketplace/homebrew |

### P1 - карты и tactical UI

| Сущность | Нужные значки | Где нужны |
| --- | --- | --- |
| Map asset | `map-asset`, `map-image`, `asset-upload`, `asset-download` | map list/editor |
| Grid type | `grid-square`, `grid-hex-vertical`, `grid-hex-horizontal`, `grid-free` | map editor, calibration |
| Grid calibration | `calibration`, `calibration-bounds`, `calibration-points` | map editor |
| Map session status | `map-session-active`, `map-session-paused`, `map-session-closed` | session page, map list |
| Token type | `token-character`, `token-npc`, `token-monster`, `token-object`, `token-marker` | map token layer, token creation |
| Token state | `token-locked`, `token-unlocked`, `token-visible`, `token-hidden`, `token-selected` | map session |
| Fog | `fog`, `fog-revealed`, `fog-hidden`, `fog-brush` | map tools |
| Terrain | `terrain-normal`, `terrain-high-ground`, `terrain-super-high-ground` | tactical map |
| Map element | `element-wall`, `element-roof`, `element-shape`, `element-line` | map editor |
| Viewport tools | `zoom-in`, `zoom-out`, `reset-view`, `fit-map`, `toggle-grid`, `fullscreen`, `pan-tool` | map toolbar |
| Presence | `map-cursor`, `map-ping`, `map-user-presence` | live map session |
| Combat placement | `place-combatant`, `linked-combatant`, `unlinked-combatant` | tactical battle + map integration |

### P1 - spellcasting

| Сущность | Нужные значки | Где нужны |
| --- | --- | --- |
| Уровень заклинания | `spell-cantrip`, `spell-level-1` ... `spell-level-9` | spell list, picker, detail |
| Ячейка заклинания | `spell-slot-1` ... `spell-slot-9`, `spell-slot-used`, `spell-slot-restored` | character sheet |
| Школа магии | `abjuration`, `conjuration`, `divination`, `enchantment-school`, `evocation`, `illusion`, `necromancy`, `transmutation` | spell detail/list filters |
| Компоненты | `component-verbal`, `component-somatic`, `component-material` | spell detail |
| Casting flags | `ritual`, `concentration`, `spell-attack-roll`, `spell-saving-throw` | spell cards/detail |
| Spell outcome | `spell-damage`, `spell-healing`, `spell-buff`, `spell-debuff`, `spell-summon` | spell detail and combat usage |

### P2 - полезно, но после P0/P1

| Сущность | Нужные значки | Где нужны |
| --- | --- | --- |
| Словари bestiary | `dictionary`, `dictionary-creature-types`, `dictionary-languages`, `dictionary-conditions`, `dictionary-damage-types` | admin dictionaries |
| Import/quality | `import-warning`, `validation-error`, `validation-warning`, `missing-data`, `validation-ok` | content quality, warnings pages |
| Feature rules admin | `rule-workbench`, `feature-rule`, `rule-approved`, `rule-needs-review`, `rule-disabled`, `formula` | admin Rule Workbench |
| Formula result type | `formula-integer`, `formula-decimal`, `formula-boolean`, `formula-duration`, `formula-dice`, `formula-modifier` | Formula Lab, if compact UI needs it |
| Blueprint internals | `blueprint-npc`, `blueprint-quest`, `blueprint-location`, `blueprint-reward`, `blueprint-homebrew` | blueprint editor/detail |
| Bug report | `bug-report`, `bug-open`, `bug-resolved` | bug widget/admin if exposed |
| Empty/loading/error | `loading`, `empty-state`, `error-state`, `retry`, `not-found`, `forbidden` | shared UI states |
| Language | `language`, `language-ru`, `language-en` | language switcher, if icons are desired |

## Часть 2. Добавлено слишком широко, отдельный значок не нужен

Эти пункты были включены в прошлую версию как “все сущности”, но с точки зрения UI/UX отдельный icon-token для каждого из них сейчас не оправдан. Их стоит показывать текстом, цветом, бейджем, числом или вообще не выносить в UI.

### Backend/DTO сущности без самостоятельного UI

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `ApiResponse`, `PageResponse`, request/response DTO | техническая оболочка API, пользователь ее не видит |
| `Create*Request`, `Update*Request`, `*Response` как отдельные модели | это контрактные формы данных, не отдельные визуальные объекты |
| `Id` / composite id классы | внутреннее хранение |
| `RefreshToken`, `AuthResponse`, `ValidationErrorResponse` | технические auth/API детали |
| `MapSnapshotDto`, `MapSnapshotMap`, `MapSnapshotSession` | snapshot - transport model; в UI нужны map/session/token, не snapshot |
| `BattleActionResultResponse`, `TurnStateDto`, `CombatantTurnResponse` | результат можно визуализировать через hit/miss/damage/turn, отдельная DTO-иконка не нужна |
| `CharacterV2Response`, backward-compat aliases | alias, не UI-сущность |

### Внутренние feature rules сущности

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `FeatureRuleRevision` | в UI достаточно `revision` текстом/номером |
| `FeatureRuleSource`, `RuleSource`, `Ruleset` | редкие admin metadata, можно бейджем |
| `FeatureRuleOwnerType` | технический owner, лучше текстовый label |
| `FeatureRuleProfile` | если понадобится, достаточно одного `rule-profile`, не отдельной иконки на профиль |
| `FeatureEffectEndCondition` | слишком внутренний rule detail |
| `FeatureEffectModifier` | достаточно общего `effect-modifier` или текстового модификатора |
| `EffectStackingPolicy` | лучше текстовый бейдж, не icon-token на каждую policy |
| `ChoiceTiming`, `ChoiceReplacePolicy`, `ChoiceOptionType` | admin-настройки, читаются текстом |
| `GrantTiming` | внутренний timing; если всплывет в UI, бейдж |
| `DurationUnit`, `RestType` как отдельные классы | лучше `short-rest`/`long-rest` только в пользовательских местах |
| `TriggerEventType`, `GameplayEvent`, `FeatureUseLog` | лог/триггер, отдельные event icons не нужны, максимум общий `trigger` |
| `FeatureAllowedMonsterFilter`, `FeatureSpellFilter` | фильтры лучше показывать текстом и chips |

### Слишком детальные статусы и enum

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `FormulaRoundingMode`: `floor`, `ceil`, `nearest`, `none` | лучше текст/селект, не иконки |
| `AbilityScoreBonusMode`: `FIXED`, `CHOICE` | достаточно текстового бейджа, кроме общего `ability-bonus` |
| `RaceTraitRecharge`: `NONE`, `CUSTOM`, `PROFICIENCY_BONUS_PER_LONG_REST` | для большинства экранов текст понятнее |
| `RaceTraitActionType.PART_OF_ATTACK_ACTION` | слишком специализировано, лучше label |
| `SkillProficiencySource`: `CLASS`, `BACKGROUND`, `RACE`, `FEAT`, `OTHER` | можно показывать маленьким текстовым source-chip |
| `FriendRequestDirection`: `INCOMING`, `OUTGOING` | можно оставить стрелки/лейбл в конкретном компоненте, не доменный icon-token |
| `RelationshipView` / `RelationshipStatus` значения | нужны только friend/block/pending, не полный enum |
| `AttackRollMode` | если редко используется, текст в форме понятнее |
| `ScoreMethod` | не требует отдельной пиктограммы |
| `FeatureIssueSeverity` отдельно от общих severity icons | достаточно `severity-info/warning/error` |

### Map события и transport-level события

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `TOKEN_CREATED_EVENT`, `TOKEN_MOVED_EVENT`, `TOKEN_DELETED_EVENT` | если будет event feed, можно использовать token + action, не отдельный icon-token на событие |
| `TOKEN_LOCKED_EVENT`, `TOKEN_UNLOCKED_EVENT` | достаточно `locked/unlocked` |
| `FOG_REVEALED_EVENT`, `FOG_HIDDEN_EVENT` | достаточно `fog-revealed/fog-hidden` |
| `MAP_SESSION_STARTED_EVENT`, `MAP_SESSION_CLOSED_EVENT` | достаточно status icons session active/closed |
| `MAP_DEFINITION_CHANGED_EVENT` | техническое событие, максимум общий `map-changed` |
| `ChatEventType`: `SESSION_OPENED`, `MESSAGE_CREATED`, `PARTICIPANT_READ`, `SESSION_CLOSED` | в обычном UI нужны message/read/closed, не event token |
| Core `WsEventType` | не заводить значки без конкретного event feed UI |

### Чрезмерно детальные content/model сущности

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `BackgroundEquipmentEntry`, `BackgroundEquipmentOption`, `BackgroundEquipmentChoiceGroup` | в UI достаточно `background-equipment` и текстовых списков |
| `BackgroundFeatOption`, `BackgroundLanguageProficiency`, `BackgroundToolProficiency` | достаточно `feat`, `language`, `tool` |
| `ClassAuthoringIdempotencyRecord` | техническая сущность |
| `CharacterRewardAbilityScoreSelectionId`, `CharacterRewardSkillSelectionId`, `CharacterRewardSpellSelectionId` | join/id модели |
| `ClassLevelRewardGrant*` как отдельные Java-классы | в UI достаточно grant icons: spell/feat/skill/ability/etc |
| `SpellDamage`, `SpellHealing`, `SpellComponent` как отдельные model classes | нужны icons для damage/healing/components, не для model class |
| `MagicItemAllowedEquipmentId`, `WeaponItemPropertyId` | join/id модели |
| `HomebrewContentItem`, `HomebrewContentVersion` как отдельные детальные сущности | нужны `content-version` и `homebrew-package`, не каждый класс |
| `CampaignHomebrewId`, `BlueprintHomebrewId`, `GmHomebrewLibraryId` | join/id модели |

### Слишком мелкие UI-подтипы

| Сущность | Почему не нужен отдельный значок |
| --- | --- |
| `spell-slot-restored` как отдельная постоянная иконка | можно использовать `spell-slot` + success color/state |
| `item-custom-name` | это текстовое состояние, не иконка |
| `xp-to-next` | достаточно progress/number, отдельная иконка не нужна |
| `gold-equivalent` | число/подпись понятнее |
| `campaign-member-count` | счетчик рядом с `campaign-members`, отдельный icon-token не нужен |
| `download-author-tags` как отдельные редкие варианты | достаточно `downloads`, `author`, `tag` |
| `grid-columns`, `grid-rows`, `cell-size`, `background-color` | поля формы, лучше label/input, не иконка |
| `drag-preview` | transient visual state, не icon-token |
| `participant-read` и `participant-unread` как отдельные participant icons | достаточно read/unread message states |

## Итоговая рекомендация

1. Начать с P0: заменить общие `glyph` в `AppLayout.tsx`, `CampaignLayout.tsx` и ключевых карточках на семантические `iconKey`.
2. Затем внедрить P1 там, где интерфейс плотный: character sheet, inventory, spell slots, bestiary, combat tracker, map toolbar.
3. P2 делать только при работе над конкретными admin/features screens.
4. Не заводить icon-token для DTO, request/response, join id, backend-only моделей и transport events без видимого UI-сценария.

## Предлагаемый технический формат

- Ввести единый реестр `entityIcons.ts`, например `Record<EntityIconKey, GlyphKind | LucideIcon | AssetIconRef>`.
- Разделить ключи на `entity`, `status`, `action`, `tool`.
- Для предметов, монстров, рас/species и homebrew оставить возможность `imageUrl/iconUrl`, но fallback брать из `entityIcons`.
- Для навигации заменить ручные `glyph` на семантический ключ: `iconKey: 'campaign'`, `iconKey: 'messages'`, `iconKey: 'quest'`.
- Не смешивать entity icons и status icons: `quest` - сущность, `quest-completed` - состояние.
- Не добавлять inline SVG в страницы. Иконки должны идти через общий компонент (`Rune`, lucide wrapper или asset icon component), чтобы размер, цвет, aria и fallback были единообразны.
