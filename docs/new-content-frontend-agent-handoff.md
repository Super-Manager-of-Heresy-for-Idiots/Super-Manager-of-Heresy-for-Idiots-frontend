# Handoff: New DnD Content Schema and Frontend Impact

Audience: frontend AI agent.

Goal: do not miss any new backend/content entities when migrating the frontend from the old flat content model to the new normalized model.

## Current Situation

Backend is migrating away from old toy/flat content tables:

- old class catalog: `character_classes`
- old subclasses: `subclasses`
- old proficiency skills: `proficiency_skills`
- old active skills/class features: `skills`
- old flat level rewards: `class_level_rewards`
- old acquired rewards: `character_acquired_rewards`

New content tables are singular and normalized:

- `character_class`
- `subclass`
- `class_feature`
- `skill`
- `background`
- `spell`
- `feat`
- `ability_score`
- `currency`
- many dependent tables for mechanics, choices, equipment, species, magic items, etc.

Important backend rule:

- no JSONB for new content
- repeated/multi-value mechanics are dependent tables
- weapon/armor/tool proficiencies are intentionally text fields, not dictionary references
- homebrew must remain flexible; unknown/custom grants must be representable
- bestiary is out of scope; do not migrate bestiary flows as part of this work

## Frontend Prep Already Done

These files were added/changed to prepare the frontend safely:

- `src/types/index.ts`
  - added optional fields for new class mechanics
  - added `ContentLevelUpRequest`
  - added `ContentRewardSelection`
  - added `ContentRewardGrant`
  - added `ContentRewardOption`
  - added `ContentLabel`
  - added `ClassFeatureSummary`
  - extended `RewardGroup`
  - extended `CharacterClassDetailResponse`
- `src/lib/contentAdapters.ts`
  - normalizes class details
  - normalizes level-up options
  - provides stable `rewardGroupKey()`
- `src/api/reference.api.ts`
  - normalizes global reference classes
- `src/api/homebrew-campaign.api.ts`
  - normalizes campaign reference classes
- `src/hooks/useLevelUp.ts`
  - normalizes level-up options
- `src/pages/gm/campaigns/LevelUpWizardPage.tsx`
  - local selections now use `groupKey`, not raw `rewardType`
- `src/features/character-wizard/CharacterCreationWizard.tsx`
  - class detail normalization before availability build

These changes are adapter-level and should preserve legacy behavior.

Related docs:

- `docs/new-content-ui-migration-plan.md`
- `docs/new-content-entity-frontend-audit.md`
- `docs/frontend-global-problems.md`

## Backend Migration 054: Core Content Schema

This migration added the normalized content foundation.

### Source and Package Metadata

#### `source_book`

Purpose:

- source metadata for official books/sources

Frontend impact:

- currently frontend only displays a flat `source` string in `AvailableContentEntry`
- no source-book browser/editor exists
- when backend exposes structured source data, UI should show source badge, not require source editing in every form

Status:

- aggregate-only

#### `mod_package`

Purpose:

- content package/source grouping
- related to homebrew/imported content, but not necessarily the same API as existing homebrew package screens

Frontend impact:

- current UI has homebrew package/doctrine screens
- current content lists show `homebrewTitle`
- if backend exposes `mod_package`, map it to package/source badges
- do not confuse with marketplace package lifecycle unless backend explicitly connects them

Status:

- aggregate-only

### Money and Currency

#### `currency`

Purpose:

- normalized currency dictionary

Frontend impact:

- used in wallet
- used in quest rewards
- used in character creation starting coins
- used in reference currencies
- frontend should keep using `currencyTypeId`/`currencyName` style contracts unless backend renames them to `currencyId`

Status:

- used

#### `money_value`

Purpose:

- structured prices/costs attached to content

Frontend impact:

- no direct UI currently
- future equipment/magic item screens should render price as currency rows, not a free text field

Status:

- not used

### Ability Scores and Skills

#### `ability_score`

Purpose:

- normalized STR/DEX/CON/INT/WIS/CHA dictionary

Frontend impact:

- maps to current `StatTypeResponse`
- used in character stats
- used in ASI
- used in class primary abilities
- used in class saving throws
- used in skill governing ability
- UI should eventually stop naming this "stat type" in new content screens and call it ability score where user-facing

Status:

- used

#### `skill`

Purpose:

- normalized proficiency skills like Acrobatics, Arcana, Perception

Frontend impact:

- maps to `ProficiencySkillResponse` / reference skills
- class skill choices must use this table
- background skill proficiencies must use this table
- reward skill grants must use this table

Important naming conflict:

- old frontend/admin `SkillResponse` can also mean old active class abilities / powers
- do not mix old active `skills` with new proficiency `skill`
- for new content UI, use "proficiency skill" or `ContentSkill`

Status:

- used, but naming needs cleanup

### Damage and Dice

#### `damage_type`

Purpose:

- normalized damage type dictionary

Frontend impact:

- current UI often uses damage type strings
- item templates, skills, effects and monster data use damage type labels/enums
- no new damage-type dictionary UI exists
- if backend sends IDs later, add a dictionary picker

Status:

- aggregate-only

#### `dice_formula`

Purpose:

- reusable dice expressions

Frontend impact:

- no UI currently
- future numeric modifier/magic item/class feature forms can use a dice formula picker
- do not block current class/reward migration on this

Status:

- not used

### Equipment Catalog

New tables:

- `equipment_category`
- `equipment_item`
- `weapon_property`
- `weapon_mastery`
- `weapon_stat`
- `weapon_item_property`
- `armor_stat`

Purpose:

- normalized DnD equipment catalog
- armor/weapon/tool items
- weapon properties/masteries
- armor/weapon stat payloads

Frontend impact:

- current frontend item flows use old item templates/inventory APIs
- new equipment catalog is not surfaced yet
- class armor/weapon/tool proficiencies should NOT become multiselects against this catalog; backend decision is text descriptions for those proficiencies
- future equipment browser/editor should be separate from current inventory/item template UI

Required future UI:

- equipment catalog list
- equipment item detail
- filters by kind/category
- weapon properties display
- weapon mastery display
- armor stats display
- price display via `money_value`

Status:

- not used

### Feats

New tables:

- `feat_category`
- `feat`
- `feat_prerequisite`
- `feat_section`

Purpose:

- normalized feats
- categories
- structured prerequisites
- rich text/sections

Frontend impact:

- current admin feats use flat `FeatResponse`
- current feat request has `prerequisites?: string`
- level-up can grant feats through legacy reward entries
- new typed grants can reference `feat`

Needed future UI:

- feat category picker
- structured prerequisite editor
- feat section renderer/editor
- feat grant picker inside reward group editor

Status:

- `feat`: used
- `feat_category`: not used
- `feat_prerequisite`: not used
- `feat_section`: not used

### Backgrounds

New tables:

- `background`
- `background_feat_option`
- `background_ability_option`
- `background_skill_proficiency`
- `background_tool_proficiency`
- `background_language_proficiency`
- `background_equipment_choice_group`
- `background_equipment_option`
- `background_equipment_entry`

Purpose:

- normalized backgrounds
- background skill/tool/language proficiencies
- background feat/ability/equipment choices

Frontend impact:

- current character wizard has a background step
- current background response exposes:
  - name
  - description
  - skill proficiency names
  - granted extras
- frontend does not yet support structured background choices

Needed future UI:

- show fixed proficiencies as read-only rows
- render ability/feat choices if present
- render equipment choice groups
- persist selected background choices in character creation

Status:

- `background`: used
- `background_skill_proficiency`: aggregate-only
- `background_tool_proficiency`: aggregate-only
- `background_language_proficiency`: aggregate-only
- all background choice/entry tables: not used

### Spells

New tables:

- `spell_school`
- `spell`
- `spell_component`
- `spell_class`
- `spell_subclass`

Purpose:

- normalized spells
- spell schools
- verbal/somatic/material components
- class/subclass spell lists

Frontend impact:

- current frontend has reference spell picker
- NPC form uses spell picker
- character wizard has spell step
- current spell DTO has:
  - id
  - name
  - level
  - school string
  - description
  - availableToClassIds
- components are not exposed/rendered
- subclass spell lists are not exposed/rendered

Needed future UI:

- spell detail renderer with components
- class/subclass spell-list filters
- spell grant picker for level-up reward groups
- spell grant picker for homebrew class rewards

Status:

- `spell`: used
- `spell_school`: aggregate-only
- `spell_class`: aggregate-only
- `spell_component`: not used
- `spell_subclass`: not used

### Classes and Subclasses

New tables:

- `character_class`
- `subclass`
- `class_feature`
- `class_progression_column`
- `class_progression_value`

Purpose:

- normalized class catalog
- subclass catalog
- class/subclass features by level
- arbitrary progression tables

Frontend impact:

- class is used in:
  - character creation
  - NPC forms
  - level-up class options
  - admin class screens
  - homebrew rich class wizard
- subclass is used in:
  - admin subclass screens
  - level-up subclass reward choices
- class features are typed as `ClassFeatureSummary`, but no first-class UI yet
- progression columns/values have no UI

Needed future UI:

- class detail panel should show:
  - hit die
  - primary abilities
  - saving throws
  - skill choices
  - spellcasting profile
  - proficiency texts
  - features by level
  - level 1 reward groups
- class authoring must have a Features step
- level-up should render automatic `class_feature` grants
- progression tables can be a later advanced class-detail section

Status:

- `character_class`: used
- `subclass`: used
- `class_feature`: prepared-only
- `class_progression_column`: not used
- `class_progression_value`: not used

### Species/Race Replacement

New tables:

- `creature_type`
- `character_size`
- `species`
- `species_size_option`
- `species_speed`
- `species_trait`
- `species_trait_effect`

Purpose:

- normalized species/race model
- sizes
- speeds
- traits
- trait effects

Frontend impact:

- current frontend still uses race/lineage DTOs
- character wizard has race step
- admin has race editor
- bestiary creature type is out of scope and should not be confused with this migration

Needed future UI:

- dedicated species migration later
- do not mix into current class/reward migration
- keep current race UI stable for now

Status:

- not used

### Magic Items

New tables:

- `magic_item_type`
- `magic_item_rarity`
- `magic_item`
- `magic_item_allowed_equipment`

Purpose:

- normalized magic item catalog
- magic item type/rarity
- constraints against equipment items

Frontend impact:

- current frontend uses item templates, item instances, enchantments and inventory
- this new magic item catalog has no UI yet
- do not merge it casually into inventory templates

Needed future UI:

- magic item catalog browser/editor
- allowed equipment picker
- rarity/type dictionaries
- integration with inventory grant flow only after backend exposes it

Status:

- not used

### Random Tables, Crafting, Import Warnings

New tables:

- `random_table`
- `random_table_entry`
- `spell_scroll_crafting_rule`
- `import_warning`

Purpose:

- random tables
- spell scroll crafting rules
- import/importer warning review

Frontend impact:

- no current product surface
- should be future separate tools

Status:

- not used

## Backend Migration 057: Class Mechanics

This migration adds flexible class mechanics without JSONB.

### New Columns on `character_class`

Fields:

- `hit_die`
- `is_spellcaster`
- `has_cantrips`
- `is_half_caster`
- `spellcasting_ability_id`
- `skill_choice_count`
- `skill_choice_any`
- `armor_proficiency_text`
- `weapon_proficiency_text`
- `tool_proficiency_text`

Frontend impact:

- `hit_die`
  - already used in character wizard and level-up HP previews
- `is_spellcaster`, `has_cantrips`, `is_half_caster`
  - partly rendered in character wizard
- `spellcasting_ability_id`
  - old UI mostly uses `spellcastingStatId/name`
  - new DTO may send `spellcastingAbility`
- `skill_choice_count`
  - used for class skill selection validation
- `skill_choice_any`
  - typed, but UI behavior not implemented
- proficiency text fields
  - typed, but UI still mostly uses old combined `armorWeaponProficiencies`

Required frontend changes:

- class card/detail must render separate rows:
  - armor
  - weapons
  - tools
- skill chooser must support:
  - choose N from options
  - choose N from any skill if `skillChoiceAny = true`
- spellcasting row should support `spellcastingAbility` object, not only old id/name fields

### New Tables

#### `class_saving_throw`

Purpose:

- class saving throw proficiencies

Frontend impact:

- old field: `savingThrowStatNames`
- new field: `savingThrows: ContentLabel[]`
- class detail should prefer `savingThrows`, fallback to names

Status:

- aggregate-only

#### `class_primary_ability`

Purpose:

- one or more primary abilities

Frontend impact:

- old field: single `primaryAbilityStatId`
- new field: `primaryAbilities: ContentLabel[]`
- class detail must support multiple primary abilities

Status:

- prepared-only

#### `class_skill_option`

Purpose:

- allowed class skill choices

Frontend impact:

- old field: `skillChoiceOptions: ProficiencySkillResponse[]`
- new field: `skillOptions: ContentLabel[]`
- class skill picker should prefer `skillOptions`, fallback to `skillChoiceOptions`

Status:

- aggregate-only / prepared

## Backend Migration 058: Reward Choice Schema

This is the biggest frontend change.

Old model:

- one flat class level reward row
- reward type string
- reward id
- optional `isChoice`

New model:

- a level-up step is a reward group
- a group can have direct grants
- a group can have options
- each option can have multiple grants
- each grant has a `grant_type`
- known structured grants have typed payload tables
- unknown/custom grants remain possible for homebrew

### `class_level_reward_group`

Purpose:

- one reward decision/automatic grant group at a class level

Important fields conceptually:

- group id
- class id
- class feature id
- class level
- group kind
- prompt
- description
- choose min
- choose max
- repeatable
- sort order

Frontend impact:

- level-up UI must render groups, not `rewardType` buckets
- character creation must render level 1 groups
- homebrew class authoring must let users create/edit groups

UI rules:

- no options and no choose count: automatic group
- `chooseMin = 1`, `chooseMax = 1`: radio group
- exact count: checkbox group with exact validation
- min/max: checkbox group with min/max validation
- `repeatable = true`: only allow repeated picks if backend contract supports it

Status:

- prepared-only

### `class_level_reward_option`

Purpose:

- selectable option inside a reward group

Important fields conceptually:

- option id
- group id
- option key
- label RU/EN
- description
- recommended flag
- sort order

Frontend impact:

- render option cards/radio/checkboxes
- support recommended badge
- selected option grants may include multiple typed grants

Status:

- prepared-only

### `class_level_reward_grant`

Purpose:

- grant header attached either directly to group or to option

Important fields conceptually:

- grant id
- group id OR option id
- grant type
- label RU/EN
- description
- sort order

Frontend impact:

- render by group first, grant type second
- unknown grant type must not crash UI
- custom/homebrew grants must be user-friendly

Status:

- prepared-only

### Typed Grant Tables

#### `class_level_reward_grant_feature`

Purpose:

- grants a class/subclass feature

Frontend impact:

- level-up automatic grants should show feature card
- character creation should show level 1 feature preview
- homebrew authoring needs feature picker

Status:

- prepared-only

#### `class_level_reward_grant_subclass`

Purpose:

- grants/selects a subclass

Frontend impact:

- level-up subclass selection should become option/group driven
- current legacy subclass rendering exists, but not through new grant payload

Status:

- prepared-only

#### `class_level_reward_grant_feat`

Purpose:

- grants/selects a feat

Frontend impact:

- level-up feat choice picker
- homebrew reward grant feat picker
- should support fixed feat and choose feat modes

Status:

- prepared-only

#### `class_level_reward_grant_spell`

Purpose:

- grants fixed spell or spell choice by level/school/filter

Frontend impact:

- level-up spell picker
- filter by backend-provided spell options or raw filter text
- homebrew reward spell grant editor

Status:

- prepared-only

#### `class_level_reward_grant_skill_proficiency`

Purpose:

- grants fixed skill proficiency or lets user choose skills

Frontend impact:

- level-up skill picker
- character creation class skill choices should eventually share the same skill picker component
- support `anySkill`
- support `chooseCount`

Status:

- prepared-only

#### `class_level_reward_grant_skill_option`

Purpose:

- allowed skill options for a skill grant

Frontend impact:

- render allowed skill option list
- validate exact count

Status:

- prepared-only

#### `class_level_reward_grant_ability_score`

Purpose:

- grants fixed or selectable ability score bonuses

Frontend impact:

- replaces hard-coded ASI UI
- must support:
  - fixed +1
  - choose one +1
  - choose one +2
  - choose two +1/+1
  - homebrew total bonus
  - max score cap
  - max per ability

Status:

- prepared-only

#### `class_level_reward_grant_ability_option`

Purpose:

- allowed ability options for ability score grant

Frontend impact:

- ability grant renderer should use this list when present
- fallback to all ability scores only if backend says any/all is allowed

Status:

- prepared-only

#### `class_level_reward_grant_numeric_modifier`

Purpose:

- structured numeric modifier grant

Frontend impact:

- render as read-only modifier preview in level-up
- homebrew authoring needs numeric modifier editor
- deterministic numeric modifiers can be auto-applied by backend

Status:

- prepared-only

#### `class_level_reward_grant_custom_text`

Purpose:

- custom/manual/homebrew grant text

Frontend impact:

- must render generic panel
- if user editable, allow note/manual text
- must not block homebrew content just because frontend lacks typed renderer

Status:

- prepared-only

### Character Reward Selection Tables

New tables:

- `character_reward_selection`
- `character_reward_ability_score_selection`
- `character_reward_skill_selection`
- `character_reward_spell_selection`

Purpose:

- persist user decisions for reward groups/options and nested ability/skill/spell selections

Frontend impact:

- current `LevelUpRequest` is still legacy:
  - `classId`
  - `selections: { rewardType, rewardEntryId }[]`
  - special `abilityScoreImprovement`
- target request should be group/option based:
  - `classId`
  - `rewardSelections[]`
  - `groupId`
  - `optionId`
  - nested ability/skill/spell selections
  - optional note text

Already added frontend type:

```ts
type ContentLevelUpRequest = {
  classId: string;
  rewardSelections: ContentRewardSelection[];
};
```

Do not switch submit payload until backend endpoint accepts it.

Status:

- prepared-only

## Frontend Screens That Must Change

### Character Creation

Files:

- `src/features/character-wizard/CharacterCreationWizard.tsx`
- `src/features/character-wizard/steps.tsx`
- `src/features/character-wizard/parts.tsx`
- `src/features/character-wizard/wizardState.ts`
- `src/pages/gm/campaigns/CharacterCreationWizardPage.tsx`
- `src/pages/player/TemplateWizardPage.tsx`

Required changes:

1. Class card/detail
   - show hit die
   - show multiple primary abilities
   - show saving throws
   - show skill choice rule
   - show armor proficiency text
   - show weapon proficiency text
   - show tool proficiency text
   - show spellcasting profile
   - show source/homebrew badge
2. Class skill choice
   - use `skillOptions` if present
   - fallback to `skillChoiceOptions`
   - support `skillChoiceAny`
3. Level 1 rewards
   - show automatic grants
   - show required choices
   - store pending selections in wizard state
   - submit only after backend supports new creation payload
4. Background step
   - currently can stay stable
   - later needs structured background choices

Do not touch race/species migration here unless backend asks for it.

### Level-Up

File:

- `src/pages/gm/campaigns/LevelUpWizardPage.tsx`

Current behavior:

- class options from `useLevelUpOptions`
- reward groups rendered as legacy `rewardType -> rewards`
- selection local state keyed by `groupKey` now
- submit still builds legacy `LevelUpRequest`

Required changes:

1. Introduce `RewardGroupRenderer`
2. Render direct group grants separately from option grants
3. Render group options with choose min/max validation
4. Replace hard-coded ASI with `AbilityGrantRenderer`
5. Add renderers:
   - feature
   - subclass
   - feat
   - spell
   - skill
   - ability score
   - numeric modifier
   - custom text
   - unknown fallback
6. Switch submit to `ContentLevelUpRequest` only when backend supports it

### Homebrew Class Authoring

Files:

- `src/components/homebrew/RichClassWizard.tsx`
- `src/components/admin/AdminClassRichWizard.tsx`
- `src/pages/admin/CharacterClassesPage.tsx`
- `src/pages/admin/LevelRewardsPage.tsx`

Current behavior:

- old rich class model
- flat rewards
- old reward types

Required changes:

1. Split class editor into steps/tabs:
   - identity
   - mechanics
   - features
   - reward groups
   - typed grants
   - review
2. Add mechanics editor:
   - hit die
   - primary abilities
   - saving throws
   - skill choice count
   - skill choice any
   - skill options
   - armor/weapon/tool textareas
   - spellcasting settings
3. Add feature editor:
   - level
   - title
   - description
   - class/subclass scope
4. Add reward group editor:
   - class level
   - prompt
   - choose min/max
   - repeatable
   - direct grants
   - options
5. Add typed grant editors:
   - feature
   - subclass
   - feat
   - spell
   - skill proficiency
   - ability score
   - numeric modifier
   - custom text
6. Add review screen that previews character creation and level-up display

Important:

- every typed editor needs a custom/manual fallback
- homebrew must not be blocked by missing renderer support

### Admin Reference Screens

Files:

- `src/pages/admin/CharacterClassesPage.tsx`
- `src/pages/admin/SubclassesPage.tsx`
- `src/pages/admin/SkillsPage.tsx`
- `src/pages/admin/FeatsPage.tsx`
- `src/pages/admin/LevelRewardsPage.tsx`

Impact:

- these currently map to old endpoints/entities
- do not blindly switch them without backend API migration
- they need transitional labels or new pages when backend is ready

## Frontend Types to Use

Already present in `src/types/index.ts`:

- `ContentLabel`
- `ClassFeatureSummary`
- `ContentRewardOption`
- `ContentRewardGrant`
- `ContentRewardSelection`
- `ContentAbilityScoreSelection`
- `ContentSkillSelection`
- `ContentSpellSelection`
- `ContentLevelUpRequest`

Existing types extended:

- `CharacterClassDetailResponse`
- `RewardGroup`

Important helper:

- `rewardGroupKey(group)` from `src/lib/contentAdapters.ts`

Use `rewardGroupKey` for local UI state.
Do not use `rewardType` as the only key anymore.

## Safe Rollout Order

1. Keep legacy screens operational.
2. Keep using adapters at API boundaries.
3. Render new class mechanics read-only.
4. Add generic reward group renderer behind payload detection.
5. Use reward group renderer in level-up first.
6. Use the same renderer for level 1 character creation.
7. Add `ContentLevelUpRequest` submit only when backend endpoint supports it.
8. Rebuild homebrew class authoring around groups/options/grants.
9. Add structured background choices later.
10. Add equipment/species/magic-item/random/crafting/import-warning product surfaces later.

## Do Not Touch in This Migration Slice

Unless specifically asked:

- bestiary runtime flows
- combat
- inventory item instance flows
- wallet operations
- quest rewards
- campaign membership
- current race/species UI
- existing read-only character sheet

## Validation Checklist for Frontend Agent

After each slice:

- `npm run build`
- `npm run lint`
- create a character with legacy payload
- open class creation wizard
- select class skills
- open level-up
- select subclass reward
- select non-subclass reward
- allocate ASI
- confirm level-up still submits legacy request until backend supports new request
- verify no regressions in bestiary route loading

Known current lint state:

- lint passes with warnings
- warnings are tracked in `docs/frontend-global-problems.md`

## Summary of Not-Yet-Used Entities

No frontend UI yet:

- equipment catalog:
  - `equipment_category`
  - `equipment_item`
  - `weapon_property`
  - `weapon_mastery`
  - `weapon_stat`
  - `weapon_item_property`
  - `armor_stat`
- structured feats:
  - `feat_category`
  - `feat_prerequisite`
  - `feat_section`
- structured background choices:
  - `background_feat_option`
  - `background_ability_option`
  - `background_equipment_choice_group`
  - `background_equipment_option`
  - `background_equipment_entry`
- spell internals:
  - `spell_component`
  - `spell_subclass`
- species model:
  - `creature_type`
  - `character_size`
  - `species`
  - `species_size_option`
  - `species_speed`
  - `species_trait`
  - `species_trait_effect`
- magic item catalog:
  - `magic_item_type`
  - `magic_item_rarity`
  - `magic_item`
  - `magic_item_allowed_equipment`
- progression/random/crafting/import:
  - `class_progression_column`
  - `class_progression_value`
  - `random_table`
  - `random_table_entry`
  - `spell_scroll_crafting_rule`
  - `import_warning`
  - `money_value`
  - `dice_formula`

Prepared but not fully rendered:

- `class_feature`
- `class_primary_ability`
- separate class proficiency text fields
- all `class_level_reward_*` tables
- all `character_reward_*_selection` tables
