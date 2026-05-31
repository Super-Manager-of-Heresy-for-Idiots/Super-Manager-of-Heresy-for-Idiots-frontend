// === Enums / Unions ===

export type Role = 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'MAIN_HAND' |
  'OFF_HAND' | 'RING_LEFT' | 'RING_RIGHT' | 'NECK' | 'CLOAK';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY';

export type DamageType = 'SLASHING' | 'PIERCING' | 'BLUDGEONING' | 'FIRE' | 'COLD' |
  'LIGHTNING' | 'POISON' | 'NECROTIC' | 'RADIANT' | 'PSYCHIC' | 'FORCE' | 'THUNDER' | 'ACID';

export type SkillActivation = 'PASSIVE' | 'ACTIVE';

export type RewardType = 'SKILL' | 'SUBCLASS' | 'FEAT';

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
  campaignId: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  raceId?: string;
}

export interface CharacterResponse {
  id: string;
  name: string;
  totalLevel: number;
  experience: number;
  classLevels: ClassLevelResponse[];
  race: CharacterRaceResponse;
  teamId: string;
  teamName: string;
  ownerId: string;
  ownerUsername: string;
  stats: CharacterStatResponse[];
  inventorySlots: ItemInstanceResponse[];
  createdAt: string;
  updatedAt: string;
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

// === Teams ===

export interface CreateTeamRequest {
  name: string;
}

export interface JoinTeamRequest {
  inviteCode: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  gameMasterId: string;
  gameMasterUsername: string;
  members: TeamMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberResponse {
  playerId: string;
  playerUsername: string;
  joinedAt: string;
}

export interface InviteCodeResponse {
  inviteCode: string;
}

// === Artifacts ===

export interface CreateArtifactRequest {
  name: string;
  description?: string;
  itemTypeId: string;
  rarity?: Rarity;
  properties?: string;
  specialAbilities?: string;
}

export interface PlaceArtifactRequest {
  artifactId: string;
}

export interface ArtifactResponse {
  id: string;
  name: string;
  description?: string;
  itemTypeId: string;
  itemTypeName: string;
  itemTypeSlot: string;
  rarity?: string;
  properties?: string;
  specialAbilities?: string;
  createdById: string;
  createdAt: string;
}

// === Conditions & Modifiers ===

export interface CreateConditionRequest {
  name: string;
  description?: string;
}

export interface AddConditionModifierRequest {
  statTypeId: string;
  modifierValue: number;
}

export interface ApplyConditionRequest {
  conditionId: string;
}

export interface ConditionResponse {
  id: string;
  name: string;
  description?: string;
  modifiers: ConditionModifierResponse[];
  createdById: string;
  createdAt: string;
}

export interface ConditionModifierResponse {
  id: string;
  statTypeId: string;
  statTypeName: string;
  modifierValue: number;
}

export interface CharacterConditionResponse {
  id: string;
  conditionId: string;
  conditionName: string;
  conditionDescription?: string;
  modifiers: ConditionModifierResponse[];
  appliedById: string;
  appliedAt: string;
  active: boolean;
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
  rewardsAcquired: AcquiredRewardSummary[];
}

export interface AcquiredRewardSummary {
  rewardType: string;
  name: string;
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

export type HomebrewContentSummary = Partial<Record<ContentType, number>>;

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
  affectedInstallations: number;
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

export interface CharacterV2Response {
  id: string;
  name: string;
  totalLevel: number;
  experience: number;
  classLevels: ClassLevelResponse[];
  race: CharacterRaceResponse;
  teamId: string;
  teamName: string;
  ownerId: string;
  ownerUsername: string;
  stats: CharacterStatResponse[];
  inventorySlots: ItemInstanceResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterInCampaignRequest {
  name: string;
  classId: string;
  raceId: string;
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
  goldEquivalent: number;
}

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

// === Item Instances ===

export interface ItemInstanceResponse {
  id: string;
  templateId: string;
  templateName: string;
  displayName: string;
  customName?: string;
  quantity: number;
  isUnique: boolean;
  slot?: EquipmentSlot;
  notes?: string;
  rarity?: Rarity;
  enchantments: EnchantmentResponse[];
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
  characterIds: string[];
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

// === GM Session Notes ===

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
  | 'MEMBER_KICKED';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  campaignId: string;
  characterId?: string;
  data: T;
  timestamp: string;
  triggeredBy: string;
}
