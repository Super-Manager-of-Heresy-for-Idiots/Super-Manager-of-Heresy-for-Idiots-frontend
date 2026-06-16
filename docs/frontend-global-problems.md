# Frontend Global Problems

This file tracks systemic frontend problems that should be planned as separate work.
Small local lint issues have been fixed separately.

## 1. New DnD Content Model Is Only Partially Integrated

Status: high priority.

The backend is moving from old flat/plural content tables to the new normalized content schema.
The frontend has adapter/type preparation, but the main user flows are still legacy-first.

Affected areas:

- `src/features/character-wizard/*`
- `src/pages/gm/campaigns/LevelUpWizardPage.tsx`
- `src/components/homebrew/RichClassWizard.tsx`
- `src/components/admin/AdminClassRichWizard.tsx`
- `src/pages/admin/LevelRewardsPage.tsx`

Problems:

- character creation does not render level 1 reward groups/options
- level-up still renders legacy `rewardType -> RewardEntry[]`
- ASI is still a hard-coded special block instead of a generic ability grant renderer
- homebrew class authoring still creates old rich class rewards
- class features are typed, but not first-class UI entities yet
- separate armor/weapon/tool proficiency text fields are typed, but not fully surfaced

Related docs:

- `docs/new-content-ui-migration-plan.md`
- `docs/new-content-entity-frontend-audit.md`

## 2. Fast Refresh Warnings Reveal Mixed Component/Helper Modules

Status: medium priority.

ESLint now reports `react-refresh/only-export-components` as warnings. These files export React components and non-component helpers/constants from the same module:

- `src/components/admin/RaceEditor.tsx`
- `src/components/characters/WalletKit.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/features/character-wizard/parts.tsx`
- `src/i18n/I18nContext.tsx`
- `src/pages/gm/campaigns/NpcFormFields.tsx`

Do not fix this by suppressing every file inline.
The clean fix is to split reusable helpers/constants into sibling files such as `*.helpers.ts`, `*.constants.ts`, or `*.types.ts`.

Current project compromise:

- rule is configured as `warn`, not `error`
- lint can pass
- warnings remain visible

## 3. Hook Dependency Warnings Need Intentional Review

Status: medium priority.

Current warnings:

- `src/components/homebrew/RichClassWizard.tsx`
  - `useMemo` missing dependency: `getExistingById`
- `src/pages/gm/blueprints/BlueprintEditorPage.tsx`
  - `useEffect` missing dependency: `bp`
- `src/pages/gm/campaigns/CampaignBestiaryPage.tsx`
  - `systemRows` logical expression changes dependencies
- `src/pages/gm/campaigns/InventoryPage.tsx`
  - `items`, `equippedItems`, `backpackItems`, `grantTemplates` logical expressions change dependencies

These should not be bulk-fixed mechanically.
Each needs a quick behavior check because adding a dependency can trigger extra fetch/reset cycles.

## 4. Error States Are Inconsistent Across Pages

Status: medium priority.

Existing review already notes that many pages handle loading/empty states but not real request failures.

Problem pattern:

- request fails
- `data` is absent
- UI renders an empty state instead of an error/retry state

Recommended direction:

- add a shared `ErrorAltar` / `ErrorState` primitive matching `EmptyVault`
- migrate page groups gradually
- start with non-critical campaign/list pages

Do not touch bestiary/combat in the same pass unless specifically testing those routes.

## 5. Inline CSS Refactor Is Not Finished

Status: medium priority.

The repo is actively moving away from static `style={{ ... }}`.
The remaining work is tracked in `INLINE_CSS_REFACTOR_PLAN.md`.

Important constraints:

- no new static inline styles
- use `.ao-*`, `.wiz-*`, `.forge-*`, `.cb-*` primitives first
- use CSS modules for page/component-specific styles
- inline style is acceptable only for genuinely dynamic values or CSS variables

## 6. Admin/Homebrew Class Tools Are Still Legacy-Shaped

Status: high priority after backend endpoints are ready.

Current tools are organized around old entities:

- class
- subclass
- skill
- feat
- flat level reward

The new model needs:

- class mechanics
- class features
- reward groups
- reward options
- typed grants
- manual/custom grants

This is too large for a small cleanup. It should be a dedicated vertical slice after backend DTOs/endpoints stabilize.

## 7. Reference API Coupling Is Too Direct

Status: medium priority.

Some screens still depend directly on backend response shape instead of a frontend view model.

Already started:

- `src/lib/contentAdapters.ts`
- normalized reference classes in API clients
- normalized level-up options in hook

Needed next:

- move character wizard to `ClassCreationViewModel`
- move level-up page to `LevelUpViewModel`
- keep backend DTOs at API boundaries only

## 8. Large Bundle Warning

Status: low priority.

`npm run build` reports a large JS chunk:

- current built JS chunk is around 1.9 MB minified
- Vite suggests dynamic imports/manual chunks

This is not currently breaking functionality, but route-level lazy loading should be planned once feature migration slows down.

Candidate split points:

- bestiary
- combat preview
- homebrew marketplace/editor
- admin
- campaign management

## 9. Lint Config Was Broken

Status: fixed for loading, warnings remain.

The ESLint config referenced plugin config shapes that do not exist in the installed versions:

- `reactHooks.configs.flat.recommended`
- the previous react-refresh setup failed before linting files

Fixed:

- config now loads
- `npm run lint` exits successfully
- remaining issues are warnings, not errors

## 10. Frontend Lacks Product Surface for Many New Content Tables

Status: intentional gap, pending product decisions.

No frontend surface exists for:

- new equipment catalog
- new species model
- magic item catalog
- random tables
- spell scroll crafting
- import warning review
- structured feat/background/spell child entities

See `docs/new-content-entity-frontend-audit.md` for the full table-level list.
