# Plan: Multiclass Level-Up System + Ordo Arcanum Design Migration

## Параметры
- **CSS**: Полная замена Tailwind + Shadcn → Ordo Arcanum CSS + React-компоненты
- **API**: Реальная интеграция (бэкенд готов)
- **Mobile**: Адаптивная вёрстка для всех экранов сразу

---

## Фаза 0 — Подготовка инфраструктуры

### 0.1 Удаление Tailwind и Shadcn
- Удалить `tailwindcss`, `tailwindcss-animate`, `autoprefixer`, `postcss` из devDependencies
- Удалить `class-variance-authority`, `tailwind-merge`, `clsx` из dependencies
- Удалить все `@radix-ui/*` пакеты (заменим своими компонентами)
- Удалить `lucide-react` (заменим Rune-компонентом из дизайн-системы)
- Удалить `tailwind.config.ts`, `postcss.config.js`
- Очистить `src/index.css` от `@tailwind` директив
- Удалить папку `src/components/ui/` целиком (shadcn-компоненты)
- Удалить `src/lib/utils.ts` (cn helper)

### 0.2 Установка шрифтов
- Добавить Google Fonts в `index.html`: Cinzel, Cormorant Garamond, Inter, JetBrains Mono

### 0.3 Создание Ordo Arcanum CSS
- Создать `src/styles/ordo-arcanum.css` — полная токен-система из viewer.html:
  - CSS-переменные (surfaces, borders, ink, accents, typography, spacing, shadows)
  - Base-стили (`.ao-root`, `.ao-grain`, `.ao-vignette`)
  - Типографика (`.ao-engraved`, `.ao-overline`, `.ao-codex`, `.ao-h1`–`.ao-h6`, `.ao-italic`, `.ao-num`)
  - Панели (`.ao-panel`, `.ao-panel--inset`, `.ao-panel--raised`, `.ao-frame`)
  - Кнопки (`.ao-btn`, `.ao-btn--primary`, `.ao-btn--danger`, `.ao-btn--ghost`, размеры)
  - Формы (`.ao-input`, `.ao-label`)
  - Табы, чипы, стат-блоки, бары, таблицы, слоты, sigil, tooltip, toast
  - Анимации (`ao-flicker`, `ao-breathe`, `ao-rise`, `ao-pageturn`)
  - Скроллбар (`.ao-scroll`)
  - Divider (`.ao-divide`)
  - Адаптивные media-queries для мобильной вёрстки
- Импортировать в `src/main.tsx`

---

## Фаза 1 — Библиотека компонентов Ordo Arcanum

### 1.1 Примитивы (`src/components/ao/`)
Перенести все React-компоненты из viewer.html как TSX-модули:

| Файл | Компонент(ы) | Описание |
|------|-------------|----------|
| `Rune.tsx` | `Rune` | SVG-иконки (30+ глифов) — заменяет lucide-react |
| `Divider.tsx` | `Divider` | Разделитель с центральным глифом |
| `Panel.tsx` | `Panel`, `PanelHeader` | Фреймированные панели с бронзовыми уголками |
| `StatBlock.tsx` | `StatBlock` | Блок способности (STR, DEX, etc.) |
| `Bar.tsx` | `Bar` | Прогресс-бар (HP/XP/mana) с тонами |
| `Sigil.tsx` | `Sigil` | Декоративная печать |
| `Chip.tsx` | `Chip` | Тег/бейдж с тоном и глифом |
| `Tabs.tsx` | `Tabs` | Таб-навигация |
| `CodexID.tsx` | `CodexID` | Codex номер (моноширинный ID) |
| `Backdrop.tsx` | `Backdrop` | Фон с grain/vignette |
| `AppShell.tsx` | `AppShell`, `Rail`, `TopBar` | Основной layout (left rail + top bar) |
| `Button.tsx` | `Button` | Обёртка над `.ao-btn` с пропсами variant/size |
| `Input.tsx` | `Input`, `Label`, `Textarea`, `Select` | Форм-элементы в стиле AO |
| `Table.tsx` | `Table` | Таблица `.ao-table` |
| `Toast.tsx` | `Toast` | Уведомления `.ao-toast` |
| `Dialog.tsx` | `Dialog`, `AlertDialog` | Модальные окна в стиле AO (без Radix) |
| `Placeholder.tsx` | `Placeholder` | Заглушка для изображений |
| `Slot.tsx` | `Slot` | Инвентарный слот |

### 1.2 Утилиты
- `src/lib/ao-utils.ts` — хелперы: classnames-joining, модификатор-калькулятор, форматирование дат в стиле архива

---

## Фаза 2 — Новые типы и API-слой для Level-Up системы

### 2.1 Расширение типов (`src/types/index.ts`)
Добавить новые интерфейсы:

```typescript
// Мультикласс
interface CharacterClassEntry {
  id: string;
  characterClass: { id: string; name: string };
  classLevel: number;
  subclass?: { id: string; name: string; description: string } | null;
}

// Расширенный Character
interface CharacterDetailed extends Character {
  totalLevel: number;
  experience: number;
  experienceThreshold: number;
  classEntries: CharacterClassEntry[];
  canLevelUp: boolean;
}

// Награды
type RewardType = string; // динамически: 'SKILL' | 'SUBCLASS' | 'FEAT' | ...

interface Reward {
  id: string;
  name: string;
  description: string;
  rewardType: RewardType;
}

interface ClassLevelReward {
  id: string;
  classId: string;
  level: number;
  reward: Reward;
  rewardType: RewardType;
  isChoice: boolean;
}

interface AcquiredReward {
  id: string;
  reward: Reward;
  rewardType: RewardType;
  classEntry: { className: string; classLevel: number };
  acquiredAt: string;
}

// Level-up flow
interface LevelUpPreview {
  currentTotalLevel: number;
  newTotalLevel: number;
  availableClasses: LevelUpClassOption[];
}

interface LevelUpClassOption {
  classId: string;
  className: string;
  currentClassLevel: number;
  newClassLevel: number;
  rewardGroups: RewardGroup[];
  isNewClass: boolean;
}

interface RewardGroup {
  rewardType: RewardType;
  isChoice: boolean;
  rewards: Reward[];
}

interface LevelUpRequest {
  classId: string;
  selectedRewardIds: string[];
}

// Admin entities
interface Feat {
  id: string;
  name: string;
  description: string;
  prerequisites: string;
}

interface Subclass {
  id: string;
  name: string;
  description: string;
  parentClass: { id: string; name: string };
}

interface Skill {
  id: string;
  name: string;
  description: string;
  skillType: string;
}
```

### 2.2 API-сервис (`src/api/levelup.api.ts`)
```
GET  /characters/:id/level-up/preview     → LevelUpPreview
POST /characters/:id/level-up             → body: LevelUpRequest
GET  /characters/:id/rewards              → AcquiredReward[]
```

### 2.3 API-сервис (`src/api/admin.api.ts` — расширение)
```
// Feats
GET    /admin/feats
POST   /admin/feats
PUT    /admin/feats/:id
DELETE /admin/feats/:id

// Subclasses
GET    /admin/subclasses
POST   /admin/subclasses
PUT    /admin/subclasses/:id
DELETE /admin/subclasses/:id

// Skills
GET    /admin/skills
POST   /admin/skills
PUT    /admin/skills/:id
DELETE /admin/skills/:id

// Class Level Rewards
GET    /admin/class-level-rewards?classId=X
POST   /admin/class-level-rewards
DELETE /admin/class-level-rewards/:id
```

### 2.4 React Query хуки
- `src/hooks/useLevelUp.ts` — хуки для preview, commit, rewards history
- Расширить `src/hooks/useAdmin.ts` — хуки для feats, subclasses, skills, class-level-rewards

---

## Фаза 3 — Миграция Layout

### 3.1 AppLayout → AppShell
- Переписать `src/components/layout/AppLayout.tsx` на `AppShell` + `Rail` + `TopBar`
- Rail: иконочная навигация (68px шириной) с Rune-глифами, Sigil вверху
- TopBar: 60px высотой, заголовок + breadcrumb + правые кнопки
- Контент-область: `.ao-scroll` с padding
- Мобильная версия: Rail скрыт, появляется bottom nav (5 кнопок)

### 3.2 Sidebar → Rail
- Заменить текстовую навигацию на иконочную Rail
- Role-based навигация через глифы:
  - Player: shield (Roster), sigil-3 (Sheet), sword (Arsenal), helm (Conclave)
  - GM: shield (Teams), sigil-3 (Sheet view), scroll (Bestiary)
  - Admin: book (Archive), shield (Teams), scroll (Users), plus все admin-разделы

### 3.3 Header → TopBar
- Перенести username, role badge, logout в TopBar
- Добавить breadcrumb

---

## Фаза 4 — Миграция существующих экранов

### 4.1 Auth: Login + Register
- `LoginPage.tsx` → разделённый экран по образцу LoginScreen из viewer.html
  - Левая панель: атмосферная с Sigil, заголовком, статистикой
  - Правая панель: форма входа в Panel с frame
  - Мобильная: только правая панель, компактная
- `RegisterPage.tsx` → аналогичный стиль, выбор роли через стилизованные карточки

### 4.2 Character Roster (CharactersListPage)
- Переписать на RosterScreen из viewer.html
- Карточки персонажей: Panel + frame + portrait placeholder + bars + CodexID
- Фильтры по статусу/партии (если есть данные)
- Мобильная: одноколоночный список

### 4.3 Character Sheet (CharacterDetailPage)
- **Полная переработка** под CharacterSheetScreen из viewer.html:
  - Identity panel: портрет, имя, все классы с уровнями (мультикласс), раса, background
  - Level/XP/HP rail с Bar-компонентами
  - Ability scores: 6 StatBlock-компонентов
  - Combat stats: AC, Initiative, Speed, Proficiency
  - Tabs: Combat/Attacks, Spells, Class Features, Skills, Biography
  - **Level-Up banner**: если `canLevelUp === true`, показать яркий баннер/кнопку "Begin Ascent"
  - **Acquired Rewards tab**: новая вкладка — история наград по классам и типам
- Мобильная: стековая раскладка (MobileSheet из viewer.html)

### 4.4 Character Create/Edit
- Переписать формы на AO-стиль (ao-input, ao-label, ao-btn, Panel)
- Добавить поддержку мультикласса при редактировании

### 4.5 Arsenal / Inventory (пока часть CharacterDetail, но выносим)
- Переписать EquipmentGrid + EquipmentSlotModal в стиле ArsenalScreen
- Paper-doll layout для equipped items
- Bag grid с цветовой индикацией rarity
- Detail panel справа для выбранного предмета
- Мобильная: вертикальный стек

### 4.6 Team / Conclave
- `MyTeamsPage`, `JoinTeamPage` → стиль TeamScreen
- `GmTeamsListPage`, `GmTeamCreatePage`, `GmTeamDetailPage` → стиль Conclave
- Banner с общей HP партии, золотом, таймером
- Member list с аватарами, HP-барами, статусами
- Timeline/Day-Ledger (если есть данные)
- Мобильная: вертикальный стек

### 4.7 Admin / Archive
- `AdminDashboardPage` → стиль AdminScreen
  - Left sidebar: список Reference Tomes (таблиц) с активным индикатором
  - Right: таблица данных `.ao-table` с пагинацией
  - Обновить DashboardCard на AO-стиль
- Все CRUD-страницы: StatTypes, ItemTypes, Classes, Races → `.ao-table` + Panel

---

## Фаза 5 — Level-Up Flow (новый функционал)

### 5.1 Level-Up Gate (Step 1)
- Компонент `LevelUpBanner.tsx` на character sheet — показывается при `canLevelUp`
- При нажатии → навигация на `/characters/:id/level-up`
- Страница `LevelUpPage.tsx` — модальный/fullscreen wizard

### 5.2 LevelUpCeremony Modal (Step 1 content)
- По образцу LevelUpModal из viewer.html
- Показывает: текущий уровень → новый, Sigil, "Rite of Ascent"
- Grants summary: HP, spell slot, ability score (из preview API)
- Checklist шагов: выбор класса, выбор наград, подтверждение
- Кнопки: "Postpone" и "Proceed to Rite"

### 5.3 Class Selection (Step 2 — если мультикласс)
- Список доступных классов (из `LevelUpPreview.availableClasses`)
- Для каждого: текущий class level → new, preview наград
- Кнопка "Add New Class" — выбор из незанятых классов
- По образцу SubclassScreen (карточки в 3 колонки)
- Если один класс и нет мультикласса — пропуск

### 5.4 Reward Selection (Step 3)
- По образцу RewardSelectionScreen из viewer.html
- Группы наград по `rewardType`
- `isChoice = false`: отображение "Granted automatically" (не интерактивное)
- `isChoice = true`: карточки с выбором (клик для выделения)
- Subclass rules: если уже есть — не показывать группу SUBCLASS
- Feat rules: показывать только когда данные содержат FEAT-группу
- Already acquired: серый, неактивный
- Валидация: все обязательные выборы сделаны

### 5.5 Confirmation Summary
- Итоговая панель: класс, новый class level, новый total level
- Список всех наград (automatic + chosen)
- Кнопки: "Back" (сохраняет выборы), "Seal" (POST запрос)
- Блокировка кнопки после клика (защита от дубликатов)

### 5.6 Celebration Screen
- После успешного POST: анимированный экран с результатами
- ao-breathe на новом уровне, ao-flicker на тексте
- Кнопка "Return to Folio" → обратно на character sheet

### 5.7 Error States
- Stale data: сообщение + redirect
- Invalid reward: сообщение + refresh
- Double submit: disabled button

---

## Фаза 6 — Reward History View

- Новый таб "Acquired Rites" на character sheet
- GET `/characters/:id/rewards`
- Группировка: по классу → по reward type
- Каждая награда: имя, описание, дата, тип (с Chip)
- Визуальное различие между типами (разные тоны Chip: gold для FEAT, arcane для SUBCLASS, ember для SKILL)

---

## Фаза 7 — Новые Admin экраны

### 7.1 Feats Admin (`/admin/feats`)
- CrudTable: name, description, prerequisites, status (Chip)
- CrudFormModal: name, description, prerequisites (text)

### 7.2 Subclasses Admin (`/admin/subclasses`)
- CrudTable: name, parent class, description
- CrudFormModal: name, parent class (select из существующих классов), description

### 7.3 Skills Admin (`/admin/skills`)
- CrudTable: name, description, skill type
- CrudFormModal: name, description, skill type (select)

### 7.4 Class Level Rewards Admin (`/admin/class-level-rewards`)
- Select класс → таблица наград по уровням (1–20)
- Каждая строка: level, reward type, reward name, isChoice badge
- Add reward: level select, reward type select, reward select (filtered), isChoice toggle
- Delete с подтверждением

### 7.5 Обновить AdminDashboard
- Добавить карточки: Feats, Subclasses, Skills
- Обновить Sidebar/Rail: добавить навигацию к новым страницам

---

## Фаза 8 — Роутинг

Добавить в `router.tsx`:
```
// Player
/characters/:id/level-up → LevelUpPage

// Admin
/admin/feats → FeatsPage
/admin/subclasses → SubclassesPage
/admin/skills → SkillsPage
/admin/class-level-rewards → ClassLevelRewardsPage
```

---

## Порядок выполнения

1. **Фаза 0** — Очистка: удаление Tailwind/Shadcn, подключение шрифтов
2. **Фаза 1** — Дизайн-система: CSS + React-компоненты AO
3. **Фаза 2** — Типы + API-слой для level-up
4. **Фаза 3** — Layout migration (AppShell, Rail, TopBar)
5. **Фаза 4.1** — Auth screens
6. **Фаза 4.2–4.3** — Roster + Character Sheet (с мультикласс-поддержкой)
7. **Фаза 4.4–4.7** — Остальные существующие экраны
8. **Фаза 5** — Level-Up Flow
9. **Фаза 6** — Reward History
10. **Фаза 7** — Новые Admin экраны
11. **Фаза 8** — Роутинг + финальная интеграция

---

## Файловая структура (итоговая)

```
src/
├── styles/
│   └── ordo-arcanum.css          # Вся CSS токен-система
├── components/
│   ├── ao/                        # Ordo Arcanum primitives (НОВОЕ)
│   │   ├── Rune.tsx
│   │   ├── Divider.tsx
│   │   ├── Panel.tsx
│   │   ├── StatBlock.tsx
│   │   ├── Bar.tsx
│   │   ├── Sigil.tsx
│   │   ├── Chip.tsx
│   │   ├── Tabs.tsx
│   │   ├── CodexID.tsx
│   │   ├── Backdrop.tsx
│   │   ├── AppShell.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Toast.tsx
│   │   ├── Dialog.tsx
│   │   ├── Placeholder.tsx
│   │   ├── Slot.tsx
│   │   └── index.ts              # barrel export
│   ├── layout/                    # ПЕРЕПИСАТЬ
│   │   ├── AppLayout.tsx          # → использует AppShell
│   │   ├── ProtectedRoute.tsx     # оставить логику, убрать tailwind
│   │   └── Header.tsx             # → TopBar wrapper
│   ├── characters/                # ПЕРЕПИСАТЬ в AO-стиль
│   ├── teams/                     # ПЕРЕПИСАТЬ в AO-стиль
│   ├── admin/                     # ПЕРЕПИСАТЬ в AO-стиль
│   └── levelup/                   # НОВОЕ
│       ├── LevelUpBanner.tsx
│       ├── LevelUpCeremony.tsx
│       ├── ClassSelection.tsx
│       ├── RewardSelection.tsx
│       ├── LevelUpConfirmation.tsx
│       ├── LevelUpCelebration.tsx
│       └── RewardHistory.tsx
├── api/
│   ├── levelup.api.ts             # НОВОЕ
│   └── admin.api.ts               # РАСШИРИТЬ
├── hooks/
│   ├── useLevelUp.ts              # НОВОЕ
│   └── useAdmin.ts                # РАСШИРИТЬ
├── pages/
│   ├── player/
│   │   └── LevelUpPage.tsx        # НОВОЕ
│   └── admin/
│       ├── FeatsPage.tsx           # НОВОЕ
│       ├── SubclassesPage.tsx      # НОВОЕ
│       ├── SkillsPage.tsx          # НОВОЕ
│       └── ClassLevelRewardsPage.tsx # НОВОЕ
└── types/index.ts                 # РАСШИРИТЬ
```

## Оценка объёма

- **Новые файлы**: ~35
- **Переписываемые файлы**: ~45
- **Удаляемые файлы**: ~15 (shadcn/ui, tailwind config)
- **Итого затронутые файлы**: ~95
