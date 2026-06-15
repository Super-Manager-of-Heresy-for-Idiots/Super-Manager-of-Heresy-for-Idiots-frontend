// === Enums / Unions ===

export type Role = 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'MAIN_HAND' |
  'OFF_HAND' | 'RING_LEFT' | 'RING_RIGHT' | 'NECK' | 'CLOAK';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY';

export type DamageType = 'SLASHING' | 'PIERCING' | 'BLUDGEONING' | 'FIRE' | 'COLD' |
  'LIGHTNING' | 'POISON' | 'NECROTIC' | 'RADIANT' | 'PSYCHIC' | 'FORCE' | 'THUNDER' | 'ACID';

export type SkillActivation = 'PASSIVE' | 'ACTIVE';

export type RewardType = 'SKILL' | 'SUBCLASS' | 'FEAT' | 'BUFF_DEBUFF';
export type RichClassRewardType = 'SKILL' | 'FEAT' | 'SUBCLASS' | 'BUFF_DEBUFF';
export type SkillEffectRole = 'BUFF' | 'DEBUFF';

export type CampaignRole = 'GAME_MASTER' | 'PLAYER';

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

export interface LevelUpRequest {
  classId: string;
  selections: RewardSelection[];
  // Required when the new class level grants an ABILITY_SCORE_IMPROVEMENT.
  abilityScoreImprovement?: AbilityScoreImprovementRequest;
}

export interface RewardSelection {
  rewardType: string;
  rewardEntryId: string;
}

export interface AbilityScoreImprovementRequest {
  increases: StatIncrease[];
}

export interface StatIncrease {
  statTypeId: string;  // matches AbilityOption.statTypeId
  amount: number;      // 1 or 2; total across increases must equal asiPointsTotal
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

export interface RewardGroup {
  rewardType: string;
  isChoice: boolean;
  rewards: RewardEntry[];
}

export interface RewardEntry {
  rewardEntryId: string;
  rewardId: string;
  name: string;
  description?: string;
  alreadyAcquired: boolean;
  // Structured mechanics for richer display. Optional; backend may omit.
  detail?: RewardDetail;
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
  rewardsAcquired: AcquiredRewardSummary[];
  proficiencyBonusBefore?: number;
  proficiencyBonusAfter?: number;
}

export interface AcquiredRewardSummary {
  rewardType: string;
  name: string;
  description?: string;
  detail?: RewardDetail;
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
  level: number;
  school?: string;
  description?: string;
  availableToClassIds?: string[];
}

export interface CharacterClassDetailResponse {
  id: string;
  name: string;
  description?: string;
  hitDie?: number;
  primaryAbilityStatId?: string;
  savingThrowStatNames?: string[];
  skillChoiceCount?: number;
  skillChoiceOptions?: ProficiencySkillResponse[];
  armorWeaponProficiencies?: string;
  spellcasting?: {
    isSpellcaster?: boolean;
    spellcastingStatId?: string;
    spellcastingStatName?: string;
    hasCantrips?: boolean;
    isHalfCaster?: boolean;
  };
}

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
  createdAt: string;
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

export interface RichClassSkillEffectRequest {
  effectRole: SkillEffectRole;
  chancePercent: number;
  buffDebuffId?: string;
  buffDebuff?: CreateBuffDebuffRequest;
}

export interface RichClassSkillRequest extends CreateSkillRequest {
  effects?: RichClassSkillEffectRequest[];
}

export interface RichClassSubclassRequest {
  name: string;
  description?: string;
}

export interface RichClassRewardRequest {
  rewardType: RichClassRewardType;
  isChoice: boolean;
  rewardId?: string;
  skill?: RichClassSkillRequest;
  feat?: CreateFeatRequest;
  subclass?: RichClassSubclassRequest;
  buffDebuff?: CreateBuffDebuffRequest;
}

export interface RichClassLevelRequest {
  level: number;
  rewards: RichClassRewardRequest[];
}

export interface CreateRichCharacterClassRequest {
  name: string;
  description?: string;
  levels: RichClassLevelRequest[];
}

export interface RichCharacterClassResponse {
  characterClass: CharacterClassResponse;
  rewards: ClassLevelRewardResponse[];
  createdContent: Partial<Record<ContentType, ContentSummaryDto[]>>;
  packageDetail?: HomebrewDetailResponse | null;
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

export interface CharacterV2Response extends CharacterResponse {}

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
  artifactName?: string;
  artifactRarity?: Rarity;
}

export interface GrantItemRequest {
  templateId: string;
  quantity: number;
  customName?: string;
  isUnique?: boolean;
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
  isStackable: boolean;
  skillName?: string;
  skillActivation?: SkillActivation;
  sourceHomebrewTitle?: string;
}

export interface CreateItemTemplateRequest {
  name: string;
  description?: string;
  itemTypeId?: string;
  rarity: Rarity;
  damageDice?: string;
  damageBonus?: number;
  damageType?: DamageType;
  isStackable?: boolean;
  skillId?: string;
  skillActivation?: SkillActivation;
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
  | 'BATTLE_ENDED';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  campaignId: string;
  characterId?: string;
  data: T;
  timestamp: string;
  triggeredBy: string;
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
  nameRusloc: string;
  nameEngloc?: string | null;
  homebrewId?: string | null;
}

export interface MonsterSummaryResponse {
  id: string;
  slug: string;
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
  nameRusloc: string;
  nameEngloc?: string | null;
  kind: string;
  rechargeMin?: number | null;
  rechargeMax?: number | null;
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
