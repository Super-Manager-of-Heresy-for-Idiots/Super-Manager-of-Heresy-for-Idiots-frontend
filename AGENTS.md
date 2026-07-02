# AGENTS.md

## Workspace context

This repository is the React/Vite frontend for the existing D&D application.
Before broad code navigation, read the workspace memory files:

1. `../AGENTS.md`
2. `../PROJECT_MAP.md`
3. `../docs/architecture.md`
4. `../docs/known-issues.md`
5. `../docs/tooling-serena.md`

Route UI, screen, button, layout, route, component, frontend API client, client state, and styles tasks here.
Route backend domain/API/persistence tasks to `../SuperManagerofHeresyforIdiots`, map-service server tasks to `../SuperManagerofHeresyforIdiots-map`, and Kubernetes/deployment tasks to `../dnd-gitops`.

Use Serena for semantic code work: locating routes/components/hooks/API clients/types, finding references, tracing route -> component -> API client -> backend endpoint, and refactors. Use normal shell/file search first for markdown, package/build config, Docker/Kubernetes yaml, and simple string search.

Key frontend paths:

- Routing: `src/router.tsx`.
- Core API clients: `src/api`.
- Core WebSocket client: `src/lib/websocket.ts`.
- Shared state: `src/store`.
- Shared types: `src/types/index.ts`.
- Map frontend feature: `src/features/map`; keep its HTTP client separate from core `src/api/axios.ts`.
- Dev proxy: `src/lib/devProxy.ts`; map-service routes and `/ws/map` must precede generic `/api` and `/ws`.

> ⚠️ **ОБЯЗАТЕЛЬНО К ПРОЧТЕНИЮ ДЛЯ ЛЮБОГО ИИ-АГЕНТА (Codex / Claude Code / др.)**
> Полная инструкция проекта — в **`CLAUDE.md`** (корень репозитория). Этот файл —
> её зеркало с ключевыми правилами. Перед правкой UI-кода прочитай раздел ниже.

## Конвенция по стилям (CSS) — ОБЯЗАТЕЛЬНО

Проект уходит от inline-стилей. **Не добавляй новые `style={{…}}`** для статичных стилей.

1. **Токены** — CSS-переменные в `src/index.css` (`--gold`, `--abyss`, `--font-display`, `--s-4`…).
   Не хардкодь цвета/отступы, используй токены.
2. **Общие примитивы** — классы `.ao-*` / `.wiz-*` / `.forge-*` / `.cb-*` в `src/index.css`.
   Сначала ищи готовый класс.
3. **Частное** — CSS Modules: `Имя.module.css` рядом с компонентом, `import s from './Имя.module.css'`.
4. **Inline допустим только для вычисляемых значений** (ширина `${pct}%`, динамический
   `gridTemplateColumns`, координаты). Прочее — в классы. «Динамика из токенов» → CSS-переменная + класс.
5. **Состояния — модификаторами классов** (`cn('block', active && 'is-active')`), не тернарники в `style`.
6. **Ховер/фокус — только в CSS** (`:hover`/`:focus`). Запрещён ховер через
   `onMouseEnter/onMouseLeave` + мутацию `e.currentTarget.style`.
7. **Tailwind-утилиты массово не вводим** — доращиваем собственную `.ao-*` систему.
8. **Утилиты раскладки** для частых статичных flex-блоков (вместо inline-flex), композируются
   через пробел `className="ao-row ao-between ao-gap-12"`: `.ao-row` (+`-start/-end/-baseline`),
   `.ao-col`, `.ao-center`, `.ao-between`, `.ao-justify-end/-center`, `.ao-wrap`, `.ao-grow`,
   `.ao-gap-N` (N ∈ 2,4,6,8,10,12,14,16,18,24). Реальную динамику оставляй inline.

Активный рефакторинг и прогресс — в **`INLINE_CSS_REFACTOR_PLAN.md`**. Сверяйся с ним,
не ломай уже вынесенные стили.

## Команды
- `npm run dev` — dev-сервер (Vite)
- `npm run build` — сборка
- `npm run lint` — линт
- `npx tsc -b --force` — тайпчек (обычный `tsc --noEmit` тут молча ничего не проверяет).

## Прочее
Стек и архитектуру UI см. в `CLAUDE.md`. iframe / «окно в окне» для разделения UI не предлагать —
эффект уже даёт persistent-shell + nested routes (`AppLayout` + `<Outlet/>`).
