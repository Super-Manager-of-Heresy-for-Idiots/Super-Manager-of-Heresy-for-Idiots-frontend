# New Content UI Migration Plan

## Current Frontend Touchpoints

- Character creation:
  - `src/features/character-wizard/CharacterCreationWizard.tsx`
  - `src/features/character-wizard/steps.tsx`
  - `src/features/character-wizard/parts.tsx`
  - `src/pages/gm/campaigns/CharacterCreationWizardPage.tsx`
  - `src/pages/player/TemplateWizardPage.tsx`
- Level-up:
  - `src/pages/gm/campaigns/LevelUpWizardPage.tsx`
  - `src/hooks/useLevelUp.ts`
  - `src/api/levelup.api.ts`
- Class/homebrew authoring:
  - `src/components/homebrew/RichClassWizard.tsx`
  - `src/components/admin/AdminClassRichWizard.tsx`
  - `src/pages/admin/CharacterClassesPage.tsx`
  - `src/pages/admin/LevelRewardsPage.tsx`
- Shared contract types:
  - `src/types/index.ts`
  - `src/api/reference.api.ts`
  - `src/api/homebrew-campaign.api.ts`

Bestiary, combat, inventory, wallet, quest rewards, campaign membership, and the existing read-only character sheet should stay out of the first migration slice.

## Safe Slice Already Started

- Added optional new-content fields to existing class/reward DTOs.
- Added `src/lib/contentAdapters.ts`.
- Normalized class details in reference API clients.
- Normalized level-up options in `useLevelUpOptions`.
- Changed level-up local selection state to use `groupKey` instead of raw `rewardType`.

This keeps legacy backend payloads working while preparing the UI for reward groups with stable IDs.

## Character Creation Changes Needed

The class step must stop being a simple class picker.

Required UI sections:

- class identity: name, subtitle/source, homebrew badge
- hit die
- primary abilities
- saving throws
- skill choice rule: choose N, any skill, available options
- armor proficiency text
- weapon proficiency text
- tool proficiency text
- spellcasting profile
- level 1 automatic grants
- level 1 required choices

Implementation order:

1. Extend `WizardAvailability.classOptions` to expose normalized `detail.rewardGroups`.
2. Render class mechanics in `StepClass` without changing submit payload.
3. Add a read-only level 1 grants preview.
4. Add a reward group selector only after backend accepts new character creation reward selections.
5. Persist pending selections in `wizardState`.

Do not rewrite race/background/stat/spell steps in the same slice.

## Level-Up Changes Needed

`LevelUpWizardPage.tsx` is currently built around legacy groups:

- one group key is `rewardType`
- choice is one `rewardEntryId`
- ASI is hard-coded as a separate block

Target behavior:

- render by reward group first, grant type second
- support `chooseMin` / `chooseMax`
- support group IDs through `groupKey`
- render direct grants separately from option grants
- support custom/unknown grants as user-facing manual entries
- keep legacy request building until backend exposes the new request

Renderer rules:

- no options and no choice count: automatic group
- `chooseMin = 1`, `chooseMax = 1`: radio group
- `chooseMin = chooseMax > 1`: exact-count checkbox group
- `chooseMin < chooseMax`: min/max checkbox group
- unknown/custom grants: generic panel with optional note

ASI should become a generic ability grant renderer:

- fixed +1
- choose one +1
- choose one +2
- choose two +1/+1
- homebrew total bonus
- max score cap
- max per ability

## Homebrew Class Authoring Changes Needed

`RichClassWizard.tsx` is still tied to the old flat rich class model.

Replace the single flat reward editor with a multi-step class editor:

1. Identity
   - slug
   - RU/EN names
   - subtitle/source
2. Mechanics
   - hit die
   - primary abilities
   - saving throws
   - skill choice count
   - any skill toggle
   - skill option multiselect
   - armor/weapon/tool textareas
   - spellcasting fields
3. Features
   - class/subclass scope
   - level
   - title
   - description
4. Reward groups
   - class level
   - prompt
   - choose min/max
   - repeatable
   - direct grants
   - options
5. Typed grants
   - feature
   - subclass
   - feat
   - spell
   - skill proficiency
   - ability score
   - numeric modifier
   - custom text
6. Review
   - preview exactly what creation and level-up screens will show

Every typed grant editor should include a custom/manual fallback so homebrew remains flexible.

## Rollout Order

1. Keep legacy screens operational.
2. Land adapters and optional DTO fields.
3. Render new class mechanics read-only.
4. Add reward group renderer behind payload detection.
5. Use reward group renderer in level-up.
6. Use the same renderer for level 1 character creation choices.
7. Replace rich class authoring with the new multi-step model.
8. Remove legacy flat reward UI after backend no longer returns old `class_level_rewards`.

## Verification

- `npm run build`
- create character with old payload
- open level-up with old payload
- select subclass reward
- select non-subclass reward
- allocate ASI
- verify no regressions in bestiary routes
