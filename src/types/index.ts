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
}

export interface RewardSelection {
  rewardType: string;
  rewardEntryId: string;
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
}

export interface LevelUpResultResponse {
  newTotalLevel: number;
  classLeveled: string;
  newClassLevel: number;
  hpIncrease?: number;
  newMaxHp?: number;
  rewardsAcquired: AcquiredRewardSummary[];
}

export interface AcquiredRewardSummary {
  rewardType: string;
  name: string;
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
}

export interface ResourceResponse {
  resourceTypeId: string;
  resourceName: string;
  currentValue: number;
  maxValue: number;
}

export interface ModifyResourceRequest {
  resourceTypeId: string;
  currentValue: number;
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

export interface NpcResponse {
  id: string;
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers: boolean;
  notes: NoteResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNpcRequest {
  name: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
}

export interface UpdateNpcRequest {
  name?: string;
  publicDescription?: string;
  privateDescription?: string;
  isVisibleToPlayers?: boolean;
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
  | 'QUEST_UPDATED'
  | 'CAMPAIGN_STATUS_CHANGED'
  | 'MEMBER_KICKED'
  | 'WALLET_CHANGED';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  campaignId: string;
  characterId?: string;
  data: T;
  timestamp: string;
  triggeredBy: string;
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
