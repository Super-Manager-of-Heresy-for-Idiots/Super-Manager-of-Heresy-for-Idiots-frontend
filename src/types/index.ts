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

export interface Feat {
  id: string;
  name: string;
  description: string;
  prerequisites?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  skillType?: string;
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
