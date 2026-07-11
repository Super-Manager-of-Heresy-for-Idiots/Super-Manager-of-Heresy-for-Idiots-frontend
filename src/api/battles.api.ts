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
  SpendActionRequest,
  StandardActionRequest,
  ContestRequest,
  ContestResultResponse,
  ForcedMoveRequest,
  TeleportRequest,
  TrapTriggerRequest,
  AdjustActionEconomyRequest,
  CombatantCondition,
  BattleLogEntry,
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

/** In-battle cast-spell request. */
export interface CastSpellRequest {
  spellId: string;
  targetCombatantId?: string;
  /** AoE cast (Phase 2.3): every covered combatant (wins over targetCombatantId). */
  targetCombatantIds?: string[];
  /** AoE template placement in grid cells + rotation (for the lingering zone). */
  originX?: number;
  originY?: number;
  rotationDeg?: number;
  slotLevel?: number;
  damageRollMode?: 'AUTO' | 'MANUAL';
  manualDamage?: number;
  clientCommandId?: string;
}

/** The bits of the cast result the battle UI shows: dealt damage + resistance modifier. */
export interface SpellCastResultLite {
  spellName?: string;
  appliedDamage?: number | null;
  appliedDamageModifier?: string | null;
}

/** Mass GM operation over several combatants at once (Phase 2.4). */
export interface BulkActionRequest {
  combatantIds: string[];
  type: 'DAMAGE' | 'HEAL' | 'CONDITION_ADD' | 'CONDITION_REMOVE';
  amount?: number;
  damageTypeId?: string;
  saveDc?: number;
  saveAbility?: string;
  halfOnSave?: boolean;
  conditionId?: string;
  sourceText?: string;
  remainingRounds?: number;
}

export const battlesApi = {
  list: async (campaignId: string): Promise<ApiResponse<BattleResponse[]>> => {
    const response = await api.get<ApiResponse<BattleResponse[]>>(base(campaignId));
    return response.data;
  },

  getById: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.get<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}`);
    return response.data;
  },

  /**
   * Combat log, seq-ordered after `afterSeq` (default 0 = from the start). Players never receive
   * GM_ONLY rows — the server filters by role. Used by the Log tab (Phase 1.2).
   */
  getLog: async (
    campaignId: string,
    battleId: string,
    afterSeq = 0,
    limit = 200,
  ): Promise<ApiResponse<BattleLogEntry[]>> => {
    const response = await api.get<ApiResponse<BattleLogEntry[]>>(
      `${base(campaignId)}/${battleId}/log`,
      { params: { afterSeq, limit } },
    );
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

  endTurn: async (
    campaignId: string,
    battleId: string,
    // Realtime reliability (Phase 2.14): idempotency key + expected turn/round guard the double-click
    // and network-retry against advancing the turn twice.
    guard?: { expectedTurnIndex?: number; expectedRound?: number; clientCommandId?: string },
  ): Promise<ApiResponse<BattleResponse>> => {
    const params = new URLSearchParams();
    if (guard?.expectedTurnIndex != null) params.set('expectedTurnIndex', String(guard.expectedTurnIndex));
    if (guard?.expectedRound != null) params.set('expectedRound', String(guard.expectedRound));
    if (guard?.clientCommandId) params.set('clientCommandId', guard.clientCommandId);
    const qs = params.toString();
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/end-turn${qs ? `?${qs}` : ''}`,
    );
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

  /**
   * The active character consumes one carried item (potion/scroll…). The server validates it is a
   * consumable they own and spends one unit; omit `targetCombatantId` to apply to self (Phase 1.8).
   */
  useItem: async (
    campaignId: string,
    battleId: string,
    data: { itemInstanceId: string; targetCombatantId?: string },
  ): Promise<ApiResponse<BattleActionResultResponse>> => {
    const response = await api.post<ApiResponse<BattleActionResultResponse>>(
      `${base(campaignId)}/${battleId}/use-item`,
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

  /** Take a standard action (Dash / Dodge / Disengage / Help / Hide) on the combatant's turn (Phase 2.7). */
  standardAction: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: StandardActionRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/standard-action`,
      data,
    );
    return response.data;
  },

  /** Resolve an opposed Grapple/Shove contest against a target on the actor's turn (Phase 2.7). */
  contest: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: ContestRequest,
  ): Promise<ApiResponse<ContestResultResponse>> => {
    const response = await api.post<ApiResponse<ContestResultResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/contest`,
      data,
    );
    return response.data;
  },

  /** Trigger a trap on a combatant — save/damage resolution (GM, Phase 3.2). */
  triggerTrap: async (
    campaignId: string,
    battleId: string,
    data: TrapTriggerRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/trap-trigger`,
      data,
    );
    return response.data;
  },

  /** Forced movement — push/pull/slide a combatant (Phase 2.12). */
  forcedMove: async (
    campaignId: string,
    battleId: string,
    data: ForcedMoveRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/forced-move`,
      data,
    );
    return response.data;
  },

  /** Teleport a combatant, optionally bringing nearby allies (Phase 2.12). */
  teleport: async (
    campaignId: string,
    battleId: string,
    data: TeleportRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/teleport`,
      data,
    );
    return response.data;
  },

  /** GM sets (ft) or clears (null) a combatant's manual speed override (Phase 2.11). */
  setSpeedOverride: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    ft: number | null,
  ): Promise<ApiResponse<BattleResponse>> => {
    const query = ft == null ? '' : `?ft=${ft}`;
    const response = await api.patch<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/speed${query}`,
    );
    return response.data;
  },

  /** Set a combatant's persistent flying state (Phase 2.13). */
  setFlying: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    on: boolean,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.patch<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/flying?on=${on}`,
    );
    return response.data;
  },

  /** GM hides or reveals a monster's identity in the tracker (Phase 2.10). */
  setIdentityHidden: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    hidden: boolean,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.patch<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/identity?hidden=${hidden}`,
    );
    return response.data;
  },

  /** GM spends a monster's Legendary Resistance use to auto-succeed a failed save (Phase 2.9). */
  useLegendaryResistance: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/legendary-resistance`,
    );
    return response.data;
  },

  /** Marks a combatant's action / bonus action / legendary action / reaction as spent this turn. */
  spendAction: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: SpendActionRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/spend`,
      data,
    );
    return response.data;
  },

  /** GM adjusts a combatant's action / bonus / legendary action maxima. */
  adjustActionEconomy: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: AdjustActionEconomyRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/action-economy`,
      data,
    );
    return response.data;
  },

  currentTurn: async (campaignId: string, battleId: string): Promise<ApiResponse<CombatantTurnResponse>> => {
    const response = await api.get<ApiResponse<CombatantTurnResponse>>(`${base(campaignId)}/${battleId}/current-turn`);
    return response.data;
  },

  /** Any combatant's actionable detail (attacks) — for off-turn reaction / OA resolution (Phase 2.8). */
  combatantTurn: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
  ): Promise<ApiResponse<CombatantTurnResponse>> => {
    const response = await api.get<ApiResponse<CombatantTurnResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/turn`,
    );
    return response.data;
  },

  end: async (campaignId: string, battleId: string): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(`${base(campaignId)}/${battleId}/end`);
    return response.data;
  },

  /** GM (or the character's owner) applies a condition; returns the combatant's updated conditions. */
  applyCondition: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    data: { conditionId: string; sourceText?: string | null; remainingRounds?: number | null },
  ): Promise<ApiResponse<CombatantCondition[]>> => {
    const response = await api.post<ApiResponse<CombatantCondition[]>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/conditions`,
      data,
    );
    return response.data;
  },

  /** Removes a condition from a combatant; returns the combatant's remaining conditions. */
  removeCondition: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    conditionId: string,
  ): Promise<ApiResponse<CombatantCondition[]>> => {
    const response = await api.delete<ApiResponse<CombatantCondition[]>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/conditions/${conditionId}`,
    );
    return response.data;
  },

  /** Roll a death saving throw for a dying (0 HP) character — omit `roll` for a server roll. */
  deathSave: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    roll?: number,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/death-save`,
      roll != null ? { roll } : {},
    );
    return response.data;
  },

  /** Stabilize a dying character (GM/healer). */
  stabilize: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/stabilize`,
    );
    return response.data;
  },

  /** GM rerolls a combatant's initiative (server d20 + DEX) and re-sorts the tracker (Phase 1.7). */
  rerollInitiative: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/reroll-initiative`,
    );
    return response.data;
  },

  /**
   * Cast a spell on the caster's turn (Phase 2.1). Caster = the active combatant (server-derived).
   * `damageRollMode`: AUTO (server rolls the plan dice) or MANUAL (player supplies `manualDamage`);
   * either way the server applies save-for-half + the target's resistance. Returns the dealt damage.
   */
  castSpell: async (
    campaignId: string,
    battleId: string,
    data: CastSpellRequest,
  ): Promise<ApiResponse<SpellCastResultLite>> => {
    const response = await api.post<ApiResponse<SpellCastResultLite>>(
      `${base(campaignId)}/${battleId}/cast-spell`,
      data,
    );
    return response.data;
  },

  /** Roll one shared initiative die for a group of combatants (Phase 2.4, GM). */
  groupInitiative: async (
    campaignId: string,
    battleId: string,
    combatantIds: string[],
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/group-initiative`,
      { combatantIds },
    );
    return response.data;
  },

  /** Mass GM operation (damage/heal/condition) over several combatants at once (Phase 2.4). */
  bulkAction: async (
    campaignId: string,
    battleId: string,
    data: BulkActionRequest,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/bulk-action`,
      data,
    );
    return response.data;
  },

  /**
   * Resolve a pending concentration save (Phase 2.2). Omit `d20` for a server AUTO roll; pass 1–20 for
   * a manual physical roll. The server checks the Con save vs the pending DC and breaks/keeps concentration.
   */
  resolveConcentration: async (
    campaignId: string,
    battleId: string,
    combatantId: string,
    d20?: number,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.post<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/combatants/${combatantId}/concentration-check`,
      d20 != null ? { d20 } : {},
    );
    return response.data;
  },

  /**
   * GM replaces the whole tracker's initiative values in one shot (Phase 1.7 drag/reorder). Every
   * combatant of the battle must be listed exactly once; the server re-sorts and keeps the turn.
   */
  setInitiativeOrder: async (
    campaignId: string,
    battleId: string,
    entries: Array<{ combatantId: string; initiative: number }>,
  ): Promise<ApiResponse<BattleResponse>> => {
    const response = await api.patch<ApiResponse<BattleResponse>>(
      `${base(campaignId)}/${battleId}/initiative-order`,
      { entries },
    );
    return response.data;
  },
};
