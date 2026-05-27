import api from './axios';
import type {
  ApiResponse,
  StatType,
  ItemType,
  CharacterClass,
  CharacterRace,
  User,
  Team,
} from '@/types';

export const adminApi = {
  // Stat Types
  getStatTypes: async (): Promise<ApiResponse<StatType[]>> => {
    const response = await api.get<ApiResponse<StatType[]>>('/admin/stat-types');
    return response.data;
  },
  createStatType: async (data: { name: string; description: string }): Promise<ApiResponse<StatType>> => {
    const response = await api.post<ApiResponse<StatType>>('/admin/stat-types', data);
    return response.data;
  },
  updateStatType: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<StatType>> => {
    const response = await api.put<ApiResponse<StatType>>(`/admin/stat-types/${id}`, data);
    return response.data;
  },
  deleteStatType: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/stat-types/${id}`);
    return response.data;
  },

  // Item Types
  getItemTypes: async (): Promise<ApiResponse<ItemType[]>> => {
    const response = await api.get<ApiResponse<ItemType[]>>('/admin/item-types');
    return response.data;
  },
  createItemType: async (data: { name: string; description: string; slot: string }): Promise<ApiResponse<ItemType>> => {
    const response = await api.post<ApiResponse<ItemType>>('/admin/item-types', data);
    return response.data;
  },
  updateItemType: async (id: string, data: { name: string; description: string; slot: string }): Promise<ApiResponse<ItemType>> => {
    const response = await api.put<ApiResponse<ItemType>>(`/admin/item-types/${id}`, data);
    return response.data;
  },
  deleteItemType: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/item-types/${id}`);
    return response.data;
  },

  // Character Classes
  getCharacterClasses: async (): Promise<ApiResponse<CharacterClass[]>> => {
    const response = await api.get<ApiResponse<CharacterClass[]>>('/admin/character-classes');
    return response.data;
  },
  createCharacterClass: async (data: { name: string; description: string }): Promise<ApiResponse<CharacterClass>> => {
    const response = await api.post<ApiResponse<CharacterClass>>('/admin/character-classes', data);
    return response.data;
  },
  updateCharacterClass: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<CharacterClass>> => {
    const response = await api.put<ApiResponse<CharacterClass>>(`/admin/character-classes/${id}`, data);
    return response.data;
  },
  deleteCharacterClass: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/character-classes/${id}`);
    return response.data;
  },

  // Character Races
  getCharacterRaces: async (): Promise<ApiResponse<CharacterRace[]>> => {
    const response = await api.get<ApiResponse<CharacterRace[]>>('/admin/character-races');
    return response.data;
  },
  createCharacterRace: async (data: { name: string; description: string }): Promise<ApiResponse<CharacterRace>> => {
    const response = await api.post<ApiResponse<CharacterRace>>('/admin/character-races', data);
    return response.data;
  },
  updateCharacterRace: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<CharacterRace>> => {
    const response = await api.put<ApiResponse<CharacterRace>>(`/admin/character-races/${id}`, data);
    return response.data;
  },
  deleteCharacterRace: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/character-races/${id}`);
    return response.data;
  },

  // Users (read-only)
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  },

  // Teams (read-only)
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    const response = await api.get<ApiResponse<Team[]>>('/admin/teams');
    return response.data;
  },
};
