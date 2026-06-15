import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { battlesApi } from '@/api/battles.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  BattleResponse,
  CreateBattleRequest,
  AddBattleMonsterRequest,
  OverrideBattleXpRequest,
  JoinBattleRequest,
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
    mutationFn: ({ campaignId, battleId }: { campaignId: string; battleId: string }) =>
      battlesApi.endTurn(campaignId, battleId),
    onSuccess: (res) => sync(res.data),
    onError: (e) => toast.error(errMsg(e, t('battle.toast.turnEndFailed'))),
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
