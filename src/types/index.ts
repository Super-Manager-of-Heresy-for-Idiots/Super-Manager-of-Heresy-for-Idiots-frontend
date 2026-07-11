// === Enums / Unions ===

export type Role = 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'MAIN_HAND' |
  'OFF_HAND' | 'RING_LEFT' | 'RING_RIGHT' | 'NECK' | 'CLOAK';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY';

export type DamageType = 'SLASHING' | 'PIERCING' | 'BLUDGEONING' | 'FIRE' | 'COLD' |
  'LIGHTNING' | 'POISON' | 'NECROTIC' | 'RADIANT' | 'PSYCHIC' | 'FORCE' | 'THUNDER' | 'ACID';

export type SkillActivation = 'PASSIVE' | 'ACTIVE';

export type RewardType = 'SKILL' | 'SUBCLASS' | 'FEAT' | 'BUFF_DEBUFF';
export type SkillEffectRole = 'BUFF' | 'DEBUFF';

export type CampaignRole = 'GM' | 'PLAYER';

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'HEAD', 'CHEST', 'LEGS', 'FEET', 'MAIN_HAND',
  'OFF_HAND', 'RING_LEFT', 'RING_RIGHT', 'NECK', 'CLOAK'
];

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  HEAD: 'Head',
  CHEST: 'Chest',
  LEGS: 'Legs',
  FEET: 'Feet',
  MAIN_HAND: 'Main Hand',
  OFF_HAND: 'Off Hand',
  RING_LEFT: 'Ring (Left)',
  RING_RIGHT: 'Ring (Right)',
  NECK: 'Neck',
  CLOAK: 'Cloak',
};

// === API Response Wrappers ===

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  message: string;
  fields: Record<string, string>;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export interface LoginPageStatsResponse {
  campaignCount: number;
  userCount: number;
  vigilDays: number;
}

export interface AppReleaseConfig {
  version: string;
  releaseName: {
    ru: string;
    en: string;
  };
}

// === Auth ===

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'PLAYER' | 'GAME_MASTER';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SwitchAccountRequest {
  userId: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: UserResponse;
}

// === Characters ===

export interface CreateCharacterRequest {
  name: string;
  classId: string;
  raceId: string;
  selectedLineageId?: string | null;
  campaignId: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  playerName?: string;
  proficiencies?: string;
  equipment?: string;
  raceId?: string;
  selectedLineageId?: string | null;
}

export interface CharacterResponse {
  id: string;
  name: string;
  totalLevel: number;
  experience: number;
  classLevels: ClassLevelResponse[];
  race: CharacterRaceResponse;
  selectedLineageId?: string | null;
  raceSnapshot?: RaceSnapshot;
  ownerId: string;
  ownerUsername: string;
  stats: CharacterStatResponse[];
  status?: CharacterStatus;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  /** Walking speed in feet — drives tactical movement range (speed / cell size). */
  speed?: number;
  // Rich sheet fields (persisted by the wizard / full-create endpoint).
  alignment?: string;
  avatarUrl?: string;
  armorClass?: number;
  hitDiceType?: string;
  hitDiceTotal?: string;
  inspiration?: boolean;
  deathSaveSuccesses?: number;
  deathSaveFailures?: number;
  savingThrowProficiencyStatNames?: string[];
  background?: BackgroundResponse;
  biography?: BiographyResponse;
  features?: string;
  skillProficiencies?: CharacterSkillProficiency[];
  knownSpells?: CharacterKnownSpell[];
  attacks?: CharacterAttack[];
  // Fields needed to mirror the template/forge sheet read-only on the Folio.
  // NOTE: backend must populate these (see API notes); currently optional.
  playerName?: string;
  proficiencies?: string;
  equipment?: string;
  // Content-model migration signal (optional; populated only during the migration
  // window). Absent => treated as fully migrated. `blocked` => the character can't
  // be auto-mapped yet and content-changing flows should be read-only.
  contentMigrationStatus?: 'LEGACY' | 'UPGRADING' | 'MIGRATED' | string;
  contentMigrationBlocked?: boolean;
  contentMigrationMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BiographyResponse {
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export type SkillProficiencySource = 'CLASS' | 'BACKGROUND' | 'RACE' | 'FEAT' | 'OTHER';

export interface CharacterSkillProficiency {
  skillId: string;
  skillName: string;
  source: SkillProficiencySource;
}

export interface CharacterKnownSpell {
  spellId: string;
  name: string;
  level: number;
  school?: string;
}

export interface CharacterAttack {
  name: string;
  attackBonus: string;
  damage: string;
  damageType: string;
}

export interface ClassLevelResponse {
  classId: string;
  className: string;
  classLevel: number;
}

export interface CharacterStatResponse {
  id: string;
  statTypeId: string;
  statTypeName: string;
  value: number;
  effectiveValue?: number;
  activeModifiers?: StatModifierDetail[];
}

export interface StatModifierDetail {
  source: string;
  modifierValue: number;
}

export interface UpdateStatRequest {
  value: number;
}

export interface InviteCodeResponse {
  inviteCode: string;
}

// === Level-Up ===

export interface ContentLevelUpRequest {
  classId: string;
  selections: ContentLevelUpGroupSelection[];
}

export interface ContentLevelUpGroupSelection {
  rewardGroupId: string;
  optionIds?: string[];
  childSelections?: ContentLevelUpChildSelections;
}

export interface ContentLevelUpChildSelections {
  abilityScores?: ContentAbilityScoreChoice[];
  skillIds?: string[];
  spellIds?: string[];
  featId?: string;
}

export interface ContentAbilityScoreChoice {
  abilityScoreId: string;
  amount: number;
}

export interface LevelUpOptionsResponse {
  currentTotalLevel: number;
  xpToNextLevel: number;
  availableClasses: AvailableClassOption[];
}

export interface AvailableClassOption {
  classId: string;
  className: string;
  currentLevelInClass: number;
  newLevelInClass: number;
  rewardGroups: RewardGroup[];
  // Preview of the HP gained by ascending in THIS class (depends on its hit die).
  // Optional: when omitted the UI falls back to a generic "+by class" hint.
  hpGain?: HpGainPreview;
  // Preview of derived stat changes triggered by this ascent.
  derived?: AscentDerivedPreview;
}

export interface HpGainPreview {
  hitDie?: number;        // e.g. 8 for a d8 class
  conModifier?: number;   // Constitution modifier added per level (can be negative)
  average?: number;       // average roll + con, rounded as the system rules dictate
  rolledMin?: number;     // minimum possible gain (1 + con, floored at 1)
  rolledMax?: number;     // maximum possible gain (hitDie + con)
  currentMaxHp?: number;  // current max HP before the ascent (for projected total)
}

export interface AscentDerivedPreview {
  proficiencyBonusBefore?: number;
  proficiencyBonusAfter?: number;
  spellSlotsGained?: string;  // free text, e.g. "+1 slot (lvl 2)"
  cantripsGained?: number;
}

// Final contract: RewardGroupDto.
export interface RewardGroup {
  id?: string;
  classId?: string;
  classFeatureId?: string;
  classLevel?: number;
  groupKind?: string;
  prompt?: string;
  description?: string;
  chooseMin?: number;
  chooseMax?: number;
  repeatable?: boolean;
  sortOrder?: number;
  grants?: ContentRewardGrant[];
  options?: ContentRewardOption[];
  /** Stable frontend key (filled by normalizeRewardGroup; id/groupKind fallback). */
  groupKey?: string;
}

// Final contract: RewardOptionDto.
export interface ContentRewardOption {
  id: string;
  optionKey: string;
  label: string;
  labelRu?: string;
  labelEn?: string;
  description?: string;
  recommended?: boolean;
  sortOrder?: number;
  grants?: ContentRewardGrant[];
}

// Final contract: RewardGrantDto + typed payload.
export interface ContentRewardGrant {
  id: string;
  grantType: string;
  label?: string;
  labelRu?: string;
  labelEn?: string;
  description?: string;
  sortOrder?: number;
  feature?: ClassFeatureSummary;
  subclass?: ContentLabel;
  feat?: ContentLabel;
  spell?: ContentLabel;
  fixedSkill?: ContentLabel;
  skillOptions?: ContentLabel[];
  fixedAbility?: ContentLabel;
  abilityOptions?: ContentLabel[];
  spellLevel?: number;
  chooseCount?: number;
  anySkill?: boolean;
  bonusPerChoice?: number;
  totalBonus?: number;
  maxPerAbility?: number;
  maxScore?: number;
  modifierKey?: string;
  targetKind?: string;
  targetLabel?: string;
  amount?: number;
  unitText?: string;
  durationText?: string;
  title?: string;
  body?: string;
  userEditable?: boolean;
  rawFilterText?: string;
  /**
   * Raw nested payload as emitted by the backend (RewardGrantDto.payload, discriminated
   * by grantType). The adapter unwraps this into the surfaced id-list / scalar fields
   * below; components resolve the ids to labels via reference catalogs.
   */
  payload?: RewardGrantReadPayload;
  // --- surfaced from payload by normalizeRewardGroup (id-lists + scalars) ---
  /** FIXED | CHOICE | ANY (skill) / FIXED | CHOICE (spell) / FIXED | ANY (feat). */
  mode?: string;
  /** ABILITY_SCORE: selectable ability ids (payload.abilityOptionIds). */
  abilityOptionIds?: string[];
  /** SKILL_PROFICIENCY: fixed-grant skill ids (payload.skillIds). */
  skillIds?: string[];
  /** SKILL_PROFICIENCY: selectable skill ids (payload.skillOptionIds). */
  skillOptionIds?: string[];
  /** SKILL_PROFICIENCY: chosen skills confer Expertise instead of new proficiency. */
  grantsExpertise?: boolean;
  /** SPELL: fixed-grant spell ids (payload.fixedSpellIds). */
  fixedSpellIds?: string[];
  /** SPELL: min/max spell level filter for the selectable pool. */
  minLevel?: number;
  maxLevel?: number;
  /** SPELL: school-id filter for the selectable pool. */
  schoolIds?: string[];
  /** SPELL: spell-list / class-spell-list ids constraining the selectable pool. */
  spellListId?: string;
  classSpellListId?: string;
  /** SPELL: whether a known spell may be replaced when choosing on level-up. */
  allowReplaceOnLevelUp?: boolean;
  /** FEAT: fixed feat id (payload.featId). */
  featId?: string;
}

/**
 * Loose read-side view of {@code RewardGrantDto.payload}: a superset of all typed grant
 * payloads with every field optional (the backend sends only the subset relevant to the
 * grant's grantType). The strict {@link GrantPayload} union is the write-side contract.
 */
export interface RewardGrantReadPayload {
  mode?: string;
  abilityOptionIds?: string[];
  chooseCount?: number;
  bonusPerChoice?: number;
  totalBonus?: number;
  maxPerAbility?: number;
  maxScore?: number;
  skillIds?: string[];
  skillOptionIds?: string[];
  grantsExpertise?: boolean;
  fixedSpellIds?: string[];
  spellLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  schoolIds?: string[];
  spellListId?: string;
  classSpellListId?: string;
  allowReplaceOnLevelUp?: boolean;
  featId?: string;
}

export interface ContentLabel {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  nameRu?: string;
}

// Final contract: ClassFeatureSummaryDto.
export interface ClassFeatureSummary {
  id: string;
  slug?: string;
  classId?: string;
  subclassId?: string;
  level: number;
  sortOrder?: number;
  title: string;
  description?: string;
  activationType?: string | null;
  attackRoll?: boolean | null;
  saveAbility?: string | null;
  damageDice?: string | null;
  damageType?: string | null;
  healingDice?: string | null;
  healingFlat?: number | null;
  warning?: boolean | null;
  warningReason?: string | null;
}

// Mirrors the structured fields already modelled on SkillResponse / FeatResponse /
// BuffDebuffResponse so the level-up screen can show concrete effects, not just prose.
export interface RewardDetail {
  // Skill / class-feature mechanics
  skillActivation?: SkillActivation;     // PASSIVE / ACTIVE
  damageDice?: string;                   // "2d6"
  damageBonus?: number;
  damageType?: DamageType;
  effects?: SkillEffectResponse[];       // buff/debuff chances applied by the skill
  range?: string;                        // "30 ft"
  duration?: string;                     // "1 minute"
  usage?: string;                        // "1/long rest"
  // Feat
  prerequisites?: string;
  // Ability Score Improvement
  abilityStatName?: string;              // "Strength"
  currentScore?: number;                 // 15
  maxScore?: number;                     // 20 cap
  abilityOptions?: AbilityOption[];      // per-ability choices for ASI
  asiPointsTotal?: number;               // total points to distribute (usually 2)
}

// One distributable ability inside an ABILITY_SCORE_IMPROVEMENT reward.
export interface AbilityOption {
  statTypeId: string;    // identifier sent back as RewardSelection.rewardEntryId
  name: string;          // "Strength"
  currentScore: number;  // 15
  maxScore: number;      // 20 cap
}

export interface LevelUpResultResponse {
  newTotalLevel: number;
  classLeveled: string;
  newClassLevel: number;
  hpIncrease?: number;
  newMaxHp?: number;
  appliedGrants?: LevelUpAppliedGrant[];
  manualActions?: LevelUpManualActionItem[];
  proficiencyBonusBefore?: number;
  proficiencyBonusAfter?: number;
}

export interface LevelUpAppliedGrant {
  grantId: string;
  grantType: string;
  summary: string;
}

export interface LevelUpManualActionItem {
  grantId: string;
  grantType: string;
  instruction: string;
}

export interface AcquiredRewardSummary {
  rewardType: string;
  name: string;
  description?: string;
  detail?: RewardDetail;
}

// Known typed grant payloads. `grantType` on the backend is flexible text;
// the frontend renders known types its own way and unknown ones as custom/manual.
export const KNOWN_GRANT_TYPES = [
  'FEATURE',
  'SUBCLASS',
  'FEAT',
  'SPELL',
  'SKILL_PROFICIENCY',
  'ABILITY_SCORE',
  'NUMERIC_MODIFIER',
  'CUSTOM_TEXT',
] as const;

export type KnownGrantType = (typeof KNOWN_GRANT_TYPES)[number];

export function isKnownGrantType(grantType: string): grantType is KnownGrantType {
  return (KNOWN_GRANT_TYPES as readonly string[]).includes(grantType);
}

export const REWARD_TYPE_LABELS: Record<string, string> = {
  FEAT: 'Feat',
  SKILL: 'Class Feature',
  SUBCLASS: 'Subclass',
  BUFF_DEBUFF: 'Effect',
  ABILITY_SCORE_IMPROVEMENT: 'Ability Score Improvement',
};

// === XP thresholds (D&D 5e cumulative XP per level) ===
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
  6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
  16: 240000, 17: 265000, 18: 355000, 19: 405000, 20: 475000,
};

export function xpForLevel(level: number): number {
  return XP_THRESHOLDS[level] ?? 0;
}

export function xpForNextLevel(currentLevel: number): number {
  return XP_THRESHOLDS[currentLevel + 1] ?? Infinity;
}

export interface CharacterRewardsResponse {
  characterId: string;
  totalLevel: number;
  classBreakdown: ClassBreakdown[];
}

export interface ClassBreakdown {
  classId: string;
  className: string;
  classLevel: number;
  subclass?: { name: string; description: string };
  rewardsByType: Record<string, AcquiredReward[]>;
}

export interface AcquiredReward {
  name: string;
  acquiredAt: string;
}

// === Spell slots ===

/**
 * Per spell level: derived maximum (from class progression, never stored), how many
 * are expended, and how many remain available (= max − expended). The backend only
 * returns levels where max > 0 or expended > 0.
 */
export interface SpellSlotLevel {
  spellLevel: number;
  max: number;
  expended: number;
  available: number;
}

export interface SpellSlotsResponse {
  levels: SpellSlotLevel[];
}

// === Admin / Reference Data ===

export interface StatTypeResponse {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface ProficiencySkillResponse {
  id: string;
  name: string;
  governingStatId?: string;
  governingStatName?: string;
}

export interface BackgroundResponse {
  id: string;
  name: string;
  description?: string;
  skillProficiencyNames?: string[];
  grantedExtras?: string;
}

export interface SpellReferenceResponse {
  id: string;
  name: string;
  nameEn?: string;
  level: number;
  school?: string;
  description?: string;
  availableToClassIds?: string[];
}

// Final contract: ContentClassDetailResponse (kept name CharacterClassDetailResponse
// in code for now; `ContentClassDetailResponse` alias exported below).
export interface CharacterClassDetailResponse {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  nameRu?: string;
  subtitle?: string;
  description?: string;
  hitDie?: number;
  /** @deprecated legacy single primary ability; superseded by primaryAbilities[]. */
  primaryAbilityStatId?: string;
  primaryAbilities?: ContentLabel[];
  /** @deprecated legacy saving-throw names; superseded by savingThrows[]. */
  savingThrowStatNames?: string[];
  savingThrows?: ContentLabel[];
  skillChoiceCount?: number;
  skillChoiceAny?: boolean;
  /** @deprecated legacy skill options; superseded by skillOptions[]. */
  skillChoiceOptions?: ProficiencySkillResponse[];
  skillOptions?: ContentLabel[];
  /** @deprecated legacy combined proficiency; superseded by armor/weapon/tool text. */
  armorWeaponProficiencies?: string;
  armorProficiencyText?: string;
  weaponProficiencyText?: string;
  toolProficiencyText?: string;
  features?: ClassFeatureSummary[];
  rewardGroups?: RewardGroup[];
  spellcasting?: {
    isSpellcaster?: boolean;
    spellcaster?: boolean;
    spellcastingStatId?: string;
    spellcastingStatName?: string;
    spellcastingAbility?: ContentLabel;
    hasCantrips?: boolean;
    isHalfCaster?: boolean;
    halfCaster?: boolean;
  };
}

/** Alias matching the final contract name. */
export type ContentClassDetailResponse = CharacterClassDetailResponse;

export interface CharacterRaceDetailResponse {
  id: string;
  name: string;
  description?: string;
  speed?: number;
  abilityScoreIncreases?: { statName: string; bonus: number }[];
  traits?: string[];
  subraces?: {
    id: string;
    name: string;
    description?: string;
    abilityScoreIncreases?: { statName: string; bonus: number }[];
    speedOverride?: number;
    traits?: string[];
  }[];
}

export interface ItemTypeResponse {
  id: string;
  name: string;
  description?: string;
  slot: string;
  damageDice?: string;
  damageBonus?: number;
  damageType?: string;
  skillId?: string;
  skillName?: string;
  skillActivation?: SkillActivation;
}

export interface CharacterClassResponse {
  id: string;
  name: string;
  description?: string;
}

export interface CharacterRaceResponse {
  id: string;
  name: string;
  description?: string;
}

export interface SkillResponse {
  id: string;
  name: string;
  description?: string;
  skillType?: string;
  damageDice?: string;
  damageBonus?: number;
  damageType?: string;
  effects?: SkillEffectResponse[];
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  skillType?: string;
  damageDice?: string;
  damageBonus?: number;
  damageType?: string;
  /** Classes this skill is bound to (homebrew dependency picker). */
  classIds?: string[];
  /** Races this skill is bound to (homebrew dependency picker). */
  raceIds?: string[];
}

export interface SubclassResponse {
  id: string;
  name: string;
  classId: string;
  className: string;
  description?: string;
}

export interface CreateSubclassRequest {
  name: string;
  classId: string;
  description?: string;
}

export interface FeatResponse {
  id: string;
  name: string;
  description?: string;
  prerequisites?: string;
}

export interface CreateFeatRequest {
  name: string;
  description?: string;
  prerequisites?: string;
  /** Classes this feat is bound to (homebrew dependency picker). */
  classIds?: string[];
  /** Races this feat is bound to (homebrew dependency picker). */
  raceIds?: string[];
}

export interface ClassLevelRewardResponse {
  id: string;
  classId: string;
  requiredLevel: number;
  rewardType: string;
  rewardId: string;
  rewardName: string;
  isChoice: boolean;
}

export interface CreateClassLevelRewardRequest {
  requiredLevel: number;
  rewardType: RewardType;
  rewardId: string;
  isChoice: boolean;
}

export interface CreateStatTypeRequest {
  name: string;
  description?: string;
}

export interface CreateItemTypeRequest {
  name: string;
  description?: string;
  slot: EquipmentSlot;
  damageDice?: string;
  damageBonus?: number;
  damageType?: string;
  skillId?: string;
  skillActivation?: SkillActivation;
}

export interface CreateCharacterClassRequest {
  name: string;
  description?: string;
}

export interface CreateCharacterRaceRequest {
  name: string;
  description?: string;
}

// === Buffs / Debuffs ===

export interface BuffDebuffResponse {
  id: string;
  name: string;
  description?: string;
  effectType: string;
  targetStatId?: string;
  targetStatName?: string;
  modifierValue?: number;
  durationRounds?: number;
  isBuff: boolean;
  createdAt?: string;
}

export interface CreateBuffDebuffRequest {
  name: string;
  description?: string;
  effectType: string;
  targetStatId?: string;
  modifierValue?: number;
  durationRounds?: number;
  isBuff: boolean;
  /** Classes this buff/debuff is bound to (homebrew dependency picker). */
  classIds?: string[];
  /** Races this buff/debuff is bound to (homebrew dependency picker). */
  raceIds?: string[];
}

// === Class Authoring (new content model) — aggregate upsert ===
// Mirrors the backend ClassWriteRequest graph: identity + mechanics + features +
// subclasses + rewardGroups -> options -> typed grants. Children carry a server
// `id` (update) or a client `key` (create, referenced by grants in the same request).

export interface SpellcastingProfileInput {
  casterProgression: string;     // known: FULL | HALF | THIRD | PACT (free text allowed)
  spellcastingAbilityId: string;
  preparation: string;           // known: PREPARED | KNOWN
  ritualCasting: boolean;
  spellcastingFocusText?: string;
  notes?: string;
}

export interface FeatureInput {
  id?: string;
  key?: string;
  level: number;
  sortOrder: number;
  title: string;
  description?: string;
  subclassId?: string;
  subclassKey?: string;
}

export interface SubclassInput {
  id?: string;
  key?: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
}

export interface FeatureGrantPayload {
  featureId?: string;
  featureKey?: string;
  inline?: { title: string; description?: string };
}
export interface SubclassGrantPayload {
  subclassId?: string;
  subclassKey?: string;
}
export interface FeatGrantPayload {
  mode: 'FIXED' | 'ANY';
  featId?: string;
  inlineFeat?: { name: string; prerequisiteText?: string; description?: string };
  chooseCount?: number;
}
export interface SpellGrantPayload {
  mode: 'FIXED' | 'CHOICE';
  fixedSpellIds?: string[];
  spellLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  schoolIds?: string[];
  spellListId?: string;
  classSpellListId?: string;
  chooseCount?: number;
  allowReplaceOnLevelUp?: boolean;
}
export interface SkillProficiencyGrantPayload {
  mode: 'FIXED' | 'CHOICE' | 'ANY';
  skillIds?: string[];
  skillOptionIds?: string[];
  chooseCount?: number;
  grantsExpertise?: boolean;
}
export interface AbilityScoreGrantPayload {
  abilityOptionIds?: string[];
  chooseCount: number;
  bonusPerChoice: number;
  totalBonus?: number;
  maxPerAbility?: number;
  maxScore?: number;
}
export interface NumericModifierGrantPayload {
  modifierKey: string;
  amount: number;
  unitText?: string;
  durationText?: string;
  stacking?: boolean;
}
export interface CustomTextGrantPayload {
  title?: string;
  body?: string;
  markdown?: boolean;
  userEditable?: boolean;
}

export type GrantPayload =
  | FeatureGrantPayload
  | SubclassGrantPayload
  | FeatGrantPayload
  | SpellGrantPayload
  | SkillProficiencyGrantPayload
  | AbilityScoreGrantPayload
  | NumericModifierGrantPayload
  | CustomTextGrantPayload;

export interface GrantInput {
  id?: string;
  grantType: string;
  label?: string;
  labelRu?: string;
  labelEn?: string;
  description?: string;
  sortOrder: number;
  payload: GrantPayload;
}

export interface RewardOptionInput {
  id?: string;
  key?: string;
  optionKey: string;
  label: string;
  labelRu?: string;
  labelEn?: string;
  description?: string;
  recommended?: boolean;
  sortOrder: number;
  grants: GrantInput[];
}

export interface RewardGroupInput {
  id?: string;
  key?: string;
  classLevel: number;
  groupKind: string;             // known: AUTO | CHOICE
  prompt?: string;
  description?: string;
  chooseMin: number;
  chooseMax: number;
  repeatable: boolean;
  sortOrder: number;
  classFeatureId?: string;
  classFeatureKey?: string;
  options: RewardOptionInput[];
  grants: GrantInput[];
}

export interface ClassWriteRequest {
  name: string;
  nameRu?: string;
  nameEn?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  hitDie: number;                // 6 | 8 | 10 | 12
  primaryAbilityIds: string[];
  savingThrowIds: string[];
  skillChoiceCount: number;
  skillChoiceAny: boolean;
  skillOptionIds: string[];
  armorProficiencyText?: string;
  weaponProficiencyText?: string;
  toolProficiencyText?: string;
  spellcasting?: SpellcastingProfileInput | null;
  features: FeatureInput[];
  subclasses?: SubclassInput[];
  rewardGroups: RewardGroupInput[];
}

export interface AuthoringValidationIssue {
  path: string;
  code: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface ClassSaveResult {
  class: ContentClassDetailResponse;
  id: string;
  slug: string;
  packageId?: string;
  etag: string;
  createdAt: string;
  updatedAt: string;
  warnings: AuthoringValidationIssue[];
  resourceUrl: string;
}

// === Enchantments ===

export interface EnchantmentTypeResponse {
  id: string;
  name: string;
  description?: string;
  damageDice?: string;
  damageBonus: number;
  damageType?: string;
  buffDebuff?: BuffDebuffResponse;
}

export interface CreateEnchantmentTypeRequest {
  name: string;
  description?: string;
  damageDice?: string;
  damageBonus?: number;
  damageType?: string;
  buffDebuffId?: string;
}

export interface EnchantmentResponse {
  id: string;
  enchantmentType: EnchantmentTypeResponse;
  appliedAt: string;
  notes?: string;
}

export interface CreateEnchantmentRequest {
  enchantmentTypeId: string;
  notes?: string;
}

// === Skill Effects ===

export interface SkillEffectResponse {
  id: string;
  buffDebuff: BuffDebuffResponse;
  effectRole: 'BUFF' | 'DEBUFF';
  chancePercent: number;
}

export interface SetSkillEffectsRequest {
  effects: {
    buffDebuffId: string;
    effectRole: 'BUFF' | 'DEBUFF';
    chancePercent: number;
  }[];
}

// === Homebrew Marketplace ===

export type HomebrewStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type ContentType = 'ITEM_TYPE' | 'CHARACTER_CLASS' | 'SKILL' | 'FEAT' |
  'SUBCLASS' | 'RACE' | 'STAT_TYPE' | 'BUFF_DEBUFF' | 'ENCHANTMENT_TYPE' |
  'CURRENCY' | 'CUSTOM_RESOURCE' | 'ITEM_TEMPLATE';

export interface CreateHomebrewRequest {
  title: string;
  description?: string;
  tagNames?: string[];
}

export interface UpdateHomebrewRequest {
  title?: string;
  description?: string;
  tagNames?: string[];
}

export interface AddContentRequest {
  contentType: ContentType;
  contentId: string;
}

export type HomebrewContentSummary = Partial<Record<ContentType, number>> & {
  itemTypeCount?: number;
  classCount?: number;
  skillCount?: number;
  featCount?: number;
};

export interface ContentSummaryDto {
  id: string;
  name: string;
  description?: string;
  slot?: string;
  skillType?: string;
  prerequisites?: string;
  tier?: string;
}

export interface HomebrewPackageResponse {
  id: string;
  title: string;
  description?: string;
  status: HomebrewStatus;
  version: number;
  downloadCount: number;
  authorUsername: string;
  tags: string[];
  contentSummary: HomebrewContentSummary;
  publishedAt?: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface HomebrewDetailResponse extends HomebrewPackageResponse {
  contentByType: Partial<Record<ContentType, ContentSummaryDto[]>>;
}

export interface InstalledHomebrewResponse {
  installationId: string;
  packageId: string;
  title: string;
  authorUsername: string;
  isDeleted: boolean;
  installedAt: string;
  sourceVersion: number;
  contentSummary: HomebrewContentSummary;
}

export interface SoftDeleteResponse {
  message: string;
  installationCount: number;
}

export interface HardDeleteResponse {
  deletedPackageId: string;
  affectedLibraryEntries: number;
}

export interface HomebrewTagResponse {
  id: string;
  name: string;
  usageCount: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ═══════════════════════════════════════════════════════════
// v2 — Campaigns, Character v2, Items, Effects, Narrative, WS
// ═══════════════════════════════════════════════════════════

// === Campaigns (replace Teams) ===

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface CampaignDetailResponse {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  inviteCode?: string;
  memberCount: number;
  isCreator?: boolean;
  createdAt: string;
  updatedAt: string;
  members: CampaignMember[];
}

export interface CampaignMember {
  userId: string;
  username: string;
  roleInCampaign: CampaignRole;
  isCreator: boolean;
  joinedAt: string;
  kicked: boolean;
}

export interface CampaignResponse {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  inviteCode?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  members: CampaignMember[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
}

export interface SetCampaignStatusRequest {
  status: CampaignStatus;
}

export interface JoinCampaignRequest {
  inviteCode: string;
}

export interface KickMemberRequest {
  userId: string;
}

export interface ReassignCharacterRequest {
  newOwnerUserId: string;
}

// === Shared Storage ===

export interface SharedStorageResponse {
  id: string;
  name: string;
  campaignId: string;
  items: ItemInstanceResponse[];
  createdAt: string;
}

export interface CreateStorageContainerRequest {
  name: string;
}

// === Character v2 ===

export type CharacterStatus = 'ACTIVE' | 'DEAD' | 'RESERVE';

export type CharacterV2Response = CharacterResponse;

export interface CreateCharacterInCampaignRequest {
  name: string;
  classId: string;
  raceId: string;
  selectedLineageId?: string | null;
  campaignId: string;
}

export interface UpdateHpRequest {
  amount: number;
}

// === Wallet & Resources ===

export interface WalletEntryResponse {
  currencyTypeId: string;
  currencyName: string;
  amount: number;
  /** Value of this stack in gold; `null` when the currency has no exchange rate. */
  goldEquivalent: number | null;
}

/**
 * Currency reference for a campaign (GET /campaigns/{id}/reference/currencies).
 * `id` is the `currencyTypeId` used by wallet operations.
 */
export interface CurrencyTypeResponse {
  id: string;
  name: string;
  exchangeRateToGold: number;
  isDefault: boolean;
}

/**
 * Wallet add/deduct request (POST /campaigns/{id}/characters/{id}/wallet).
 * `amount` is a DELTA: positive = credit (add), negative = debit (deduct).
 */
export interface ModifyWalletRequest {
  currencyTypeId: string;
  amount: number;
  /** Optional human note for the operations journal. Sent only when non-empty;
   *  backend persists it once the field is supported (forward-compatible). */
  reason?: string;
}

export interface ResourceResponse {
  id: string;
  name: string;
  /** Server field name on the battle current-turn payload (mirrors `name`). */
  resourceName?: string;
  currentValue: number;
  maxValue: number;
  resourceTypeId: string;
  /** Optional accent colour for the resource bar; `null` falls back to the theme. */
  color?: string | null;
}

/**
 * Resource change request (POST /campaigns/{id}/characters/{id}/resources).
 * `delta` is signed: negative spends, positive restores.
 */
export interface ModifyResourceRequest {
  resourceId: string;
  delta: number;
}

/**
 * Wallet transaction-log entry (GET /wallet/history).
 *
 * Diverges from the original contract on purpose, to match the live backend:
 * currencies are identified by `currencyTypeId` + `currencyName` (there is no
 * `currencyCode` in the domain), and `reason` is always `null` until the field
 * is added to the POST /wallet request. If the endpoint is absent, the journal
 * section stays hidden (404/501 → null).
 */
export interface WalletHistoryEntry {
  id: string;
  currencyTypeId: string;
  currencyName: string;
  delta: number;
  balanceAfter: number;
  reason: string | null;
  performedBy: string;
  createdAt: string; // ISO 8601
}

/**
 * Pagination envelope returned by the wallet-history endpoint. The backend
 * serves a dedicated `PageResponse` (field `page`, per the contract) rather
 * than the raw Spring `Page` (field `number`) used elsewhere in the project.
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

// === Item Instances ===

export interface ItemInstanceResponse {
  id: string;
  templateId: string;
  templateName: string;
  displayName: string;
  name?: string;
  customName?: string;
  quantity: number;
  isUnique: boolean;
  slot?: EquipmentSlot;
  notes?: string;
  rarity?: Rarity;
  enchantments: EnchantmentResponse[];
  itemTypeId?: string;
  itemTypeName?: string;
  priceGold?: number | string | null;
  templateBuffs?: BuffDebuffResponse[];
  itemBuffs?: BuffDebuffResponse[];
  artifactName?: string;
  artifactRarity?: Rarity;
}

export type GrantItemKind = 'EQUIPMENT' | 'MAGIC' | 'TEMPLATE';

export interface GrantItemRequest {
  /** Id of the catalog item to grant (equipment_item, magic_item, or legacy item_template). */
  itemId: string;
  /** Which catalog table itemId refers to. Defaults server-side to EQUIPMENT when omitted. */
  itemKind: GrantItemKind;
  quantity: number;
  customName?: string;
  isUnique?: boolean;
  buffDebuffIds?: string[];
}

export interface EquipItemRequest {
  slot: EquipmentSlot;
}

export interface RenameItemRequest {
  customName: string;
  renameEntireStack: boolean;
}

export interface TransferItemRequest {
  toCharacterId: string;
}

// === Active Effects ===

export interface CharacterActiveEffectResponse {
  id: string;
  buffDebuffId: string;
  buffDebuffName: string;
  isBuff: boolean;
  effectType: string;
  modifierValue?: number;
  targetStatName?: string;
  remainingRounds?: number;
  appliedAt: string;
  appliedByUsername: string;
}

export interface ApplyEffectRequest {
  buffDebuffId: string;
  remainingRounds?: number;
}

// === Ability Check ===

export interface AbilityCheckResponse {
  statName: string;
  baseValue: number;
  modifier: number;
  buffBonus: number;
  equipmentBonus: number;
  totalModifier: number;
}

// === XP Grant ===

export type XpTarget = 'ALL' | 'SELECTED' | 'SINGLE';

export interface GrantXpRequest {
  amount: number;
  target: XpTarget;
  characterIds?: string[];
}

// === NPC ===

export type NpcSourceType = 'CLASS_BASED' | 'MONSTER_BASED';

export interface NpcRef {
  id: string;
  name: string;
}

export interface NpcResponse {
  id: string;
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers: boolean;
  sourceType?: NpcSourceType | null;
  race?: NpcRef;
  characterClass?: NpcRef;
  level?: number;
  abilities?: string;
  spells?: NpcRef[];
  sourceMonster?: NpcRef;
  notes: NoteResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNpcRequest {
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
  sourceType?: NpcSourceType | null;
  raceId?: string;
  classId?: string;
  level?: number;
  abilities?: string;
  spellIds?: string[];
  sourceMonsterId?: string;
}

export interface UpdateNpcRequest {
  name?: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
  sourceType?: NpcSourceType | null;
  raceId?: string;
  classId?: string;
  level?: number;
  abilities?: string;
  spellIds?: string[];
  sourceMonsterId?: string;
}

export interface NoteResponse {
  id: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  content: string;
}

export interface UpdateNoteRequest {
  content: string;
}

// === Quests ===

export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'HIDDEN' | 'ARCHIVED';

export interface QuestResponse {
  id: string;
  title: string;
  description?: string;
  status: QuestStatus;
  isVisibleToPlayers: boolean;
  notes: NoteResponse[];
  rewards: QuestRewardResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestRewardResponse {
  id: string;
  type?: string;
  itemTemplateId?: string;
  itemTemplateName?: string;
  quantity?: number;
  currencyTypeId?: string;
  currencyTypeName?: string;
  currencyAmount?: number;
  xpAmount?: number;
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  status?: QuestStatus;
  isVisibleToPlayers?: boolean;
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  status?: string;
  isVisibleToPlayers?: boolean;
}

export interface CreateQuestRewardRequest {
  itemTemplateId?: string;
  quantity?: number;
  currencyTypeId?: string;
  currencyAmount?: number;
  xpAmount?: number;
}

/** POST /campaigns/{id}/quests/{questId}/complete — grant all rewards to a recipient. */
export interface CompleteQuestRequest {
  /** Required; must be a character of this campaign. */
  recipientCharacterId: string;
  /** Optional; overrides the summed reward XP. */
  xpAmount?: number;
}

export interface QuestCompletionResponse {
  questId: string;
  status: QuestStatus;
  recipientCharacterId: string;
  recipientCharacterName: string;
  itemsGranted: number;
  xpGranted: number;
}

// === Locations ===

export interface LocationResponse {
  id: string;
  name: string;
  description?: string;
  isVisibleToPlayers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  isVisibleToPlayers?: boolean;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  isVisibleToPlayers?: boolean;
}

// === GAME_MASTER Session Notes ===

export interface GmSessionNoteResponse {
  id: string;
  campaignId: string;
  authorUsername: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGmNoteRequest {
  title: string;
  content: string;
}

export interface UpdateGmNoteRequest {
  title?: string;
  content?: string;
}

// === Item Templates ===

export interface ItemTemplateResponse {
  id: string;
  name: string;
  description?: string;
  itemTypeName?: string;
  rarity: Rarity;
  damageDice?: string;
  damageBonus?: number;
  damageType?: DamageType;
  priceGold?: number | string | null;
  isStackable: boolean;
  skillName?: string;
  skillActivation?: SkillActivation;
  templateBuffs?: BuffDebuffResponse[];
  sourceHomebrewTitle?: string;
}

export interface CreateItemTemplateRequest {
  name: string;
  description?: string;
  itemTypeId?: string;
  /** Backend resolves this by slug (lowercased), e.g. 'very-rare' — not the UPPER_SNAKE enum. */
  rarity?: string;
  damageDice?: string;
  damageBonus?: number;
  damageType?: DamageType;
  priceGold?: number | string | null;
  isStackable?: boolean;
  skillId?: string;
  skillActivation?: SkillActivation;
  buffDebuffIds?: string[];
}

// === Homebrew v2 (Campaign attachment & ratings) ===

export interface CampaignHomebrewResponse {
  packageId: string;
  title: string;
  pinnedVersion?: number;
  contentSummary: HomebrewContentSummary;
}

export interface AttachHomebrewRequest {
  homebrewPackageId: string;
  pinnedVersion?: number;
}

export interface PinHomebrewVersionRequest {
  pinnedVersion: number | null;
}

export interface HomebrewRatingResponse {
  likes: number;
  dislikes: number;
  netRating: number;
  userRating?: 1 | -1;
}

export interface RateHomebrewRequest {
  rating: 1 | -1;
}

export interface TeamAvailableContentResponse {
  classes: AvailableContentEntry[];
  races: AvailableContentEntry[];
  itemTypes: AvailableContentEntry[];
  skills: AvailableContentEntry[];
  feats: AvailableContentEntry[];
}

export interface AvailableContentEntry {
  id: string;
  name: string;
  source: string;
  homebrewTitle?: string;
}

// === WebSocket ===

export type WsEventType =
  | 'ITEM_GRANTED'
  | 'ITEM_REMOVED'
  | 'BUFF_APPLIED'
  | 'BUFF_REMOVED'
  | 'XP_GRANTED'
  | 'HP_CHANGED'
  | 'CHARACTER_UPDATED'
  | 'NPC_REVEALED'
  | 'NPC_HIDDEN'
  | 'LOCATION_REVEALED'
  | 'LOCATION_HIDDEN'
  | 'MONSTER_REVEALED'
  | 'MONSTER_HIDDEN'
  | 'QUEST_UPDATED'
  | 'CAMPAIGN_STATUS_CHANGED'
  | 'MEMBER_KICKED'
  | 'WALLET_CHANGED'
  // Battle realtime — payloads carry { battleId }; REST GET is the source of truth.
  | 'BATTLE_STARTED'
  | 'BATTLE_UPDATED'
  | 'COMBATANT_JOINED'
  | 'BATTLE_TURN_CHANGED'
  | 'BATTLE_ACTION'
  | 'BATTLE_LOG_APPENDED'
  | 'COMBATANT_CONDITIONS_CHANGED'
  | 'BATTLE_ENDED'
  // Social graph — payloads carry { relationshipId, userId, username }; REST is the source of truth.
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REMOVED';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  campaignId: string;
  characterId?: string;
  data: T;
  timestamp: string;
  triggeredBy: string;
  triggeredByName?: string;
}

/** Payload of the FRIEND_* user-queue notifications (see core FriendNotificationData). */
export interface FriendEventData {
  relationshipId: string;
  userId: string;
  username: string;
}

// ── Friends (social graph) DTOs — mirror the core backend responses ──────────
export type FriendRelationshipView =
  | 'NONE'
  | 'PENDING_OUTGOING'
  | 'PENDING_INCOMING'
  | 'FRIENDS'
  | 'BLOCKED';

export type FriendRequestDirection = 'INCOMING' | 'OUTGOING';

export interface UserSearchResultResponse {
  id: string;
  username: string;
  role: string;
  relationship: FriendRelationshipView;
}

export interface FriendRequestResponse {
  relationshipId: string;
  userId: string;
  username: string;
  role: string;
  direction: FriendRequestDirection;
  createdAt: string;
}

export interface FriendResponse {
  id: string;
  username: string;
  role: string;
  friendsSince: string;
}

export interface BlockedUserResponse {
  id: string;
  username: string;
  role: string;
}

/** Payload shape shared by every battle WS event (notification only). */
export interface BattleEventData {
  battleId: string;
}

// === Battles ===

/**
 * Battle lifecycle:
 *  - ASSEMBLING — GM adds/removes monsters, tweaks XP. Players see a neutral wait state.
 *  - ACTIVE     — players join with initiative; turns advance; combat UI is live.
 *  - COMPLETED  — read-only aftermath.
 */
export type BattleStatus = 'ASSEMBLING' | 'ACTIVE' | 'COMPLETED';

export type BattleCombatantType = 'MONSTER' | 'CHARACTER';

export interface BattleCombatantResponse {
  id: string;
  type: BattleCombatantType;
  displayName: string;
  monsterId: string | null;
  characterId: string | null;
  /** Owning player for CHARACTER combatants; `null` for monsters. */
  ownerUserId: string | null;
  /** 1-based copy number when several instances of the same monster are added. */
  instanceIndex: number;
  initiative: number;
  initiativeRoll: number | null;
  turnOrder: number;
  currentHp: number | null;
  maxHp: number | null;
  currentTurn: boolean;
  // Action economy for the current turn. Actions and bonus actions are pools (max + spent);
  // legendary actions default to 0. Reactions stay a single per-round flag. Reset each turn.
  actionMax: number;
  actionSpent: number;
  bonusActionMax: number;
  bonusActionSpent: number;
  legendaryActionMax: number;
  legendaryActionSpent: number;
  reactionUsed: boolean;
  /** Live conditions on this combatant (Blinded, Prone, …); may be omitted or empty. */
  conditions?: CombatantCondition[];
  /** Death-save pips for a dying character (0 HP); both 0 for monsters and healthy characters. */
  deathSaveSuccesses?: number;
  deathSaveFailures?: number;
  /** True when the character is dead (three death-save failures). */
  dead?: boolean;
  /** True when the character is currently concentrating on a spell (Phase 2.2). */
  concentrating?: boolean;
  /** DC of a pending concentration save the player must roll (Phase 2.2); null/absent when none. */
  pendingConcentrationDc?: number | null;
  // Standard-action turn state (Phase 2.7).
  /** Dash taken: movement budget doubled this turn. */
  dashing?: boolean;
  /** Dodging: attackers have disadvantage, this combatant has advantage on Dex saves. */
  dodging?: boolean;
  /** Disengaged: movement provokes no opportunity attacks this turn. */
  disengaged?: boolean;
  /** Hidden from enemies; its next attack has advantage, then it is revealed. */
  hidden?: boolean;
  /** An ally Helped this combatant: its next attack has advantage. */
  helpAdvantage?: boolean;
  /** Monster runtime (Phase 2.9): Legendary Resistance uses per day (0 when none) and how many are spent. */
  legendaryResistanceMax?: number;
  legendaryResistanceUsed?: number;
  /** Attacks a Multiattack monster may still make this turn; null/absent for single-attack combatants. */
  attacksRemaining?: number | null;
  /** Hidden identity (Phase 2.10): players should show {@link publicName} instead of {@link displayName}. */
  identityHidden?: boolean;
  /** Generic public label shown to players when the identity is hidden. */
  publicName?: string | null;
  /** Manual GM speed override in feet (Phase 2.11); null/absent when the sheet/statblock speed applies. */
  speedOverrideFt?: number | null;
  /** Persistent flying state (Phase 2.13): the creature is aloft (stays flying between turns). */
  flying?: boolean;
  /** Can hover (from the monster statblock) — does not fall at 0 fly speed (Phase 2.13). */
  hover?: boolean;
}

/** A standard action a combatant can take on its turn (Phase 2.7). */
export type StandardActionType = 'DASH' | 'DODGE' | 'DISENGAGE' | 'HELP' | 'HIDE';

/** Forced movement kind (Phase 2.12). */
export type ForcedMoveType = 'PUSH' | 'PULL' | 'SLIDE';

/** Request to push/pull/slide a combatant (Phase 2.12). */
export interface ForcedMoveRequest {
  type: ForcedMoveType;
  targetCombatantId: string;
  toCol: number;
  toRow: number;
  fromCol?: number;
  fromRow?: number;
  maxDistanceFt?: number;
}

/** A nearby ally brought along by a teleport (Phase 2.12). */
export interface TeleportAlly {
  combatantId: string;
  toCol: number;
  toRow: number;
  fromCol?: number;
  fromRow?: number;
}

/** Request to teleport a combatant, optionally bringing nearby allies (Phase 2.12). */
export interface TeleportRequest {
  combatantId: string;
  toCol: number;
  toRow: number;
  fromCol?: number;
  fromRow?: number;
  rangeFt?: number;
  allyPickupFt?: number;
  allies?: TeleportAlly[];
}

/** An opposed melee contest (Phase 2.7). */
export type ContestType = 'GRAPPLE' | 'SHOVE';

/** Request to resolve a Grapple/Shove contest (Phase 2.7). */
export interface ContestRequest {
  type: ContestType;
  targetCombatantId: string;
  /** Manual attacker d20 (Athletics); omit for the server to roll. */
  attackerD20?: number;
  attackerBonus?: number;
  /** Manual target d20 (Athletics/Acrobatics); omit for the server to roll. */
  targetD20?: number;
  targetBonus?: number;
  /** SHOVE only: 'PRONE' (default) or 'PUSH' (forced movement, Phase 2.12). */
  shoveMode?: 'PRONE' | 'PUSH';
}

/** Result of a Grapple/Shove contest (Phase 2.7). */
export interface ContestResultResponse {
  type: string;
  attackerName: string;
  targetName: string;
  attackerRoll: number;
  attackerTotal: number;
  targetRoll: number;
  targetTotal: number;
  attackerWins: boolean;
  condition?: string | null;
  battle: BattleResponse;
}

/** Request to take a standard action (Phase 2.7). */
export interface StandardActionRequest {
  type: StandardActionType;
  /** Action-economy slot; ACTION when omitted. */
  slot?: 'ACTION' | 'BONUS_ACTION';
  /** The aided ally for HELP. */
  targetCombatantId?: string;
  /** HIDE: manual Stealth d20; omit for the server to roll. */
  stealthD20?: number;
  /** HIDE: the actor's Stealth modifier. */
  stealthBonus?: number;
  /** HIDE: contest DC (highest enemy passive Perception); omit to auto-succeed. */
  hideDc?: number;
}

/** A live condition instance on a battle combatant (Phase 1.1). */
export interface CombatantCondition {
  conditionId: string;
  code: string;
  name: string;
  sourceText: string | null;
  /** Rounds left; null = until removed. */
  remainingRounds: number | null;
}

/** Kinds of {@link BattleLogEntry} (mirrors core `BattleLogType`). */
export type BattleLogType =
  | 'ATTACK'
  | 'SAVE'
  | 'DAMAGE'
  | 'HEAL'
  | 'HP_SET'
  | 'TURN'
  | 'ROUND'
  | 'CONDITION'
  | 'EFFECT'
  | 'DEATH_SAVE'
  | 'GM_OVERRIDE'
  | 'ITEM'
  | 'SPELL';

/**
 * One persistent combat-log entry (Phase 1.2). `seq` is monotonic within a battle and drives
 * ordering + afterSeq pagination. `payload` is the parsed JSON detail (roll formula, dice, modifier)
 * the UI expands. GM_ONLY entries are never delivered to players (filtered server-side).
 */
export interface BattleLogEntry {
  id: string;
  seq: number;
  type: BattleLogType;
  actorCombatantId: string | null;
  targetCombatantId: string | null;
  payload: Record<string, unknown> | null;
  visibility: 'PUBLIC' | 'GM_ONLY';
  createdAt: string;
}

export type ActionEconomySlot = 'ACTION' | 'BONUS_ACTION' | 'LEGENDARY_ACTION' | 'REACTION';

/** Mark one of a combatant's action-economy slots as spent this turn. */
export interface SpendActionRequest {
  slot: ActionEconomySlot;
}

/** GM adjustment of a combatant's action-economy maxima (only provided pools change). */
export interface AdjustActionEconomyRequest {
  actionMax?: number;
  bonusActionMax?: number;
  legendaryActionMax?: number;
}

export interface BattleResponse {
  id: string;
  campaignId: string;
  name: string;
  status: BattleStatus;
  roundNumber: number;
  currentTurnIndex: number;
  currentCombatantId: string | null;
  monsterCount: number;
  /** Average challenge rating across the assembled monsters. */
  averageDanger: number;
  /** Auto-summed XP across monsters. */
  totalXp: number;
  /** GM manual XP override; `null` while the auto value is used. */
  overrideXp: number | null;
  combatants: BattleCombatantResponse[];
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Current-turn detail (GET /{battleId}/current-turn). `character`, `resources`
 * and `activeEffects` are present only on a CHARACTER turn the requester may see;
 * `monster` is GM-only.
 */
export interface CombatantTurnResponse {
  combatant: BattleCombatantResponse;
  character?: CharacterV2Response | null;
  resources?: ResourceResponse[] | null;
  activeEffects?: CharacterActiveEffectResponse[] | null;
  /** Spell slots (per level: max / expended / available). Null when the class has no slots. */
  spellSlots?: SpellSlotsResponse | null;
  monster?: MonsterResponse | null;
}

export interface CreateBattleRequest {
  name: string;
}

/** A single monster line: which monster and how many instances (1–50). */
export interface AddBattleMonsterEntry {
  monsterId: string;
  count: number;
}

/** Adds one or more monster instances to an ASSEMBLING battle. */
export interface AddBattleMonsterRequest {
  monsters: AddBattleMonsterEntry[];
}

export interface OverrideBattleXpRequest {
  /** `null` clears the override and reverts to the auto-summed XP. */
  overrideXp: number | null;
}

/** One character entering an ACTIVE battle. */
export interface JoinBattleCharacter {
  characterId: string;
  /** The d20 (1–20); omit to let the server roll. Initiative = d20 + DEX mod + buffs. */
  d20?: number;
}

/** A player joins an ACTIVE battle with one or more of their characters. */
export interface JoinBattleRequest {
  characters: JoinBattleCharacter[];
}

/** The active combatant strikes a target. The attacker rolls their own d20 (1–20). */
export type AttackRollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

export interface BattleAttackRequest {
  targetCombatantId: string;
  /** Attack name as shown on the character sheet / monster feature. */
  attackName: string;
  /** Roll mode; NORMAL when omitted. */
  rollMode?: AttackRollMode;
  /** Manual single d20 (NORMAL). Omit all dice to have the server roll. */
  d20?: number;
  /** Manual dice for ADVANTAGE/DISADVANTAGE (server keeps the higher/lower). */
  d20A?: number;
  d20B?: number;
  advantageReason?: string;
  /** Roll mode for the TARGET's saving throw on a save-based attack. */
  saveRollMode?: AttackRollMode;
  saveD20?: number;
  saveD20A?: number;
  saveD20B?: number;
  /** Grid squares of both tokens (Phase 2.5). All four present → server gates by distance. */
  attackerCol?: number;
  attackerRow?: number;
  targetCol?: number;
  targetRow?: number;
  /** An enemy threatens the (ranged) attacker in melee → ranged-in-melee disadvantage. */
  attackerInMeleeThreat?: boolean;
  /** Token elevations in feet for 3D distance (Phase 2.13): when both are set the range gate is 3D. */
  attackerElevationFt?: number;
  targetElevationFt?: number;
  /** GM bypass of the range gate and any range-derived disadvantage. */
  gmOverrideRange?: boolean;
  /** Target cover (Phase 2.6): HALF/THREE_QUARTERS raise AC & Dex saves; TOTAL rejects the attack. */
  cover?: CoverType;
  /** Reaction/opportunity attack (Phase 2.8): resolved out of turn, spends the reaction not the action. */
  reaction?: boolean;
  /** The reacting attacker for a reaction strike; required when {@link reaction} is true. */
  attackerCombatantId?: string;
}

/** Cover the target benefits from (Phase 2.6). */
export type CoverType = 'NONE' | 'HALF' | 'THREE_QUARTERS' | 'TOTAL';

/** GM manual HP change on a combatant: negative `delta` damages, positive heals. */
export interface ApplyCombatantHpRequest {
  delta: number;
}

export type AttackOutcome = 'HIT' | 'MISS' | 'CRIT';

/** Result of a resolved attack — roll breakdown, outcome and the target's HP after. */
export interface BattleActionResultResponse {
  attackerCombatantId: string;
  attackerName: string;
  targetCombatantId: string;
  targetName: string;
  attackName: string;
  d20: number;
  /** Roll breakdown: mode + the two dice considered + the selected d20 (advantage/disadvantage). */
  rollMode?: string | null;
  d20A?: number | null;
  d20B?: number | null;
  effectiveD20?: number | null;
  advantageReason?: string | null;
  attackBonus: number;
  total: number;
  targetAc: number;
  /** Save-based attacks: the DC, the ability the target saved with, its bonus and total. */
  saveDc?: number | null;
  saveAbility?: string | null;
  saveBonus?: number | null;
  saveTotal?: number | null;
  saveRollMode?: string | null;
  /** HIT | MISS | CRIT for attack rolls; SUCCESS | FAIL for saving throws. */
  outcome: AttackOutcome | 'SUCCESS' | 'FAIL' | string;
  /** Damage dealt; `null` on a miss. */
  damage: number | null;
  damageType: string | null;
  /** How the target's defences changed the damage: NONE | RESISTED | IMMUNE | VULNERABLE. */
  damageModifier?: string | null;
  /** Target cover applied: HALF | THREE_QUARTERS | TOTAL; null/NONE when none (Phase 2.6). */
  cover?: string | null;
  /** Chebyshev distance attacker→target in feet when positions were supplied; null otherwise (Phase 2.5). */
  distanceFt?: number | null;
  /** IN_REACH | OUT_OF_REACH | IN_RANGE | LONG_RANGE | RANGED_IN_MELEE | BEYOND_LONG_RANGE; null unchecked (Phase 2.5). */
  rangeNote?: string | null;
  targetCurrentHp: number | null;
  targetMaxHp: number | null;
  targetDown: boolean;
  /** Fresh authoritative battle state for cache sync. */
  battle: BattleResponse;
}

// === Type Aliases (backward-compat) ===

export type InventorySlotResponse = ItemInstanceResponse;
export type StorageContainerResponse = SharedStorageResponse;
export type StorageItemResponse = ItemInstanceResponse;
export type NpcNoteResponse = NoteResponse;
export type CreateNpcNoteRequest = CreateNoteRequest;
export type QuestReward = QuestRewardResponse;
export type WalletEntry = WalletEntryResponse;
export type ResourceEntry = ResourceResponse;

export type BadgeStatus = HomebrewStatus | 'DELETED' | 'ARCHIVED';

// === Race / Species (v2 backend) ===

export type RaceSourceType = 'SYSTEM' | 'HOMEBREW';

export type CreatureSize = 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'HUGE' | 'GARGANTUAN';

export const CREATURE_SIZES: CreatureSize[] = ['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'HUGE', 'GARGANTUAN'];

export type AbilityEnum = 'STRENGTH' | 'DEXTERITY' | 'CONSTITUTION' | 'INTELLIGENCE' | 'WISDOM' | 'CHARISMA';

export const ABILITY_ENUMS: AbilityEnum[] = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];

export type AbilityScoreBonusMode = 'FIXED' | 'CHOICE';

export type RaceTraitUseType = 'PASSIVE' | 'LIMITED' | 'ACTION' | 'BONUS_ACTION' | 'REACTION';

export type RaceTraitRecharge = 'NONE' | 'SHORT_REST' | 'LONG_REST' | 'PROFICIENCY_BONUS_PER_LONG_REST' | 'CUSTOM';

export type RaceTraitActionType = 'PASSIVE' | 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'PART_OF_ATTACK_ACTION';

export interface RaceSpeedProfile {
  walk: number;
  fly?: number | null;
  swim?: number | null;
  climb?: number | null;
  burrow?: number | null;
}

export interface RaceTraitUses {
  type: RaceTraitUseType;
  recharge: RaceTraitRecharge;
  amountExpression?: string | null;
}

export interface RaceTraitDamage {
  damageType: string;
  diceExpression?: string;
  bonus?: number;
}

export interface RaceTraitSavingThrow {
  ability: AbilityEnum;
  dcExpression?: string;
}

export interface RaceTrait {
  id?: string;
  name: string;
  description?: string;
  levelRequirement?: number;
  uses?: RaceTraitUses | null;
  actionType?: RaceTraitActionType;
  damage?: RaceTraitDamage | null;
  savingThrow?: RaceTraitSavingThrow | null;
  grantedSpells?: string[] | null;
  innateSpells?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface RaceLineageOption {
  id?: string;
  name: string;
  description?: string;
  traits?: RaceTrait[];
  innateSpells?: string[] | null;
  resistances?: string[];
  speedModifiers?: Partial<RaceSpeedProfile> | null;
  metadata?: Record<string, unknown> | null;
}

export interface RaceAbilityScoreBonus {
  ability?: AbilityEnum;
  bonus?: number;
  mode: AbilityScoreBonusMode;
  choiceCount?: number;
  choiceAmount?: number;
}

export interface RaceRequest {
  name: string;
  slug?: string;
  description?: string;
  loreDescription?: string;
  sourceType?: RaceSourceType;
  sourceName?: string;
  active?: boolean;
  creatureType: string;
  sizeOptions: CreatureSize[];
  defaultSize: CreatureSize;
  speed: RaceSpeedProfile;
  darkvisionRange?: number | null;
  traits?: RaceTrait[];
  lineageOptions?: RaceLineageOption[];
  lineageRequired?: boolean;
  languages?: string[];
  languageOptions?: string[] | null;
  proficiencies?: string[];
  resistances?: string[];
  vulnerabilities?: string[];
  immunities?: string[];
  conditionResistances?: string[];
  conditionAdvantages?: string[];
  innateSpells?: string[] | null;
  allowAbilityScoreBonuses?: boolean;
  abilityScoreBonuses?: RaceAbilityScoreBonus[];
  metadata?: Record<string, unknown> | null;
}

export interface RaceResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  loreDescription?: string;
  sourceType: RaceSourceType;
  sourceName?: string;
  active: boolean;
  creatureType: string;
  sizeOptions: CreatureSize[];
  defaultSize: CreatureSize;
  speed: RaceSpeedProfile;
  darkvisionRange?: number | null;
  traits: RaceTrait[];
  lineageOptions: RaceLineageOption[];
  lineageRequired: boolean;
  languages: string[];
  languageOptions?: string[] | null;
  proficiencies: string[];
  resistances: string[];
  vulnerabilities: string[];
  immunities: string[];
  conditionResistances: string[];
  conditionAdvantages: string[];
  innateSpells?: string[] | null;
  allowAbilityScoreBonuses: boolean;
  abilityScoreBonuses: RaceAbilityScoreBonus[];
  metadata?: Record<string, unknown> | null;
  homebrewPackageId?: string;
  homebrewPackageTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RaceSnapshot {
  raceId: string;
  raceName: string;
  lineageId?: string | null;
  lineageName?: string | null;
  size: CreatureSize;
  speed: RaceSpeedProfile;
  darkvisionRange?: number | null;
  traitNames: string[];
  allowAbilityScoreBonuses: boolean;
}

export interface CharacterRaceBriefResponse {
  id: string;
  name: string;
  description?: string;
}

// ============================================================
// Bestiary (monsters + dictionaries) — bestiary-api-contracts
// Reuses existing CreatureSize / AbilityEnum / DamageType.
// ============================================================

export type MonsterScope = 'SYSTEM' | 'HOMEBREW' | 'CAMPAIGN';

/** Dictionary kind slugs (§0.6). `bookCode` is only meaningful for `sources`. */
export type DictionaryKind =
  | 'creature-types'
  | 'alignments'
  | 'languages'
  | 'sense-types'
  | 'movement-types'
  | 'habitats'
  | 'treasure-tags'
  | 'conditions'
  | 'gear-items'
  | 'sources'
  | 'sizes'
  | 'abilities'
  | 'damage-types';

export interface DictionaryEntryRequest {
  code: string;
  nameRusloc: string;
  nameEngloc?: string;
  /** Only for kind=sources, ≤20. Ignored otherwise. */
  bookCode?: string;
  isUnique?: boolean;
}

export interface DictionaryEntryResponse {
  id: string;
  code: string;
  nameRusloc: string;
  nameEngloc?: string | null;
  bookCode?: string | null;
  homebrewId?: string | null;
  isUnique: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Expanded reference inside a MonsterResponse. */
export interface DictionaryRef {
  id: string;
  code: string;
  name?: string | null;
  nameRusloc: string;
  nameEngloc?: string | null;
  homebrewId?: string | null;
}

export interface MonsterSummaryResponse {
  id: string;
  slug: string;
  name?: string | null;
  nameRusloc: string;
  nameEngloc?: string | null;
  size: DictionaryRef;
  crRating: string;
  crValue: number;
  scope: MonsterScope;
  homebrewId: string | null;
  campaignId: string | null;
  isVisibleToPlayers: boolean;
  isActive: boolean;
  sourceMonsterId?: string | null;
}

// --- MonsterResponse nested rows (each has its own id) ---
export interface MonsterSpeedRow {
  id: string;
  movementType: DictionaryRef;
  ft: number;
  hover: boolean;
}
export interface MonsterSenseRow {
  id: string;
  senseType: DictionaryRef;
  ft: number;
}
export interface MonsterSaveRow {
  id: string;
  ability: DictionaryRef;
  bonus: number;
}
export interface MonsterSkillRow {
  id: string;
  proficiencySkillId: string;
  skillName: string;
  bonus: number;
}
export interface MonsterDamageNoteRow {
  id: string;
  damageType: DictionaryRef | null;
  note: string | null;
}
export interface MonsterGearRow {
  id: string;
  item: DictionaryRef;
  qty: number;
}
export interface MonsterFeatureDamageRow {
  id: string;
  sortOrder: number;
  average: number | null;
  dice: string | null;
  damageType: DictionaryRef | null;
  note: string | null;
}
export interface MonsterFeatureRow {
  id: string;
  section: string;
  sortOrder: number;
  name?: string | null;
  nameRusloc: string;
  nameEngloc?: string | null;
  kind: string;
  rechargeMin?: number | null;
  rechargeMax?: number | null;
  description?: string | null;
  descriptionRusloc: string;
  descriptionEngloc?: string | null;
  attackType?: string | null;
  attackBonus?: number | null;
  reachFt?: number | null;
  rangeFt?: number | null;
  rangeLongFt?: number | null;
  saveAbility?: DictionaryRef | null;
  saveDc?: number | null;
  damages: MonsterFeatureDamageRow[];
}

export interface MonsterResponse {
  id: string;
  slug: string;
  sourceExternalId?: string | null;
  scope: MonsterScope;
  homebrewId: string | null;
  campaignId: string | null;
  sourceMonsterId: string | null;
  name?: string | null;
  nameRusloc: string;
  nameEngloc?: string | null;
  alignment: DictionaryRef | null;
  size: DictionaryRef;
  sizeSecondary: DictionaryRef | null;
  isSwarm: boolean;
  swarmSize: DictionaryRef | null;
  armorClass: number;
  armorClassText?: string | null;
  initiativeBonus?: number | null;
  initiativeScore?: number | null;
  hpAverage?: number | null;
  hpDiceCount?: number | null;
  hpDiceSides?: number | null;
  hpDiceModifier?: number | null;
  hpFormula?: string | null;
  strScore: number;
  dexScore: number;
  conScore: number;
  intScore: number;
  wisScore: number;
  chaScore: number;
  passivePerception?: number | null;
  telepathyFt?: number | null;
  crRating: string;
  crValue: number;
  xpBase?: number | null;
  xpLair?: number | null;
  proficiencyBonus?: number | null;
  legendaryUsesBase?: number | null;
  legendaryUsesLair?: number | null;
  legendaryText?: string | null;
  loreText?: string | null;
  isVisibleToPlayers: boolean;
  isActive: boolean;
  creatureTypes: DictionaryRef[];
  languages: DictionaryRef[];
  conditionImmunities: DictionaryRef[];
  habitats: DictionaryRef[];
  treasureTags: DictionaryRef[];
  sources: DictionaryRef[];
  speeds: MonsterSpeedRow[];
  senses: MonsterSenseRow[];
  savingThrows: MonsterSaveRow[];
  skillProficiencies: MonsterSkillRow[];
  damageResistances: MonsterDamageNoteRow[];
  damageImmunities: MonsterDamageNoteRow[];
  damageVulnerabilities: MonsterDamageNoteRow[];
  gear: MonsterGearRow[];
  features: MonsterFeatureRow[];
  createdBy?: string;
  createdByUsername?: string;
  updatedBy?: string;
  updatedByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

// --- MonsterRequest nested entries (rebuild-semantics on PUT) ---
export interface MonsterSpeedRequest {
  movementTypeId: string;
  ft: number;
  hover?: boolean;
}
export interface MonsterSenseRequest {
  senseTypeId: string;
  ft: number;
}
export interface MonsterSaveRequest {
  abilityId: string;
  bonus: number;
}
export interface MonsterSkillRequest {
  proficiencySkillId: string;
  bonus: number;
}
export interface MonsterDamageNoteRequest {
  damageTypeId?: string | null;
  note?: string | null;
}
export interface MonsterGearRequest {
  itemId: string;
  qty?: number;
}
export interface MonsterFeatureDamageRequest {
  sortOrder: number;
  average?: number | null;
  dice?: string | null;
  damageTypeId?: string | null;
  note?: string | null;
}
export interface MonsterFeatureRequest {
  section: string;
  sortOrder: number;
  nameRusloc?: string;
  nameEngloc?: string;
  kind: string;
  rechargeMin?: number | null;
  rechargeMax?: number | null;
  descriptionRusloc: string;
  descriptionEngloc?: string;
  attackType?: string | null;
  attackBonus?: number | null;
  reachFt?: number | null;
  rangeFt?: number | null;
  rangeLongFt?: number | null;
  saveAbilityId?: string | null;
  saveDc?: number | null;
  damages?: MonsterFeatureDamageRequest[];
}

export interface MonsterRequest {
  slug?: string;
  nameRusloc: string;
  nameEngloc?: string;
  alignmentId?: string | null;
  sizeId: string;
  sizeSecondaryId?: string | null;
  isSwarm?: boolean;
  swarmSizeId?: string | null;
  armorClass: number;
  armorClassText?: string;
  initiativeBonus?: number | null;
  initiativeScore?: number | null;
  hpAverage?: number | null;
  hpDiceCount?: number | null;
  hpDiceSides?: number | null;
  hpDiceModifier?: number | null;
  hpFormula?: string;
  strScore: number;
  dexScore: number;
  conScore: number;
  intScore: number;
  wisScore: number;
  chaScore: number;
  passivePerception?: number | null;
  telepathyFt?: number | null;
  crRating: string;
  crValue: number;
  xpBase?: number | null;
  xpLair?: number | null;
  proficiencyBonus?: number | null;
  legendaryUsesBase?: number | null;
  legendaryUsesLair?: number | null;
  legendaryText?: string;
  loreText?: string;
  isVisibleToPlayers?: boolean;
  isActive?: boolean;
  creatureTypeIds?: string[];
  languageIds?: string[];
  conditionImmunityIds?: string[];
  habitatIds?: string[];
  treasureTagIds?: string[];
  sourceIds?: string[];
  speeds?: MonsterSpeedRequest[];
  senses?: MonsterSenseRequest[];
  savingThrows?: MonsterSaveRequest[];
  skillProficiencies?: MonsterSkillRequest[];
  damageResistances?: MonsterDamageNoteRequest[];
  damageImmunities?: MonsterDamageNoteRequest[];
  damageVulnerabilities?: MonsterDamageNoteRequest[];
  gear?: MonsterGearRequest[];
  features?: MonsterFeatureRequest[];
}

// ═══════════════════════════════════════════════════════════
// Campaign Blueprints (UI: «Шаблоны кампаний»)
// A reusable, publishable campaign skeleton: lore + universe + narrative
// (NPCs / quests / locations) + attached homebrew + pre-built characters.
// `template` is intentionally avoided — that term is taken by character
// templates. The domain entity here is CampaignBlueprint.
// ═══════════════════════════════════════════════════════════

export interface UniverseResponse {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateUniverseRequest {
  slug: string;
  name: string;
  description?: string;
}

export type CampaignBlueprintStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CampaignBlueprintSort = 'downloads' | 'newest' | 'oldest';

export interface CampaignBlueprintResponse {
  id: string;
  title: string;
  loreDescription?: string;
  universeSlug: string;
  universeName: string;
  status: CampaignBlueprintStatus;
  version: number;
  allowForks: boolean;
  downloadCount: number;
  authorUsername: string;
  coverUrl?: string;
  tags?: string[];
  createdAt: string;
  publishedAt?: string;
  isDeleted: boolean;
  /** Set on forked blueprints — the marketplace blueprint it was copied from. */
  parentId?: string;
  /** Version of the parent at the moment of the fork. */
  originVersion?: number;
}

/* Blueprint sub-entities mirror the campaign Npc/Quest/Location DTOs but carry
   no campaign_id — they live inside a blueprint, not a running campaign. */

export interface BlueprintNpcResponse {
  id: string;
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers: boolean;
  sourceType?: NpcSourceType | null;
  race?: NpcRef;
  characterClass?: NpcRef;
  level?: number;
  abilities?: string;
  spells?: NpcRef[];
  sourceMonster?: NpcRef;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlueprintNpcRequest {
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
  sourceType?: NpcSourceType | null;
  raceId?: string;
  classId?: string;
  level?: number;
  abilities?: string;
  spellIds?: string[];
  sourceMonsterId?: string;
}

export interface UpdateBlueprintNpcRequest {
  name?: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
  sourceType?: NpcSourceType | null;
  raceId?: string;
  classId?: string;
  level?: number;
  abilities?: string;
  spellIds?: string[];
  sourceMonsterId?: string;
}

export interface BlueprintQuestResponse {
  id: string;
  title: string;
  description?: string;
  status: QuestStatus;
  isVisibleToPlayers: boolean;
  rewards: QuestRewardResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlueprintQuestRequest {
  title: string;
  description?: string;
  status?: QuestStatus;
  isVisibleToPlayers?: boolean;
}

export interface UpdateBlueprintQuestRequest {
  title?: string;
  description?: string;
  status?: string;
  isVisibleToPlayers?: boolean;
}

export interface BlueprintLocationResponse {
  id: string;
  name: string;
  description?: string;
  isVisibleToPlayers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlueprintLocationRequest {
  name: string;
  description?: string;
  isVisibleToPlayers?: boolean;
}

export interface UpdateBlueprintLocationRequest {
  name?: string;
  description?: string;
  isVisibleToPlayers?: boolean;
}

export interface CampaignBlueprintDetailResponse extends CampaignBlueprintResponse {
  npcs: BlueprintNpcResponse[];
  quests: BlueprintQuestResponse[];
  locations: BlueprintLocationResponse[];
  homebrew: CampaignHomebrewResponse[];
  preBuiltCharacters: CharacterResponse[];
}

export interface CreateCampaignBlueprintRequest {
  title: string;
  loreDescription?: string;
  universeId: string;
  allowForks?: boolean;
  coverUrl?: string;
}

export interface UpdateCampaignBlueprintRequest {
  title?: string;
  loreDescription?: string;
  universeId?: string;
  allowForks?: boolean;
  coverUrl?: string;
  tags?: string[];
}

/** POST /campaign-blueprints/{id}/instantiate → CampaignResponse. */
export interface InstantiateBlueprintRequest {
  name: string;
  description?: string;
}

// ============================================================================
// Content Catalog (PHB 2024 normalized read model) — feats / spells /
// backgrounds / equipment / magic items. Read-only. See
// prompts/2026-06-19/00-14-content-catalog-api.md. Reuses ContentLabel above.
// Nullable single-FK objects per contract; BigDecimal fields arrive as strings.
// ============================================================================

// ---------- Feat ----------
export interface FeatPrerequisite {
  type: string | null;
  levelRequired: number | null;
  abilityScore: ContentLabel | null;
  minimumScore: number | null;
  groupKey: string | null;
  rawText: string | null;
}
export interface FeatSection {
  title: string | null;
  body: string | null;
}
export interface FeatDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  description: string | null;
  repeatable: boolean | null;
  packageId: string | null;
  category: ContentLabel | null;
  prerequisites: FeatPrerequisite[];
  sections: FeatSection[];
}

// ---------- Spell ----------
export interface SpellComponent {
  component: string | null;
  materialText: string | null;
  consumed: boolean | null;
}
export interface SpellDamage {
  dice: string | null;
  damageType: ContentLabel | null;
  raw: string | null;
}
export interface SpellHealing {
  dice: string | null;
  flat: number | null;
  raw: string | null;
}
export interface SpellDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  level: number | null;
  school: ContentLabel | null;
  castingTimeRaw: string | null;
  castingActionSlug: string | null;
  ritual: boolean | null;
  rangeType: string | null;
  rangeDistance: number | null;
  rangeUnit: string | null;
  durationRaw: string | null;
  durationType: string | null;
  durationAmount: number | null;
  durationUnit: string | null;
  concentration: boolean | null;
  saveAbility: string | null;
  attackRoll: boolean | null;
  checkAbility: string | null;
  checkSkill: string | null;
  description: string | null;
  higherLevels: string | null;
  packageId: string | null;
  warning: boolean | null;
  warningReason: string | null;
  components: SpellComponent[];
  damage: SpellDamage[];
  healing: SpellHealing[];
  classes: ContentLabel[];
  subclasses: ContentLabel[];
  /** Bestiary statblocks this summon spell references; empty for non-summon spells. */
  summonedMonsters: SummonedMonster[];
}

/** A bestiary statblock referenced by a summon spell (link target for the detail view). */
export interface SummonedMonster {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  crRating: string | null;
}

/** Admin review row for a spell flagged as needing manual resolution. */
export interface SpellWarningResponse {
  id: string;
  slug: string;
  name: string;
  level: number | null;
  schoolName: string | null;
  saveAbility: string | null;
  attackRoll: boolean | null;
  warning: boolean | null;
  warningReason: string | null;
  description: string | null;
}
/** Admin correction of a spell's parsed resolution. */
export interface SpellResolutionRequest {
  saveAbility?: string | null;
  attackRoll?: boolean;
  warning?: boolean;
}

/** Admin review row for a class feature flagged as needing manual mechanics review. */
export interface ClassFeatureWarningResponse {
  id: string;
  slug: string;
  title: string;
  className: string | null;
  subclassName: string | null;
  level: number | null;
  activationType: string | null;
  attackRoll: boolean | null;
  saveAbility: string | null;
  damageDice: string | null;
  damageType: string | null;
  healingDice: string | null;
  healingFlat: number | null;
  warning: boolean | null;
  warningReason: string | null;
  description: string | null;
}

/** Admin correction of a class feature's parsed mechanics. */
export interface ClassFeatureResolutionRequest {
  activationType?: string | null;
  attackRoll?: boolean;
  saveAbility?: string | null;
  damageDice?: string | null;
  damageType?: string | null;
  healingDice?: string | null;
  healingFlat?: number | null;
  warning?: boolean;
}

/** One damage row in the admin spell editor. `damageTypeSlug` refs /reference/damage-types. */
export interface SpellDamageEditRow {
  dice?: string | null;
  damageTypeSlug?: string | null;
  raw?: string | null;
}

/** One healing row in the admin spell editor. */
export interface SpellHealingEditRow {
  dice?: string | null;
  flat?: number | null;
  raw?: string | null;
}

/**
 * Full admin edit of a spell's combat resolution (PUT /admin/content/spells/:id).
 * `damages`/`healings` replace the current sets wholesale; omit to leave untouched.
 */
export interface UpdateSpellRequest {
  saveAbility?: string | null;
  attackRoll?: boolean;
  checkAbility?: string | null;
  checkSkill?: string | null;
  warning?: boolean;
  damages?: SpellDamageEditRow[];
  healings?: SpellHealingEditRow[];
}

// ---------- Species (2024 race model) ----------
export interface SpeciesSpeed {
  type: string | null;
  amountFt: number | null;
  rawText: string | null;
}
export interface SpeciesTraitEffect {
  effectType: string | null;
  damageType: ContentLabel | null;
  spell: ContentLabel | null;
  rangeFt: number | null;
}
export interface SpeciesTrait {
  slug: string | null;
  name: string | null;
  description: string | null;
  effects: SpeciesTraitEffect[];
}
export interface SpeciesDetail {
  id: string;
  slug: string | null;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  description: string | null;
  packageId: string | null;
  creatureType: ContentLabel | null;
  sizeOptions: ContentLabel[];
  speeds: SpeciesSpeed[];
  traits: SpeciesTrait[];
}

// ---------- Background ----------
export interface BackgroundFeatOption {
  feat: ContentLabel | null;
  featCategory: ContentLabel | null;
  chooseCount: number | null;
  selectedOptionRaw: string | null;
  recommendedFeat: ContentLabel | null;
  rawText: string | null;
}
export interface BackgroundToolProficiency {
  equipmentItemId: string | null;
  chooseCount: number | null;
  choiceGroupSlug: string | null;
  rawText: string | null;
}
export interface BackgroundLanguageProficiency {
  languageSlug: string | null;
  chooseCount: number | null;
  rawText: string | null;
}
export interface BackgroundEquipmentEntry {
  entryType: string | null;
  equipmentItemId: string | null;
  moneyValueId: string | null;
  quantity: string | null;
  quantityUnitRaw: string | null;
  variantNote: string | null;
  choiceRef: string | null;
  rawText: string | null;
}
export interface BackgroundEquipmentOption {
  optionCode: string | null;
  sortOrder: number | null;
  rawText: string | null;
  entries: BackgroundEquipmentEntry[];
}
export interface BackgroundEquipmentGroup {
  groupSlug: string | null;
  chooseCount: number | null;
  rawText: string | null;
  options: BackgroundEquipmentOption[];
}
export interface BackgroundDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  description: string | null;
  url: string | null;
  packageId: string | null;
  grantedFeat: ContentLabel | null;
  abilityOptions: ContentLabel[];
  skillProficiencies: ContentLabel[];
  featOptions: BackgroundFeatOption[];
  toolProficiencies: BackgroundToolProficiency[];
  languageProficiencies: BackgroundLanguageProficiency[];
  equipmentChoiceGroups: BackgroundEquipmentGroup[];
}

// ---------- Equipment Item ----------
export interface DiceFormula {
  diceCount: number | null;
  dieSize: number | null;
  bonus: number | null;
  rawText: string | null;
}
export interface EquipmentCost {
  amount: string | null;
  currency: ContentLabel | null;
  copperValue: string | null;
  rawText: string | null;
}
export interface WeaponStat {
  damageDice: DiceFormula | null;
  damageType: ContentLabel | null;
  flatDamage: number | null;
  mastery: ContentLabel | null;
}
export interface ArmorStat {
  baseAc: number | null;
  dexBonusAllowed: boolean | null;
  maxDexBonus: number | null;
  strengthRequired: number | null;
  stealthDisadvantage: boolean | null;
  armorClassRaw: string | null;
}
export interface WeaponItemProperty {
  property: ContentLabel | null;
  normalRangeFt: number | null;
  longRangeFt: number | null;
  versatileDice: DiceFormula | null;
  ammunitionEquipmentItemId: string | null;
  rawText: string | null;
}
export interface EquipmentItemDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  kind: string;
  category: ContentLabel | null;
  cost: EquipmentCost | null;
  weightLb: string | null;
  propertiesText: string | null;
  url: string | null;
  packageId: string | null;
  weaponStat: WeaponStat | null;
  armorStat: ArmorStat | null;
  weaponProperties: WeaponItemProperty[];
}

// ---------- Magic Item ----------
export interface MagicItemCost {
  amount: string | null;
  currency: ContentLabel | null;
  copperValue: string | null;
  rawText: string | null;
}
export interface MagicItemAllowedEquipment {
  equipment: ContentLabel | null;
  rawText: string | null;
}
export interface MagicItemDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string | null;
  type: ContentLabel | null;
  typeRestrictionRaw: string | null;
  rarity: ContentLabel | null;
  variableRarity: boolean | null;
  attunementRequired: boolean | null;
  attunementRequirement: string | null;
  cost: MagicItemCost | null;
  description: string | null;
  embeddedTablesDetected: boolean | null;
  url: string | null;
  packageId: string | null;
  allowedEquipment: MagicItemAllowedEquipment[];
}

/* ── Feature rules runtime (Rule Workbench) ─────────────────────────────── */

export type FeatureRuleReviewStatus = 'draft' | 'needs_review' | 'approved' | 'disabled';
export type FeatureRuleSeverity = 'info' | 'warn' | 'error';

export interface CodeLabel {
  code: string;
  label: string;
}

export interface FeatureRuleMetadata {
  ruleTypes: CodeLabel[];
  reviewStatuses: CodeLabel[];
  severities: CodeLabel[];
  issueTypes: CodeLabel[];
  sources: CodeLabel[];
}

export interface FeatureRuleResponse {
  id: string;
  ownerType: string;
  ownerId: string;
  ruleType: string;
  ruleTypeLabel: string;
  enabled: boolean;
  reviewStatus: FeatureRuleReviewStatus;
  confidence: number | null;
  source: string;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  currentRevisionId: string | null;
  approvedRevisionId: string | null;
  currentRevisionNumber: number | null;
  approvedRevisionNumber: number | null;
  revisionCount: number;
  rulesetId: string | null;
  ruleSourceId: string | null;
  priority: number | null;
  openIssueCount: number;
  hasUnresolvedError: boolean;
}

export interface FeatureRuleRevisionResponse {
  id: string;
  featureRuleId: string;
  revisionNumber: number;
  status: FeatureRuleReviewStatus;
  rulePayloadSnapshot: string | null;
  changeReason: string | null;
  createdBy: string | null;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  disabledBy: string | null;
  disabledAt: string | null;
  current: boolean;
  approvedActive: boolean;
}

export interface RulesetOption {
  id: string;
  key: string;
  displayName: string;
  edition: string | null;
  enabled: boolean;
}

export interface RuleSourceOption {
  id: string;
  key: string;
  displayName: string;
  sourceType: string | null;
  rulesetId: string | null;
}

export interface RevisionActionRequest {
  targetRevisionId?: string;
  changeReason?: string;
}

export interface FeatureRuleIssueResponse {
  id: string;
  ownerType: string;
  ownerId: string;
  featureRuleId: string | null;
  issueType: string;
  severity: FeatureRuleSeverity;
  message: string;
  sourceTextFragment: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featureTitle: string | null;
  className: string | null;
  subclassName: string | null;
  level: number | null;
}

export interface ProblemFeatureSummary {
  featureId: string;
  slug: string;
  title: string;
  className: string | null;
  subclassName: string | null;
  level: number | null;
  ruleCount: number;
  approvedRuleCount: number;
  issueCount: number;
  openIssueCount: number;
  hasUnresolvedError: boolean;
  maxOpenSeverity: FeatureRuleSeverity | null;
}

export interface FeatureGrantSummary {
  id: string;
  featureRuleId: string;
  kind: 'proficiency' | 'language';
  proficiencyType: string | null;
  targetId: string | null;
  languageId: string | null;
  expertise: boolean;
  grantTiming: string | null;
  filterRuleId: string | null;
}

export interface FeatureChoiceOptionSummary {
  id: string;
  optionType: string;
  targetEntityId: string | null;
  filterRuleId: string | null;
  sortOrder: number | null;
}

export interface FeatureChoiceSummary {
  id: string;
  featureRuleId: string;
  choiceKey: string;
  minChoices: number | null;
  maxChoicesFormulaId: string | null;
  choiceTiming: string | null;
  replacePolicy: string | null;
  options: FeatureChoiceOptionSummary[];
}

export interface FeatureRuleDetail {
  featureId: string;
  slug: string;
  title: string;
  className: string | null;
  subclassName: string | null;
  level: number | null;
  description: string | null;
  rules: FeatureRuleResponse[];
  issues: FeatureRuleIssueResponse[];
  grants: FeatureGrantSummary[];
  choices: FeatureChoiceSummary[];
}

export interface FeatureRuleValidationResponse {
  valid: boolean;
  problems: string[];
}

/* ── Formula engine (Stage 3) ── */

export type FormulaResultType = 'integer' | 'decimal' | 'boolean' | 'duration' | 'dice' | 'modifier';
export type FormulaRoundingMode = 'floor' | 'ceil' | 'nearest' | 'none';

export interface FormulaContextPayload {
  scalars?: Record<string, number>;
  classLevels?: Record<string, number>;
  abilityMods?: Record<string, number>;
  resourceCounts?: Record<string, number>;
  targetConditions?: Record<string, boolean>;
}

export interface FeatureFormulaValidateRequest {
  expression: string;
  resultType: FormulaResultType;
}

export interface FeatureFormulaValidation {
  valid: boolean;
  message: string;
  requiredContext: string[] | null;
  sampleResult: string | null;
}

export interface FeatureFormulaEvaluateRequest {
  expression: string;
  resultType: FormulaResultType;
  roundingMode?: FormulaRoundingMode;
  minValue?: number;
  maxValue?: number;
  context?: FormulaContextPayload;
}

export interface FeatureFormulaEvaluateResult {
  ok: boolean;
  message: string | null;
  resultType: string;
  displayValue: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  diceValue: string | null;
}

export interface CreateFeatureRuleRequest {
  ruleType: string;
  enabled?: boolean;
  sortOrder?: number;
  notes?: string;
}

export interface UpdateFeatureRuleRequest {
  ruleType?: string;
  enabled?: boolean;
  sortOrder?: number;
  notes?: string;
  confidence?: number;
}

export interface CreateFeatureRuleIssueRequest {
  featureRuleId?: string | null;
  issueType: string;
  severity: FeatureRuleSeverity;
  message: string;
  sourceTextFragment?: string;
}
