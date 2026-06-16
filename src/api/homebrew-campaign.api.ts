import api from './axios';
import { normalizeClassDetail } from '@/lib/contentAdapters';
import type {
  ApiResponse,
  AttachHomebrewRequest,
  BackgroundResponse,
  CampaignHomebrewResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  PinHomebrewVersionRequest,
  ProficiencySkillResponse,
  SpellReferenceResponse,
  StatTypeResponse,
  TeamAvailableContentResponse,
} from '@/types';

export const homebrewCampaignApi = {
  attach: async (campaignId: string, data: AttachHomebrewRequest): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.post<ApiResponse<CampaignHomebrewResponse>>(`/campaigns/${campaignId}/homebrew`, data);
    return response.data;
  },

  detach: async (campaignId: string, packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/homebrew/${packageId}`);
    return response.data;
  },

  listAttached: async (campaignId: string): Promise<ApiResponse<CampaignHomebrewResponse[]>> => {
    const response = await api.get<ApiResponse<CampaignHomebrewResponse[]>>(`/campaigns/${campaignId}/homebrew`);
    return response.data;
  },

  pinVersion: async (
    campaignId: string,
    packageId: string,
    data: PinHomebrewVersionRequest,
  ): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.put<ApiResponse<CampaignHomebrewResponse>>(
      `/campaigns/${campaignId}/homebrew/${packageId}/pin`,
      data,
    );
    return response.data;
  },

  getAvailableContent: async (campaignId: string): Promise<ApiResponse<TeamAvailableContentResponse>> => {
    const response = await api.get<ApiResponse<TeamAvailableContentResponse>>(`/campaigns/${campaignId}/available-content`);
    return response.data;
  },

  getReferenceClasses: async (campaignId: string): Promise<ApiResponse<CharacterClassDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterClassDetailResponse[]>>(`/campaigns/${campaignId}/reference/classes`);
    return {
      ...response.data,
      data: response.data.data?.map(normalizeClassDetail),
    };
  },

  getReferenceRaces: async (campaignId: string): Promise<ApiResponse<CharacterRaceDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterRaceDetailResponse[]>>(`/campaigns/${campaignId}/reference/races`);
    return response.data;
  },

  getReferenceBackgrounds: async (campaignId: string): Promise<ApiResponse<BackgroundResponse[]>> => {
    const response = await api.get<ApiResponse<BackgroundResponse[]>>(`/campaigns/${campaignId}/reference/backgrounds`);
    return response.data;
  },

  getReferenceSkills: async (campaignId: string): Promise<ApiResponse<ProficiencySkillResponse[]>> => {
    const response = await api.get<ApiResponse<ProficiencySkillResponse[]>>(`/campaigns/${campaignId}/reference/skills`);
    return response.data;
  },

  getReferenceStatTypes: async (campaignId: string): Promise<ApiResponse<StatTypeResponse[]>> => {
    const response = await api.get<ApiResponse<StatTypeResponse[]>>(`/campaigns/${campaignId}/reference/stat-types`);
    return response.data;
  },

  getReferenceSpells: async (campaignId: string, classId?: string): Promise<ApiResponse<SpellReferenceResponse[]>> => {
    const response = await api.get<ApiResponse<SpellReferenceResponse[]>>(`/campaigns/${campaignId}/reference/spells`, {
      params: classId ? { classId } : undefined,
    });
    return response.data;
  },
};
