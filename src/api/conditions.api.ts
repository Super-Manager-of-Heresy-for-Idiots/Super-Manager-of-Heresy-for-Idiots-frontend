import api from './axios';
import type {
  ApiResponse,
  ConditionResponse,
  CreateConditionRequest,
  AddConditionModifierRequest,
  ApplyConditionRequest,
  CharacterConditionResponse,
} from '@/types';

export const conditionsApi = {
  list: async (): Promise<ApiResponse<ConditionResponse[]>> => {
    const response = await api.get<ApiResponse<ConditionResponse[]>>('/conditions');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ConditionResponse>> => {
    const response = await api.get<ApiResponse<ConditionResponse>>(`/conditions/${id}`);
    return response.data;
  },

  create: async (data: CreateConditionRequest): Promise<ApiResponse<ConditionResponse>> => {
    const response = await api.post<ApiResponse<ConditionResponse>>('/conditions', data);
    return response.data;
  },

  update: async (id: string, data: CreateConditionRequest): Promise<ApiResponse<ConditionResponse>> => {
    const response = await api.put<ApiResponse<ConditionResponse>>(`/conditions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/conditions/${id}`);
    return response.data;
  },

  addModifier: async (conditionId: string, data: AddConditionModifierRequest): Promise<ApiResponse<ConditionResponse>> => {
    const response = await api.post<ApiResponse<ConditionResponse>>(`/conditions/${conditionId}/modifiers`, data);
    return response.data;
  },

  deleteModifier: async (conditionId: string, modifierId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/conditions/${conditionId}/modifiers/${modifierId}`);
    return response.data;
  },

  applyToCharacter: async (characterId: string, data: ApplyConditionRequest): Promise<ApiResponse<CharacterConditionResponse>> => {
    const response = await api.post<ApiResponse<CharacterConditionResponse>>(`/conditions/apply/${characterId}`, data);
    return response.data;
  },

  getCharacterConditions: async (characterId: string): Promise<ApiResponse<CharacterConditionResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterConditionResponse[]>>(`/conditions/character/${characterId}`);
    return response.data;
  },

  removeFromCharacter: async (characterId: string, characterConditionId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/conditions/character/${characterId}/${characterConditionId}`);
    return response.data;
  },
};
