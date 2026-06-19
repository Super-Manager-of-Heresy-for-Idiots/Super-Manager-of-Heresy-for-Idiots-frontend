import api from './axios';
import type {
  ApiResponse,
  BattleResponse,
  CombatantTurnResponse,
  CreateBattleRequest,
  AddBattleMonsterRequest,
  OverrideBattleXpRequest,
  JoinBattleRequest,
  BattleAttackRequest,
  ApplyCombatantHpRequest,
  BattleActionResultResponse,
} from '@/types';

/**
 * Battle ("Бой") REST surface — all routes live under a campaign.
 *
 * Integration contract:
 *  - WebSocket events on `/topic/campaign.{campaignId}` are notifications only;
 *    on any battle event re-fetch the relevant GET below (it is the source of truth).
 *  - State gating: monsters/xp mutate only while ASSEMBLING; join/end-turn/current-turn
 *    only while ACTIVE; xp override allowed until COMPLETED.
 */
const base = (campaignId: string) => `/campaigns/${campaignId}/battles`;

export const battlesApi = {
  list: async (campaignId: string): Promise<ApiResponse<BattleResponse[]>> => {
    const response = await api.get<ApiResponse<BattleResponse[]>>(base(campaignId));
    return response.data;
  },

  getById: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.get<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateBattleRequest): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(base(campaignId), data);
    return response.data;
  },

  // ── Assembly (ASSEMBLING) ──────────────────────────────────
  addMonster: async (
    campaignId: string,
    battleId: string,
    data: AddBattleMonsterRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/monsters`, data);
    return response.data;
  },

  removeCombatant: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.delete<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}`,
    );
    return response.data;
  },

  overrideXp: async (
    campaignId: string,
    battleId: string,
    data: OverrideBattleXpRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.put<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/xp`, data);
    return response.data;
  },

  start: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/start`);
    return response.data;
  },

  // ── Active (ACTIVE) ────────────────────────────────────────
  join: async (
    campaignId: string,
    battleId: string,
    data: JoinBattleRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/join`, data);
    return response.data;
  },

  /** Initiative bonus (DEX mod + buffs) for a character, so the join UI can show d20 + bonus live. */
  initiativeBonus: async (
    campaignId: string,
    battleId: string,
    characterId: string,
  ): Promise<ApiResponse<number>> => {
    const response = await api.get<ApiResponse<number>>(
      `${base(campaignId)}/${battleId}/characters/${characterId}/initiative-bonus`,
    );
    return response.data;
  },

  endTurn: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/end-turn`);
    return response.data;
  },

  /** Active combatant attacks a target (manual d20; server resolves hit/crit and rolls damage). */
  attack: async (
    campaignId: string,
    battleId: string,
    data: BattleAttackRequest,
  ): Promise<ApiResponse<BattleActionResultResponse>> => {
    const response = await api.post<ApiResponse<BattleActionResultResponse>>(
      `${base(campaignId)}/${battleId}/attack`,
      data,
    );
    return response.data;
  },

  /** GM adjusts a combatant's HP (negative damages, positive heals). */
  applyCombatantHp: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: ApplyCombatantHpRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/hp`,
      data,
    );
    return response.data;
  },

  currentTurn: async (campaignId: string, battleId: string): Promise<ApiResponse<CombatantTurnResponse>> => {
    const response = await api.get<ApiResponse<CombatantTurnResponse>>(`${base(campaignId)}/${battleId}/current-turn`);
    return response.data;
  },

  end: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/end`);
    return response.data;
  },
};
