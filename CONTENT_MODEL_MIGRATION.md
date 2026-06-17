# Content Model Migration (frontend)

> Живой документ миграции non-bestiary контента (character creation, level-up,
> homebrew authoring, admin, character sheet) с legacy PHB-модели на новую
> нормализованную content-модель. Источник плана: `frontend-migration-prompt.md`.
> **Bestiary не трогаем.**

---

## ⚠️ Инженерная заметка (Phase 1) — читать обязательно

Бэкенд **сейчас гибридный**: часть non-bestiary эндпоинтов всё ещё отдаёт legacy-форму,
а финальные нормализованные контракты (reference/classes, level-up-options, level-up,
rewards) внедряются постепенно. Поэтому:

1. **Экраны могут временно ломаться** во время миграции — это допустимо и ожидаемо
   (правило промпта: «временно сломанный экран во время миграции — допустимо»).
   Ломаемся только в runtime; **компиляция/билд должны оставаться зелёными** на каждой фазе.
2. **Не добавляем новые compatibility-слои под старые контракты.** Adapter
   (`src/lib/contentAdapters.ts`) оставляем только там, где он упрощает UI-код.
3. **Никакая новая фича не должна зависеть от старых контрактов.** Новые экраны
   пишутся in-place поверх финального контракта.
4. **Homebrew authoring — без ввода сырого JSON.** Гибкость только через UI-контролы.
5. **Persistence выбора наград не реализуем раньше, чем это указано в фазе**
   (read-флоу и commit-флоу разнесены: Phase 6 = read, Phase 7 = commit).

Legacy-поля в типах временно сохранены и помечены `@deprecated (legacy ...)`.
Они удаляются в Phase 11–12, когда потребляющие их экраны мигрированы и компилируются.

---

## Финальные контракты (single source of truth)

### Endpoints (финальные, заменяют старые in-place)

- `GET /api/campaigns/{campaignId}/reference/classes`
- `GET /api/reference/classes`
- `GET /api/characters/{id}/level-up-options`
- `POST /api/characters/{id}/level-up`
- `GET /api/characters/{id}/rewards`

### Grant types (typed payloads)

`FEATURE`, `SUBCLASS`, `FEAT`, `SPELL`, `SKILL_PROFICIENCY`, `ABILITY_SCORE`,
`NUMERIC_MODIFIER`, `CUSTOM_TEXT`.

> `grantType` на бэке — гибкий текст. Фронт рендерит известные типы по-своему,
> а **неизвестные — как custom/manual без падения**.

---

## Contract doc: old API fields → final fields → screen migration status

Маппинг legacy-полей фронта на финальные DTO-поля и статус миграции экранов.

### ContentLabelDto

| final field | заметки |
|---|---|
| `id`, `slug`, `name`, `nameRu`, `nameEn` | базовый локализованный ярлык; в коде `ContentLabel` |

### ContentClassDetailResponse (в коде `CharacterClassDetailResponse`)

| legacy field (frontend) | final field | заметки |
|---|---|---|
| `primaryAbilityStatId` | `primaryAbilities[]` | было одно, стало массив |
| `savingThrowStatNames[]` | `savingThrows[]` (`ContentLabel[]`) | строки → лейблы |
| `skillChoiceOptions[]` (`ProficiencySkillResponse`) | `skillOptions[]` (`ContentLabel[]`) | + `skillChoiceCount`, `skillChoiceAny` |
| `armorWeaponProficiencies` (single) | `armorProficiencyText` / `weaponProficiencyText` / `toolProficiencyText` | разнесено по 3 блокам |
| — | `subtitle`, `hitDie`, `spellcasting`, `features[]`, `rewardGroups[]` | новые |

### RewardGroupDto (в коде `RewardGroup`)

| legacy field | final field | заметки |
|---|---|---|
| `rewardType` (string) | `groupKind` + typed `grants[]` | rewardType-only допущение удаляется в Phase 11 |
| `isChoice` (bool) | `chooseMin` / `chooseMax` | choice выводится из choose-правил |
| `rewards[]` (`RewardEntry`, плоские) | `options[]` (`RewardOptionDto`) + `grants[]` (`RewardGrantDto`) | плоские → структурные |
| — | `id`, `classId`, `classFeatureId`, `classLevel`, `sortOrder`, `prompt`, `description`, `repeatable` | новые |

### RewardOptionDto / RewardGrantDto

| final field | заметки |
|---|---|
| Option: `id`, `optionKey`, `label`, `labelRu`, `labelEn`, `description`, `recommended`, `sortOrder`, `grants[]` | |
| Grant: `id`, `grantType`, `label`, `labelRu`, `labelEn`, `description`, `sortOrder`, + typed payload | |

### ClassFeatureSummaryDto (в коде `ClassFeatureSummary`)

| final field | заметки |
|---|---|
| `id`, `slug`, `classId`, `subclassId`, `level`, `sortOrder`, `title`, `description` | |

---

## Статус миграции экранов (screen migration status)

| Экран / область | Файл | Статус |
|---|---|---|
| Class reference data source | `src/api/reference.api.ts` | legacy (Phase 3) |
| Dev-only class reference viewer | `src/pages/dev/ContentClassViewerPage.tsx` (`/dev/content-classes`) | ✅ Phase 3 |
| Reward visual components | `src/components/content-rewards/` (`RewardGrantLine`, `RewardOptionCard`, `RewardGroupView`, `FeatureTimeline`, `grants.ts`) | ✅ Phase 4 |
| Character creation wizard | `src/features/character-wizard/` | ✅ Phase 5: read-flow на финальном detail + reward-валидация + Vitest-тесты (old local-path как safety net до Phase 11–12) |
| Level-up read model | `src/pages/gm/campaigns/LevelUpWizardPage.tsx` | ✅ Phase 6: финальный options-контракт + content-группы через `RewardGroupView` + валидация гейтит Next |
| Level-up commit | `LevelUpWizardPage.tsx` + `contentLevelUp.ts` + `RewardGroupPicker` | ✅ Phase 7: ContentLevelUpRequest + child-пикеры; legacy submit удалён |
| Homebrew authoring | `features/class-builder/*` (admin ✅), `homebrew/RichClassWizard.tsx` (legacy) | 🚧 Phase 8: новый табовый builder на authoring-контракте, смонтирован для admin (legacy admin-wizard удалён); homebrew-mount — follow-up |
| Admin tools | `src/pages/admin/` | legacy (Phase 9) |
| Character sheet (runtime data) | — | legacy (Phase 10) |

---

## Contract fixtures

Типизированные фикстуры финального контракта живут в
`src/fixtures/contentModel.ts` и покрывают случаи:

- class without spellcasting;
- full caster;
- half caster;
- class with subclass choice;
- class with several reward groups at one level;
- homebrew custom grant.

Они типизированы строго против финальных DTO — это даёт compile-time проверку,
что наши типы совпадают с контрактом бэкенда, и служат данными для dev-only viewer (Phase 3–4).

---

## Лог по фазам

- **Phase 1** ✅ инженерная заметка добавлена; новые фичи не вяжутся к legacy-контрактам.
- **Phase 2** ✅ типы выровнены под финальные DTO (superset, legacy `@deprecated`);
  заведены `KNOWN_GRANT_TYPES` + `isKnownGrantType`; alias `ContentClassDetailResponse`;
  6 contract-фикстур в `src/fixtures/contentModel.ts` (типизированы через `Omit` от app-типов);
  contract-doc (old→final mapping + screen status). `tsc -b` и `npm run build` зелёные.
- **Phase 3** ✅ reference API уже бьёт в финальные endpoints (`/reference/classes`,
  `/campaigns/{id}/reference/classes`) + `normalizeClassDetail`. Собран dev-only viewer
  `src/pages/dev/ContentClassViewerPage.tsx` (скрытый роут `/dev/content-classes`):
  список классов, переключатель Live API / Fixtures, механики (multi-primary, спасброски-бейджи,
  раздельные armor/weapon/tool, заклинательство, выбор навыков), timeline умений по уровням,
  reward groups по уровням через переиспользуемый `RewardGroupRenderer` (typed grants + unknown→custom).
  Selection — локальный preview, без persistence (Phase 7). `tsc`/`build`/`eslint` зелёные.
- **Phase 4** ✅ выделены именованные визуальные компоненты в `src/components/content-rewards/`:
  `RewardGrantLine`, `RewardOptionCard`, `RewardGroupView` (+ alias `RewardGroupRenderer` для legacy-импортов,
  убирается в Phase 11–12), `FeatureTimeline`; helper-модуль `grants.ts` (`grantKind`, `isUnknownGrantKind`).
  Unknown grant type теперь явно помечается бейджем и не роняет рендер. Viewer расширен панелью
  «Полнота данных» (счётчики умений/групп, уровни с наградами, неизвестные grant'ы, пустые группы)
  и маркерами reward/unknown на `FeatureTimeline`. Persistence не трогали. `tsc`/`build`/`eslint` зелёные.
- **Phase 5** ✅ character creation read-flow. Визард уже читает финальный class `detail`
  (multi-primary, спасброски, раздельные armor/weapon/tool, spellcasting, level-1 reward groups
  через `RewardGroupView`). Доделано: (1) `rewardSelection.ts` — модель/валидация выбора наград
  (`rewardSelectionsComplete`, `unsatisfiedRewardCount`, `isOptionSelectable`) с подключением в
  gating class-step (`validateCampaignReferences` + `campaignReferenceHint` + ключ `wiz.hint.chooseRewards`);
  (2) skill-step переведён на финальные `skillOptions` + `skillChoiceAny` (fallback на legacy только
  при отсутствии detail). Старый local-path оставлен как safety net (удаление — Phase 11–12, exit Phase 5
  допускает доступность старого creation). Добавлен тест-раннер **Vitest** (`vitest.config.ts`,
  scripts `test`/`test:watch`) и fixture-тесты `src/__tests__/contentModel.test.ts` (9 шт.):
  class detail mechanics, choose-two-skills, choose-one-subclass валидация, custom/unknown grant,
  KNOWN_GRANT_TYPES. **Осталось на потом:** child-выборы skill/ability/spell внутри гранта
  (commit-концерн, Phase 6–7). `tsc`/`build`/`eslint`/`vitest` зелёные (9/9).
- **Phase 6** ✅ final level-up read model. `LevelUpWizardPage` уже потребляет финальный
  options-эндпоинт (`useLevelUpOptions` + `normalizeLevelUpOptions`), имеет секции pick-class /
  HP gain / automatic rewards / choice rewards / review, и **локальная валидация гейтит переход**
  к confirm (`!choicesValid || !asiValid || !contentValid`). Content-группы теперь рендерятся тем же
  `RewardGroupView`, что и в creation (буквальный паритет). Legacy-ceremony путь (Oath/Choice/Asi)
  остаётся для old-shaped payload'ов до Phase 7, где появятся child-пикеры (ASI-аллокатор, skill/spell)
  вместе с `ContentLevelUpRequest`-коммитом и удалением legacy submit. `tsc`/`build`/`eslint`/`vitest` зелёные.
- **Phase 7** ✅ level-up commit & persistence (полный cutover на content). `levelup.api.ts`/`useLevelUp`
  принимают `ContentLevelUpRequest`. Новый чистый модуль `contentLevelUp.ts` — child-модель
  (`GrantChildSelection`/`ChildSelections`), `buildContentLevelUpRequest`, валидация
  (`contentLevelUpComplete`/`groupComplete`/`grantChildSatisfied`) + 9 тестов. Компонент
  `RewardGroupPicker` — выбор опций (через `RewardGroupView`) + child-пикеры: ASI-аллокатор
  (распределение очков, maxPerAbility) и skill-мультивыбор (chooseCount). SPELL-гранты остаются
  ручными (нет списка кандидатов на клиенте). `StepRewards` рендерит content-группы через picker,
  Next гейтится `contentLevelUpComplete`; `StepConfirm` сводит content-выбор; `onConfirm` шлёт
  `ContentLevelUpRequest`. **Legacy submit-путь удалён** (`buildSelections`/`buildAsi`/legacy
  `LevelUpRequest`). Legacy ceremony-рендер (Oath/Choice/Asi) для old-shaped payload'ов снимается
  в Phase 11–12. `tsc`/`build`/`eslint`/`vitest` зелёные (18/18).
- **Phase 8** 🚧 homebrew authoring. Удалён **сырой JSON-импорт** из `AdminClassRichWizard` и
  `homebrew/RichClassWizard` (file-upload + `JSON.parse` + `validateImportPayload` + import-хук/кнопка) —
  правило 6 «никакого ввода сырого JSON». **БЛОКЕР для основного объёма фазы:** табовый builder
  с новыми grant-типами (FEATURE/ABILITY_SCORE/NUMERIC_MODIFIER/CUSTOM_TEXT/SPELL/SKILL_PROFICIENCY,
  choose-one/choose-N) требует **authoring-контракта бэкенда для новой content-модели**, которого нет
  ни в промпте, ни в типах (`CreateRichCharacterClassRequest` моделирует только legacy
  SKILL/FEAT/SUBCLASS/BUFF_DEBUFF). До получения контракта строить нечего. `tsc`/`build`/`eslint`/`vitest` зелёные.
- **Phase 8 (cont.)** ✅ authoring-контракт получен → построен новый табовый **ClassBuilder**
  (`src/features/class-builder/`): типы `ClassWriteRequest`-графа + `classAuthoring.api` (aggregate
  upsert, admin/homebrew scope, If-Match); `classDraft.ts` (модель/билдер/валидация) + 11 тестов;
  `ClassBuilderModal` с табами identity/mechanics/proficiency/features+subclasses/**rewards**/review;
  rewards-builder поддерживает AUTO/CHOICE-группы, опции (add/remove, recommended, optionKey) и
  **все 8 grant-типов** с типовыми контролами (dropdown'ы из reference, free-text для custom/modifierKey,
  multiselect-чипы), validation-бейджи по пути, **preview через `RewardGroupView`** (как видят игроки);
  `classDetailToDraft` для редактирования. Смонтирован для **admin** (`AdminClassBuilder` в
  `CharacterClassesPage`), **legacy `AdminClassRichWizard` удалён**. Осталось (follow-up): смонтировать
  builder для **homebrew** scope и убрать `homebrew/RichClassWizard`. `tsc`/`build`/`eslint`/`vitest` зелёные (29/29).
