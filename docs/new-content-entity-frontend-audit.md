# New Content Entity Frontend Audit

Backend migrations checked:

- `054-create-dnd-content-schema.xml`
- `057-class-mechanics.xml`
- `058-class-reward-choices.xml`

Status legend:

- `used` - frontend has a real screen/API/type consuming this concept.
- `aggregate-only` - frontend uses it only through a parent DTO, not as its own table/entity.
- `prepared-only` - frontend types/adapters can accept it, but no UI renders/edits it yet.
- `not used` - no meaningful frontend usage found.

## 054 Core Content Schema

| Table | Frontend role | Status |
|---|---|---|
| `source_book` | Source is displayed as plain `source` string on available content entries. No source-book browser/editor. | aggregate-only |
| `mod_package` | Homebrew package/source is displayed as `homebrewTitle`. Package management uses old homebrew APIs, not this table directly. | aggregate-only |
| `currency` | Wallet, quest rewards, character creation starting coins, reference currencies. | used |
| `money_value` | Price/cost helper table. No UI field maps to it directly. | not used |
| `ability_score` | Stat/reference data, character stats, ASI, class primary/saves. | used |
| `skill` | Proficiency skill choices and reference skills; old admin `Skill` screen still also means active class abilities. | used |
| `damage_type` | Item templates, skills, effects use damage type strings. No new content damage dictionary UI. | aggregate-only |
| `dice_formula` | Numeric/modifier tables can reference it, but no frontend picker/editor. | not used |
| `equipment_category` | New equipment catalog category. Current UI uses item templates/inventory, not this catalog. | not used |
| `equipment_item` | New equipment catalog item. Current UI uses item templates/inventory, not this catalog. | not used |
| `weapon_property` | No weapon property picker/display for new equipment catalog. | not used |
| `weapon_mastery` | No mastery picker/display. | not used |
| `weapon_stat` | No new weapon stat editor/display. | not used |
| `weapon_item_property` | Join table; no direct UI. | not used |
| `armor_stat` | No new armor stat editor/display. | not used |
| `feat_category` | No feat category picker/editor. | not used |
| `feat` | Admin feats, homebrew rich class rewards, level-up rewards. | used |
| `feat_prerequisite` | Frontend has only flat `prerequisites?: string`. No structured prerequisite editor. | not used |
| `feat_section` | No structured feat section rendering/editor. | not used |
| `background` | Character creation background step and reference backgrounds. | used |
| `background_feat_option` | No background feat-choice UI. | not used |
| `background_ability_option` | No background ability-choice UI. | not used |
| `background_skill_proficiency` | Background response exposes `skillProficiencyNames`; no structured picker from this table. | aggregate-only |
| `background_tool_proficiency` | Background response exposes `grantedExtras`; no structured tool proficiency UI. | aggregate-only |
| `background_language_proficiency` | Background response exposes `grantedExtras`; no structured language UI. | aggregate-only |
| `background_equipment_choice_group` | No background equipment choice UI. | not used |
| `background_equipment_option` | No background equipment choice UI. | not used |
| `background_equipment_entry` | No background equipment choice UI. | not used |
| `spell_school` | Spells expose `school?: string`; no spell-school dictionary UI. | aggregate-only |
| `character_class` | Character creation, NPC forms, level-up class options, admin class screens. | used |
| `subclass` | Admin subclasses and level-up subclass rewards. | used |
| `spell` | Reference spell picker, NPC spell picker, character creation spell step. | used |
| `spell_component` | Spell reference DTO does not expose components. | not used |
| `spell_class` | Spell filtering by `classId` / `availableToClassIds`; no direct join-table UI. | aggregate-only |
| `spell_subclass` | No subclass spell-list UI. | not used |
| `creature_type` | New species/creature metadata; current creature type UI is bestiary-related and out of scope. | not used |
| `character_size` | New species size metadata; current race UI does not use it structurally. | not used |
| `species` | Frontend still uses race/lineage DTOs, not new species. | not used |
| `species_size_option` | No new species UI. | not used |
| `species_speed` | No new species UI. | not used |
| `species_trait` | No new species UI. | not used |
| `species_trait_effect` | No new species UI. | not used |
| `magic_item_type` | Current item UI uses item templates/rarity, not new magic item catalog. | not used |
| `magic_item_rarity` | Current item UI uses rarity strings/templates, not new magic item rarity table. | not used |
| `magic_item` | No new magic item catalog UI. | not used |
| `magic_item_allowed_equipment` | No new magic item/equipment attunement UI. | not used |
| `class_progression_column` | No class progression table UI. | not used |
| `class_progression_value` | No class progression table UI. | not used |
| `class_feature` | Type exists as `ClassFeatureSummary`, but class creation/level-up UI does not render new class features as first-class data yet. | prepared-only |
| `random_table` | No random table UI. | not used |
| `random_table_entry` | No random table UI. | not used |
| `spell_scroll_crafting_rule` | No spell scroll crafting UI. | not used |
| `import_warning` | No import warning review UI. | not used |

## 057 Class Mechanics

| Table / Columns | Frontend role | Status |
|---|---|---|
| `character_class.hit_die` | Rendered/used in character wizard and level-up HP previews. | used |
| `character_class.is_spellcaster` | Rendered in character wizard class details. | used |
| `character_class.has_cantrips` | Rendered in character wizard class details. | used |
| `character_class.is_half_caster` | Rendered in character wizard class details. | used |
| `character_class.spellcasting_ability_id` | Old UI mostly uses `spellcastingStatId/name`; new `spellcastingAbility` is prepared in types. | aggregate-only |
| `character_class.skill_choice_count` | Used for character wizard validation and skill choice limit. | used |
| `character_class.skill_choice_any` | Added to frontend type; no UI behavior yet. | prepared-only |
| `character_class.armor_proficiency_text` | Added to frontend type; current UI still renders old combined `armorWeaponProficiencies`. | prepared-only |
| `character_class.weapon_proficiency_text` | Added to frontend type; current UI still renders old combined `armorWeaponProficiencies`. | prepared-only |
| `character_class.tool_proficiency_text` | Added to frontend type; no UI rendering yet. | prepared-only |
| `class_saving_throw` | Used as `savingThrowStatNames`/`savingThrows` on class detail DTO. | aggregate-only |
| `class_primary_ability` | Old UI uses one `primaryAbilityStatId`; new multi-primary array is typed but not rendered yet. | prepared-only |
| `class_skill_option` | Used as `skillChoiceOptions`; new `skillOptions` typed. | aggregate-only |

## 058 Reward Choice Schema

| Table | Frontend role | Status |
|---|---|---|
| `class_level_reward_group` | `RewardGroup` type now has `id`, `groupKind`, `prompt`, choose min/max, grants/options; current UI still renders legacy groups. | prepared-only |
| `class_level_reward_option` | `ContentRewardOption` type exists; no option-based renderer yet. | prepared-only |
| `class_level_reward_grant` | `ContentRewardGrant` type exists; no typed grant renderer yet. | prepared-only |
| `class_level_reward_grant_feature` | Represented in `ContentRewardGrant.feature`; not rendered yet. | prepared-only |
| `class_level_reward_grant_subclass` | Legacy subclass rewards render through `RewardEntry`; new grant payload not rendered yet. | prepared-only |
| `class_level_reward_grant_feat` | Legacy feat rewards render through `RewardEntry`; new grant payload not rendered yet. | prepared-only |
| `class_level_reward_grant_spell` | Type supports spell grant fields; no spell grant picker in level-up yet. | prepared-only |
| `class_level_reward_grant_skill_proficiency` | Type supports skill grant fields; current skill choice flow is legacy. | prepared-only |
| `class_level_reward_grant_skill_option` | Type supports `skillOptions`; no renderer yet. | prepared-only |
| `class_level_reward_grant_ability_score` | Type supports ability grant fields; current ASI UI is still hard-coded legacy. | prepared-only |
| `class_level_reward_grant_ability_option` | Type supports `abilityOptions`; no new renderer yet. | prepared-only |
| `class_level_reward_grant_numeric_modifier` | Type supports numeric modifier fields; no renderer yet. | prepared-only |
| `class_level_reward_grant_custom_text` | Type supports custom text fields; no manual/custom grant UI yet. | prepared-only |
| `character_reward_selection` | `ContentLevelUpRequest`/`ContentRewardSelection` types exist; current submit still sends legacy `LevelUpRequest`. | prepared-only |
| `character_reward_ability_score_selection` | New request type exists; not sent by UI yet. | prepared-only |
| `character_reward_skill_selection` | New request type exists; not sent by UI yet. | prepared-only |
| `character_reward_spell_selection` | New request type exists; not sent by UI yet. | prepared-only |

## Not Used on Frontend

These migration entities currently have no meaningful frontend role:

- `money_value`
- `dice_formula`
- `equipment_category`
- `equipment_item`
- `weapon_property`
- `weapon_mastery`
- `weapon_stat`
- `weapon_item_property`
- `armor_stat`
- `feat_category`
- `feat_prerequisite`
- `feat_section`
- `background_feat_option`
- `background_ability_option`
- `background_equipment_choice_group`
- `background_equipment_option`
- `background_equipment_entry`
- `spell_component`
- `spell_subclass`
- `creature_type`
- `character_size`
- `species`
- `species_size_option`
- `species_speed`
- `species_trait`
- `species_trait_effect`
- `magic_item_type`
- `magic_item_rarity`
- `magic_item`
- `magic_item_allowed_equipment`
- `class_progression_column`
- `class_progression_value`
- `random_table`
- `random_table_entry`
- `spell_scroll_crafting_rule`
- `import_warning`

## Prepared But Not Yet Functionally Used

These are already represented in frontend types/adapters, but need UI work:

- `class_feature`
- `character_class.skill_choice_any`
- `character_class.armor_proficiency_text`
- `character_class.weapon_proficiency_text`
- `character_class.tool_proficiency_text`
- `class_primary_ability` as multi-value primary ability
- all `class_level_reward_*` group/option/grant tables
- all `character_reward_*_selection` tables

## Main Frontend Gaps

1. Character creation still displays old class details and needs separate armor/weapon/tool rows plus multi-primary ability support.
2. Character creation does not render level 1 reward groups/options.
3. Level-up still renders legacy `rewardType -> RewardEntry[]` groups, although it now has a safer `groupKey`.
4. ASI is still a hard-coded special block, not a generic ability grant renderer.
5. Homebrew class authoring still creates old rich class rewards, not new reward groups/options/typed grants.
6. New equipment/species/magic-item/random-table/crafting/import-warning tables have no frontend product surface yet.
