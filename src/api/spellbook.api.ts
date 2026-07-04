import api from './axios';
import type { ApiResponse, CharacterKnownSpell } from '@/types';

/**
 * Character spellbook management (record/forget known spells) — the folio's missing spell management.
 * Backend: /api/characters/{characterId}/spellbook. Access enforced server-side (owner/GM/ADMIN).
 */
export const spellbookApi = {
  list: async (characterId: string): Promise<ApiResponse<CharacterKnownSpell[]>> => {
    const response = await api.get<ApiResponse<CharacterKnownSpell[]>>(
      `/characters/${characterId}/spellbook`,
    );
    return response.data;
  },

  learn: async (characterId: string, spellId: string): Promise<ApiResponse<CharacterKnownSpell>> => {
    const response = await api.post<ApiResponse<CharacterKnownSpell>>(
      `/characters/${characterId}/spellbook`,
      null,
      { params: { spellId } },
    );
    return response.data;
  },

  forget: async (characterId: string, spellId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/characters/${characterId}/spellbook/${spellId}`,
    );
    return response.data;
  },
};
