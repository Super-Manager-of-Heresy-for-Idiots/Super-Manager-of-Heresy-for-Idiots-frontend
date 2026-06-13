# План: вынос inline-CSS в отдельные стили

Цель — убрать `style={{…}}` (≈3428 вхождений в 126 файлах) и перенести стили
в дизайн-систему: общее → `src/index.css` (токены + `.ao-*` примитивы),
частное → CSS Modules (`*.module.css`) рядом с компонентом.

## Принципы

- **Не вводим Tailwind массово.** Доращиваем существующую `.ao-*` систему.
- **Динамику оставляем inline** только когда значение реально вычисляется
  (ширина прогресс-бара `${pct}%`, координаты, динамический `gridTemplateColumns`).
  «Динамика из набора токенов» → CSS-переменная + класс.
- **JS-hover (`onMouseEnter/onMouseLeave`) → `:hover` в CSS.** Это и чистка, и фикс багов.
- **Состояния через модификаторы:** `className={cn('block', active && 'is-active')}`,
  как уже сделано в `.ao-tab.is-active`, `.wiz-rail-btn.is-active`.
- Любой готовый CSS-Modules-файл импортируется в компонент; общие куски — в `index.css`.

## Рабочий процесс

1. Беру **одну** задачу из списка ниже (сверху вниз).
2. Делаю её, сообщаю что готово.
3. Ты тестируешь визуал в браузере.
4. «ОК» → отмечаю пункт `[x]` и перехожу к следующему. «Не так» → дорабатываю.

Очерёдность — по убыванию охвата: сначала переиспользуемые примитивы и оболочка
(один вынос убирает стили из десятков мест), потом утилиты, в конце — страницы пофайлово.

---

## Фаза 1 — Оболочка и переиспользуемые примитивы

- [x] 1.1 `AppLayout.tsx` — боковая панель (`rail`): вынести стили в классы, заменить JS-hover на `:hover`.
- [x] 1.2 `AppLayout.tsx` — мобильный `drawer` (панель, backdrop, header, nav-кнопки, footer).
- [x] 1.3 `AppLayout.tsx` — `header` и корневой контейнер/`main`.
- [x] 1.4 `components/combat/shell.tsx` — `CombatBackdrop` + `CombatTopBar`. ⏸ правки внесены, визуальный тест ОТЛОЖЕН (combat, BE не готов).
- [x] 1.5 `components/ordo/*` — примитивы (Panel, Chip, Divider, PanelHeader, Bar, Sigil, StatBlock и пр.): вынести inline-стили в классы.
- [ ] 1.6 `components/combat/primitives.tsx` и `components/combat/kit.tsx` — общие боевые виджеты. ⏸ ОТЛОЖЕНО (combat, BE не готов).

## Фаза 2 — Утилиты для частых раскладок

- [x] 2.1 Добавить в `index.css` утилиты под массовые повторы (`.ao-row`, `.ao-col`, `.ao-center`, gap-хелперы) и описать их применение.
- [x] 2.2 Прогнать утилиты по уже отрефакторенным файлам фазы 1, убрать оставшиеся flex/gap-инлайны.

## Фаза 3 — Прочие переиспользуемые компоненты

- [x] 3.1 `components/characters/*` (HPRailPanel, StatusControlPanel, AbilityCheckPanel, MulticlassPanel, ResourcesPanel, WalletPanel/WalletKit, DamageHealModal, EditableSheetField, ReadOnlyOverlay). Попутно: добавлен `src/vite-env.d.ts` (типы CSS-модулей) и починен `.ao-panel.ao-modal` (position/display/радиус — конфликт `.ao-panel`↔`.fixed`).
- [x] 3.2 `components/items/*` (InvRow, ItemTransferModal, RenameStackModal, RarityBadge).
- [x] 3.3 `components/homebrew/*` (ContentPills, Downloads, HBTag, RatingControl, VersionSeal, CodexID, StatusBadge, RichClassWizard).
- [x] 3.4 `components/campaigns/*` + `components/narrative/*` + `components/realtime/*` + `components/gm/*` + `components/bestiary/*` + `components/admin/*`.
- [x] 3.5 `features/character-wizard/*` (parts, steps, ForgeSheetBody, CharacterCreationWizard).

## Фаза 4 — Страницы (пофайлово, CSS Modules)

Каждая страница = отдельная задача: завести `*.module.css` рядом, перенести стили, оставить только реальную динамику.

### 4a. Auth
- [x] 4.1 `pages/auth/LoginPage.tsx`
- [x] 4.2 `pages/auth/RegisterPage.tsx`

### 4b. Combat-preview (полноэкранные экраны) — ⏸ ВСЯ СЕКЦИЯ ОТЛОЖЕНА (combat, BE не готов, нет точки входа в UI)
- [ ] 4.3 `CombatTrackerGMPage.tsx`
- [ ] 4.4 `CombatTrackerPlayerPage.tsx`
- [ ] 4.5 `EncounterBuilderPage.tsx`
- [ ] 4.6 `EncounterListPage.tsx`
- [ ] 4.7 `CombatSummaryPage.tsx`
- [ ] 4.8 `DashboardTilesPage.tsx`
- [ ] 4.9 `LootTableEditorPage.tsx` + `LootGeneratorPage.tsx`
- [ ] 4.10 `QuestDetailV2Page.tsx` + `QuestListV2Page.tsx`
- [ ] 4.11 `NPCDetailV2Page.tsx` + `NPCListV2Page.tsx`
- [ ] 4.12 `SystemPatternsPage.tsx` + `CombatKitReferencePage.tsx` + `CombatPreviewIndexPage.tsx`
- [ ] 4.13 `MobilePreviewPage.tsx`

### 4c. Campaigns
- [x] 4.14 `CampaignListPage.tsx` + `CampaignDashboardPage.tsx`
- [x] 4.15 `CampaignMembersPage.tsx` + `CampaignInvitePage.tsx`
- [x] 4.16 `SessionNotesPage.tsx` + `SharedStoragePage.tsx`
- [x] 4.17 `XPGrantPage.tsx` + `ApplyEffectPage.tsx` + `BalanceManagementPage.tsx`
- [x] 4.18 `InventoryPage.tsx` + `CharacterWalletPage.tsx` + `CharacterResourcesPage.tsx`
- [x] 4.19 `CharacterManagementPage.tsx` + `CharacterPlaceholderPages.tsx` + `CharacterRewardsPage.tsx` + `AddCharacterPage.tsx`
- [ ] 4.20 `FolioPage.tsx`
- [ ] 4.21 `LevelUpWizardPage.tsx` + `CharacterCreationWizardPage.tsx`
- [x] 4.22 `NPCManagerPage.tsx` + `NPCDetailPage.tsx`
- [x] 4.23 `QuestManagerPage.tsx` + `QuestDetailPage.tsx`
- [x] 4.24 `LocationsPage.tsx` + `CampaignBestiaryPage.tsx`

### 4d. Player
- [ ] 4.25 `MyCharactersPage.tsx` + `TemplateWizardPage.tsx` + `TemplateDetailPage.tsx`

### 4e. Homebrew
- [ ] 4.26 `MarketplacePage.tsx` + `MarketplaceDetailPage.tsx`
- [ ] 4.27 `MyDoctrinesPage.tsx` + `InstalledDoctrinesPage.tsx` + `HomebrewLibraryPage.tsx`
- [ ] 4.28 `CreateDoctrinePage.tsx` + `EditDoctrinePage.tsx`
- [ ] 4.29 `HomebrewBestiaryPage.tsx`

### 4f. Bestiary
- [ ] 4.30 `MonsterDetailPage.tsx` + `MonsterFormPage.tsx`

### 4g. Admin
- [ ] 4.31 `AdminDashboardPage.tsx` + `UsersListPage.tsx` + `AdminHomebrewPage.tsx`
- [ ] 4.32 `StatTypesPage.tsx` + `ItemTypesPage.tsx` + `SkillsPage.tsx` + `FeatsPage.tsx`
- [ ] 4.33 `CharacterClassesPage.tsx` + `CharacterRacesPage.tsx` + `SubclassesPage.tsx`
- [ ] 4.34 `LevelRewardsPage.tsx` + `BuffsDebuffsPage.tsx` + `EnchantmentTypesPage.tsx`
- [ ] 4.35 `BestiaryMonstersPage.tsx` + `BestiaryDictionariesPage.tsx`
- [ ] 4.36 `TodoPage.tsx`

## Фаза 5 — Финал

- [ ] 5.1 Сквозная проверка: `npx tsc -b --force`, поиск оставшихся `style={{` (должны остаться только обоснованные динамические).
- [ ] 5.2 Финальный визуальный прогон ключевых экранов.

---

## Журнал

Здесь отмечаю статус по мере выполнения (что сделано, что в работе, замечания с тестов).

- **Combat отложен:** все экраны/виджеты `combat` (1.6, секция 4b, отчасти 1.4) — FE опережает BE,
  под них нет API и нет точки входа в навигации (`/combat-preview/*` доступны только по прямому URL).
  Правки, уже внесённые в `shell.tsx` (1.4), оставлены. К combat вернёмся, когда будет готов backend.
