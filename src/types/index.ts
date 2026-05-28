export type Role = 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export type EquipmentSlot = 'HEAD' | 'CHEST' | 'LEGS' | 'FEET' | 'MAIN_HAND' |
  'OFF_HAND' | 'RING_LEFT' | 'RING_RIGHT' | 'NECK' | 'CLOAK';

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

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  characterClass: { id: string; name: string; description?: string };
  race: { id: string; name: string; description?: string };
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterStat {
  id: string;
  statType: { id: string; name: string; description?: string; isDefault: boolean };
  value: number;
}

export interface InventorySlot {
  id: string;
  slot: EquipmentSlot;
  itemType: { id: string; name: string; description?: string; slot: EquipmentSlot } | null;
  quantity: number;
  notes: string | null;
}

export interface Team {
  id: string;
  name: string;
  gameMaster: { id: string; username: string };
  inviteCode?: string;
  members?: TeamMember[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  player: { id: string; username: string; email: string };
  characters: Character[];
  joinedAt: string;
}

export interface StatType {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
}

export interface CharacterRace {
  id: string;
  name: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}

export interface CreateCharacterDto {
  name: string;
  level: number;
  classId: string;
  raceId: string;
}

export interface UpdateStatDto {
  value: number;
}

export interface UpdateInventoryDto {
  itemTypeId: string | null;
  quantity: number;
  notes: string | null;
}

export interface CreateTeamDto {
  name: string;
}

export interface JoinTeamDto {
  inviteCode: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role: 'PLAYER' | 'GAME_MASTER';
}

export interface LoginDto {
  username: string;
  password: string;
}

// === Level-Up & Multiclass System ===

export interface CharacterClassEntry {
  id: string;
  characterClass: { id: string; name: string; description?: string };
  classLevel: number;
  subclass?: { id: string; name: string; description?: string } | null;
}

export interface CharacterDetailed extends Character {
  totalLevel: number;
  experience: number;
  experienceThreshold: number;
  classEntries: CharacterClassEntry[];
  canLevelUp: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  rewardType: string;
}

export interface ClassLevelReward {
  id: string;
  classId: string;
  className?: string;
  level: number;
  reward: Reward;
  rewardType: string;
  isChoice: boolean;
}

export interface AcquiredReward {
  id: string;
  reward: Reward;
  rewardType: string;
  classEntry: { className: string; classLevel: number };
  acquiredAt: string;
}

export interface LevelUpClassOption {
  classId: string;
  className: string;
  currentClassLevel: number;
  newClassLevel: number;
  rewardGroups: RewardGroup[];
  isNewClass: boolean;
}

export interface RewardGroup {
  rewardType: string;
  isChoice: boolean;
  rewards: Reward[];
}

export interface LevelUpPreview {
  currentTotalLevel: number;
  newTotalLevel: number;
  availableClasses: LevelUpClassOption[];
}

export interface LevelUpRequest {
  classId: string;
  selectedRewardIds: string[];
}

export interface Feat {
  id: string;
  name: string;
  description: string;
  prerequisites?: string;
}

export interface Subclass {
  id: string;
  name: string;
  description: string;
  parentClass: { id: string; name: string };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  skillType?: string;
}

export interface CreateFeatDto {
  name: string;
  description: string;
  prerequisites?: string;
}

export interface CreateSubclassDto {
  name: string;
  description: string;
  classId: string;
}

export interface CreateSkillDto {
  name: string;
  description: string;
  skillType?: string;
}

export interface CreateClassLevelRewardDto {
  classId: string;
  level: number;
  rewardId: string;
  rewardType: string;
  isChoice: boolean;
}
