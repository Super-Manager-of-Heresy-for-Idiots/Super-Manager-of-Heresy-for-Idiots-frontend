import api from './axios';
import { contentCatalogApi } from './content-catalog.api';
import {
  backgroundDetailToResponse,
  normalizeClassDetail,
  speciesDetailToRaceResponse,
  spellDetailToReference,
} from '@/lib/contentAdapters';
import type {
  ApiResponse,
  AttachHomebrewRequest,
  BackgroundResponse,
  CampaignHomebrewResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  PinHomebrewVersionRequest,
  ProficiencySkillResponse,
  SpeciesDetail,
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

  /**
   * Campaign-visible races as Species (core + active homebrew) from the normalized
   * content model; the legacy `/reference/races` route was removed (Phase S5) in
   * favor of `/reference/species`. Mapped back to CharacterRaceDetailResponse.
   */
  getReferenceRaces: async (campaignId: string): Promise<ApiResponse<CharacterRaceDetailResponse[]>> => {
    const response = await api.get<ApiResponse<SpeciesDetail[]>>(`/campaigns/${campaignId}/reference/species`);
    return {
      ...response.data,
      data: response.data.data?.map(speciesDetailToRaceResponse),
    };
  },

  /**
   * Campaign-visible backgrounds (core + active homebrew) from the normalized
   * content model; the legacy `/reference/backgrounds` shape was superseded.
   * Mapped back to the wizard's lightweight BackgroundResponse.
   */
  getReferenceBackgrounds: async (campaignId: string): Promise<ApiResponse<BackgroundResponse[]>> => {
    const response = await contentCatalogApi.backgrounds.campaignList(campaignId);
    return { ...response, data: (response.data ?? []).map(backgroundDetailToResponse) };
  },

  getReferenceSkills: async (campaignId: string): Promise<ApiResponse<ProficiencySkillResponse[]>> => {
    const response = await api.get<ApiResponse<ProficiencySkillResponse[]>>(`/campaigns/${campaignId}/reference/skills`);
    return response.data;
  },

  getReferenceStatTypes: async (campaignId: string): Promise<ApiResponse<StatTypeResponse[]>> => {
    const response = await api.get<ApiResponse<StatTypeResponse[]>>(`/campaigns/${campaignId}/reference/stat-types`);
    return response.data;
  },

  /**
   * Campaign-visible spells (core + active homebrew) from the normalized content
   * model. The `classId` filter is applied client-side via the flattened class
   * availability, since the catalog list endpoint is unfiltered.
   */
  getReferenceSpells: async (campaignId: string, classId?: string): Promise<ApiResponse<SpellReferenceResponse[]>> => {
    const response = await contentCatalogApi.spells.campaignList(campaignId);
    const mapped = (response.data ?? []).map(spellDetailToReference);
    return {
      ...response,
      data: classId ? mapped.filter((s) => s.availableToClassIds?.includes(classId)) : mapped,
    };
  },
};
