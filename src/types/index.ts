// === Enums / Unions ===

export type Role = 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'MAIN_HAND' |
  'OFF_HAND' | 'RING_LEFT' | 'RING_RIGHT' | 'NECK' | 'CLOAK';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY';

export type DamageType = 'SLASHING' | 'PIERCING' | 'BLUDGEONING' | 'FIRE' | 'COLD' |
  'LIGHTNING' | 'POISON' | 'NECROTIC' | 'RADIANT' | 'PSYCHIC' | 'FORCE' | 'THUNDER' | 'ACID';

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
  ownerId: string;
  ownerUsername: string;
  stats: CharacterStatResponse[];
  inventorySlots: InventorySlotResponse[];
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

export interface InventorySlotResponse {
  id: string;
  slot: EquipmentSlot;
  itemTypeId?: string;
  itemTypeName?: string;
  artifactId?: string;
  artifactName?: string;
  artifactRarity?: Rarity;
  quantity?: number;
  notes?: string;
}

export interface UpdateStatRequest {
  value: number;
}

export interface UpdateInventorySlotRequest {
  itemTypeId?: string | null;
  quantity?: number;
  notes?: string;
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
  isDefault: boolean;
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
  skillActivation?: 'PASSIVE' | 'ACTIVE';
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  rewardType: 'SKILL' | 'SUBCLASS' | 'FEAT';
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
  skillActivation?: 'PASSIVE' | 'ACTIVE';
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

export type HomebrewStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export type ContentType = 'ITEM_TYPE' | 'CHARACTER_CLASS' | 'SKILL' | 'FEAT';

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

export interface HomebrewContentSummary {
  itemTypeCount: number;
  classCount: number;
  skillCount: number;
  featCount: number;
}

export interface ContentSummaryDto {
  id: string;
  name: string;
  description?: string;
  slot?: string;
  skillType?: string;
  prerequisites?: string;
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

export interface InstallResponse {
  installedAt: string;
  sourceVersion: number;
  contentCount: number;
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
