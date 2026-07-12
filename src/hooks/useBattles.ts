import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { battlesApi, type BulkActionRequest, type CastSpellRequest } from '@/api/battles.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  BattleResponse,
  CreateBattleRequest,
  AddBattleMonsterRequest,
  OverrideBattleXpRequest,
  JoinBattleRequest,
  BattleAttackRequest,
  ApplyCombatantHpRequest,
  SpendActionRequest,
  StandardActionRequest,
  ContestRequest,
  ForcedMoveRequest,
  TeleportRequest,
  TrapTriggerRequest,
  FallRequest,
  AdjustActionEconomyRequest,
} from '@/types';

/* ── query keys ──────────────────────────────────────────────── */

const listKey = (campaignId: string) => ['campaigns', campaignId, 'battles'] as const;
const detailKey = (campaignId: string, battleId: string) =>
  ['campaigns', campaignId, 'battles', battleId] as const;
const turnKey = (campaignId: string, battleId: string) =>
  ['campaigns', campaignId, 'battles', battleId, 'current-turn'] as const;

function errMsg(error: unknown, fallback: string): string {
  return (error as AxiosError<ApiError>)?.response?.data?.message || fallback;
}

/* ── queries ─────────────────────────────────────────────────── */

export function useCampaignBattles(campaignId: string) {
  return useQuery({
    queryKey: listKey(campaignId),
    queryFn: async () => (await battlesApi.list(campaignId)).data ?? [],
    enabled: !!campaignId,
  });
}

export function useBattle(campaignId: string, battleId: string | undefined) {
  return useQuery({
    queryKey: detailKey(campaignId, battleId ?? ''),
    queryFn: async () => (await battlesApi.getById(campaignId, battleId!)).data,
    enabled: !!campaignId && !!battleId,
  });
}

/** A character's initiative bonus (DEX mod + buffs), for the live `d20 + bonus` join preview. */
export function useInitiativeBonus(
  campaignId: string,
  battleId: string | undefined,
  characterId: string | undefined,
) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'battles', battleId ?? '', 'init-bonus', characterId ?? ''] as const,
    queryFn: async () => (await battlesApi.initiativeBonus(campaignId, battleId!, characterId!)).data ?? 0,
    enabled: !!campaignId && !!battleId && !!characterId,
    staleTime: 30_000,
  });
}

/** Current-turn detail (resources, abilities, effects). Active battles only. */
export function useBattleCurrentTurn(
  campaignId: string,
  battleId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: turnKey(campaignId, battleId ?? ''),
    queryFn: async () => (await battlesApi.currentTurn(campaignId, battleId!)).data,
    enabled: !!campaignId && !!battleId && enabled,
  });
}

/** Any combatant's actionable detail (attacks) for off-turn reaction / OA resolution (Phase 2.8). */
export function useCombatantTurn(
  campaignId: string,
  battleId: string | undefined,
  combatantId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'battles', battleId ?? '', 'combatant-turn', combatantId ?? ''],
    queryFn: async () => (await battlesApi.combatantTurn(campaignId, battleId!, combatantId!)).data,
    enabled: !!campaignId && !!battleId && !!combatantId && enabled,
  });
}

/* ── mutations ───────────────────────────────────────────────── */

/** Writes a fresh battle into caches so the UI updates without a round-trip. */
function useSyncBattle() {
  const qc = useQueryClient();
  return (battle: BattleResponse | undefined) => {
    if (!battle) return;
    qc.setQueryData(detailKey(battle.campaignId, battle.id), battle);
    qc.invalidateQueries({ queryKey: listKey(battle.campaignId) });
    qc.invalidateQueries({ queryKey: turnKey(battle.campaignId, battle.id) });
  };
}

export function useCreateBattle() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateBattleRequest }) =>
      battlesApi.create(campaignId, data),
    onSuccess: (res, { campaignId }) => {
      qc.invalidateQueries({ queryKey: listKey(campaignId) });
      if (res.data) qc.setQueryData(detailKey(campaignId, res.data.id), res.data);
      toast.success(t('battle.toast.created'));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.toast.createFailed'))),
  });
}

export function useAddBattleMonster() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      data: AddBattleMonsterRequest;
    }) => battlesApi.addMonster(campaignId, battleId, data),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.monsterAddFailed'))),
  });
}

export function useRemoveCombatant() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
    }) => battlesApi.removeCombatant(campaignId, battleId, combatantId),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.removeFailed'))),
  });
}

export function useOverrideBattleXp() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      data: OverrideBattleXpRequest;
    }) => battlesApi.overrideXp(campaignId, battleId, data),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.xpFailed'))),
  });
}

export function useStartBattle() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId }: { campaignId: string; battleId: string }) =>
      battlesApi.start(campaignId, battleId),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('battle.toast.started'));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.toast.startFailed'))),
  });
}

export function useJoinBattle() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      data: JoinBattleRequest;
    }) => battlesApi.join(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('battle.toast.joined'));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.toast.joinFailed'))),
  });
}

export function useEndTurn() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      expectedTurnIndex,
      expectedRound,
    }: {
      campaignId: string;
      battleId: string;
      expectedTurnIndex?: number;
      expectedRound?: number;
    }) =>
      // Realtime reliability (Phase 2.14): a fresh idempotency key + the expected turn/round the
      // client saw — a double-click's second call is rejected as stale, a retry is deduped.
      battlesApi.endTurn(campaignId, battleId, {
        expectedTurnIndex,
        expectedRound,
        clientCommandId: crypto.randomUUID(),
      }),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.turnEndFailed'))),
  });
}

/** The active combatant attacks a target; returns the roll/outcome result and syncs the battle. */
export function useBattleAttack() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      data: BattleAttackRequest;
    }) => battlesApi.attack(campaignId, battleId, data),
    onSuccess: (res) => sync(res.data?.battle),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.attackFailed'))),
  });
}

/** GM adjusts a combatant's HP (negative damages, positive heals). */
export function useApplyCombatantHp() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      data: ApplyCombatantHpRequest;
    }) => battlesApi.applyCombatantHp(campaignId, battleId, combatantId, data),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.hpFailed'))),
  });
}

/** Marks a combatant's action / bonus action / legendary action / reaction as spent this turn. */
export function useSpendAction() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      data: SpendActionRequest;
    }) => battlesApi.spendAction(campaignId, battleId, combatantId, data),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.actionFailed'))),
  });
}

/** Take a standard action (Dash / Dodge / Disengage / Help / Hide) on a combatant's turn (Phase 2.7). */
export function useStandardAction() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      data: StandardActionRequest;
    }) => battlesApi.standardAction(campaignId, battleId, combatantId, data),
    onSuccess: (res, { data }) => {
      sync(res.data);
      toast.success(t(`battle.standard.done.${data.type}`));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.standard.failed'))),
  });
}

/** GM sets or clears a combatant's manual speed override (Phase 2.11). */
export function useSetSpeedOverride() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      ft,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      ft: number | null;
    }) => battlesApi.setSpeedOverride(campaignId, battleId, combatantId, ft),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('tactical.speed.failed'))),
  });
}

/** Trigger a trap on a combatant — save/damage resolution (Phase 3.2). */
export function useTriggerTrap() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, data }: { campaignId: string; battleId: string; data: TrapTriggerRequest }) =>
      battlesApi.triggerTrap(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.trap.triggered'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.trap.failed'))),
  });
}

/** Undo the last reversible battle operation — HP/condition/position (Phase 3.5). */
export function useUndo() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId }: { campaignId: string; battleId: string }) =>
      battlesApi.undo(campaignId, battleId),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.undo.done'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.undo.failed'))),
  });
}

/** Apply fall damage + prone to a combatant (Phase 3.4). */
export function useFall() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, data }: { campaignId: string; battleId: string; data: FallRequest }) =>
      battlesApi.fall(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.fall.applied'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.fall.failed'))),
  });
}

/** Forced movement — push/pull/slide a combatant (Phase 2.12). */
export function useForcedMove() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, data }: { campaignId: string; battleId: string; data: ForcedMoveRequest }) =>
      battlesApi.forcedMove(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.forced.done'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.forced.failed'))),
  });
}

/** Teleport a combatant, optionally bringing nearby allies (Phase 2.12). */
export function useTeleport() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, data }: { campaignId: string; battleId: string; data: TeleportRequest }) =>
      battlesApi.teleport(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.teleport.done'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.teleport.failed'))),
  });
}

/** Set a combatant's persistent flying state (Phase 2.13). */
export function useSetFlying() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, combatantId, on }: { campaignId: string; battleId: string; combatantId: string; on: boolean }) =>
      battlesApi.setFlying(campaignId, battleId, combatantId, on),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.flying.failed'))),
  });
}

/** GM hides or reveals a monster's identity in the tracker (Phase 2.10). */
export function useSetIdentityHidden() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      hidden,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      hidden: boolean;
    }) => battlesApi.setIdentityHidden(campaignId, battleId, combatantId, hidden),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.identity.failed'))),
  });
}

/** GM spends a monster's Legendary Resistance use (Phase 2.9). */
export function useLegendaryResistance() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, combatantId }: { campaignId: string; battleId: string; combatantId: string }) =>
      battlesApi.useLegendaryResistance(campaignId, battleId, combatantId),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('battle.legendary.resistanceUsed'));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.legendary.failed'))),
  });
}

/** Resolve an opposed Grapple/Shove contest (Phase 2.7). */
export function useContest() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      data: ContestRequest;
    }) => battlesApi.contest(campaignId, battleId, combatantId, data),
    onSuccess: (res) => {
      sync(res.data?.battle);
      if (res.data) {
        const msg = res.data.attackerWins
          ? t('battle.contest.won', { total: res.data.attackerTotal, target: res.data.targetTotal })
          : t('battle.contest.lost', { total: res.data.attackerTotal, target: res.data.targetTotal });
        (res.data.attackerWins ? toast.success : toast)(msg);
      }
    },
    onError: (e) => toast.error(errMsg(e, t('battle.contest.failed'))),
  });
}

/** GM adjusts a combatant's action / bonus / legendary action maxima. */
export function useAdjustActionEconomy() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      data: AdjustActionEconomyRequest;
    }) => battlesApi.adjustActionEconomy(campaignId, battleId, combatantId, data),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.actionFailed'))),
  });
}

export function useEndBattle() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId }: { campaignId: string; battleId: string }) =>
      battlesApi.end(campaignId, battleId),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('battle.toast.ended'));
    },
    onError: (e) => toast.error(errMsg(e, t('battle.toast.endFailed'))),
  });
}

/** GM rerolls one combatant's initiative (server d20 + DEX) and re-sorts the tracker (Phase 1.7). */
export function useRerollInitiative() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, combatantId }: { campaignId: string; battleId: string; combatantId: string }) =>
      battlesApi.rerollInitiative(campaignId, battleId, combatantId),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('tactical.init.updateFailed'))),
  });
}

/** Cast a spell on the caster's turn (Phase 2.1). Refreshes the battle + current-turn (slots). */
export function useBattleCastSpell() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      data,
    }: {
      campaignId: string;
      battleId: string;
      data: CastSpellRequest;
    }) => battlesApi.castSpell(campaignId, battleId, data),
    onSuccess: (res, { campaignId }) => {
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
      const dealt = res.data?.appliedDamage;
      if (dealt != null && dealt > 0) {
        toast.success(t('battle.action.spell.dealt', { n: dealt }));
      } else {
        toast.success(t('battle.action.spell.cast'));
      }
    },
    onError: (e) => toast.error(errMsg(e, t('battle.action.spell.castFailed'))),
  });
}

/** Roll one shared initiative die for a group of combatants (Phase 2.4). */
export function useGroupInitiative() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, combatantIds }: { campaignId: string; battleId: string; combatantIds: string[] }) =>
      battlesApi.groupInitiative(campaignId, battleId, combatantIds),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.bulk.groupInitDone'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.bulk.groupInitFailed'))),
  });
}

/** Mass GM operation (damage/heal/condition) over several combatants (Phase 2.4). */
export function useBulkAction() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, battleId, data }: { campaignId: string; battleId: string; data: BulkActionRequest }) =>
      battlesApi.bulkAction(campaignId, battleId, data),
    onSuccess: (res) => {
      sync(res.data);
      toast.success(t('tactical.bulk.done'));
    },
    onError: (e) => toast.error(errMsg(e, t('tactical.bulk.failed'))),
  });
}

/** Resolve a pending concentration save (Phase 2.2) — the player's manual d20 or a server AUTO roll. */
export function useResolveConcentration() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      combatantId,
      d20,
    }: {
      campaignId: string;
      battleId: string;
      combatantId: string;
      d20?: number;
    }) => battlesApi.resolveConcentration(campaignId, battleId, combatantId, d20),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('tactical.conc.failed'))),
  });
}

/** GM reorders the initiative tracker (full initiative-value replacement, Phase 1.7). */
export function useSetInitiativeOrder() {
  const sync = useSyncBattle();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      battleId,
      entries,
    }: {
      campaignId: string;
      battleId: string;
      entries: Array<{ combatantId: string; initiative: number }>;
    }) => battlesApi.setInitiativeOrder(campaignId, battleId, entries),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('tactical.init.updateFailed'))),
  });
}
