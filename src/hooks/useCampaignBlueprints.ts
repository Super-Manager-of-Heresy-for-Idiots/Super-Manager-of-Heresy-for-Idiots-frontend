import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
  campaignBlueprintsApi,
  type BlueprintMarketplaceParams,
} from '@/api/campaign-blueprints.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  CreateCampaignBlueprintRequest,
  UpdateCampaignBlueprintRequest,
  InstantiateBlueprintRequest,
  CreateBlueprintNpcRequest,
  UpdateBlueprintNpcRequest,
  CreateBlueprintQuestRequest,
  UpdateBlueprintQuestRequest,
  CreateBlueprintLocationRequest,
  UpdateBlueprintLocationRequest,
  CreateQuestRewardRequest,
  AttachHomebrewRequest,
} from '@/types';

/* ── query keys ───────────────────────────────────────────── */

const ROOT = 'blueprints';
const marketplaceKey = (params: BlueprintMarketplaceParams) => [ROOT, 'marketplace', params];
const marketplaceDetailKey = (id: string) => [ROOT, 'marketplace', 'detail', id];
const myListKey = () => [ROOT, 'my'];
const myDetailKey = (id: string) => [ROOT, 'my', id];

/* ── queries ──────────────────────────────────────────────── */

export function useBlueprintMarketplace(params: BlueprintMarketplaceParams) {
  return useQuery({
    queryKey: marketplaceKey(params),
    queryFn: async () => {
      const response = await campaignBlueprintsApi.browseMarketplace(params);
      return response.data;
    },
  });
}

export function useBlueprintMarketplaceDetail(id: string | undefined) {
  return useQuery({
    queryKey: marketplaceDetailKey(id ?? ''),
    queryFn: async () => {
      const response = await campaignBlueprintsApi.getMarketplaceOne(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useMyBlueprints() {
  return useQuery({
    queryKey: myListKey(),
    queryFn: async () => {
      const response = await campaignBlueprintsApi.getMy();
      return response.data ?? [];
    },
  });
}

export function useMyBlueprintDetail(id: string | undefined) {
  return useQuery({
    queryKey: myDetailKey(id ?? ''),
    queryFn: async () => {
      const response = await campaignBlueprintsApi.getMyOne(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

/* ── blueprint lifecycle mutations ────────────────────────── */

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateCampaignBlueprintRequest) => campaignBlueprintsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myListKey() });
      toast.success(t('hk.blueprint.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.createFailed'));
    },
  });
}

export function useUpdateBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignBlueprintRequest }) =>
      campaignBlueprintsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: myDetailKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: myListKey() });
      toast.success(t('hk.blueprint.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.updateFailed'));
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => campaignBlueprintsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myListKey() });
      toast.success(t('hk.blueprint.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.deleteFailed'));
    },
  });
}

export function usePublishBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? campaignBlueprintsApi.publish(id) : campaignBlueprintsApi.unpublish(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: myDetailKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: myListKey() });
      toast.success(variables.publish ? t('hk.blueprint.published') : t('hk.blueprint.unpublished'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.publishFailed'));
    },
  });
}

export function useForkBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => campaignBlueprintsApi.fork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myListKey() });
      queryClient.invalidateQueries({ queryKey: [ROOT, 'marketplace'] });
      toast.success(t('hk.blueprint.forked'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.forkFailed'));
    },
  });
}

export function useInstantiateBlueprint() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstantiateBlueprintRequest }) =>
      campaignBlueprintsApi.instantiate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.blueprint.instantiated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.blueprint.instantiateFailed'));
    },
  });
}

/* ── sub-entity mutations (operate inside one blueprint) ──── */

function useBlueprintChildMutation<TVars extends { id: string }, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  successKey: string,
  failKey: string,
) {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn,
    onSuccess: (_: TData, variables: TVars) => {
      queryClient.invalidateQueries({ queryKey: myDetailKey(variables.id) });
      toast.success(t(successKey));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t(failKey));
    },
  });
}

export function useSaveBlueprintNpc() {
  return useBlueprintChildMutation(
    ({ id, npcId, data }: { id: string; npcId?: string; data: CreateBlueprintNpcRequest | UpdateBlueprintNpcRequest }) =>
      npcId
        ? campaignBlueprintsApi.updateNpc(id, npcId, data)
        : campaignBlueprintsApi.createNpc(id, data as CreateBlueprintNpcRequest),
    'hk.blueprint.npcSaved',
    'hk.blueprint.npcFailed',
  );
}

export function useDeleteBlueprintNpc() {
  return useBlueprintChildMutation(
    ({ id, npcId }: { id: string; npcId: string }) => campaignBlueprintsApi.deleteNpc(id, npcId),
    'hk.blueprint.npcDeleted',
    'hk.blueprint.npcFailed',
  );
}

export function useSaveBlueprintQuest() {
  return useBlueprintChildMutation(
    ({ id, questId, data }: { id: string; questId?: string; data: CreateBlueprintQuestRequest | UpdateBlueprintQuestRequest }) =>
      questId
        ? campaignBlueprintsApi.updateQuest(id, questId, data)
        : campaignBlueprintsApi.createQuest(id, data as CreateBlueprintQuestRequest),
    'hk.blueprint.questSaved',
    'hk.blueprint.questFailed',
  );
}

export function useDeleteBlueprintQuest() {
  return useBlueprintChildMutation(
    ({ id, questId }: { id: string; questId: string }) => campaignBlueprintsApi.deleteQuest(id, questId),
    'hk.blueprint.questDeleted',
    'hk.blueprint.questFailed',
  );
}

export function useAddBlueprintQuestReward() {
  return useBlueprintChildMutation(
    ({ id, questId, data }: { id: string; questId: string; data: CreateQuestRewardRequest }) =>
      campaignBlueprintsApi.addQuestReward(id, questId, data),
    'hk.blueprint.rewardAdded',
    'hk.blueprint.rewardFailed',
  );
}

export function useDeleteBlueprintQuestReward() {
  return useBlueprintChildMutation(
    ({ id, questId, rewardId }: { id: string; questId: string; rewardId: string }) =>
      campaignBlueprintsApi.deleteQuestReward(id, questId, rewardId),
    'hk.blueprint.rewardDeleted',
    'hk.blueprint.rewardFailed',
  );
}

export function useSaveBlueprintLocation() {
  return useBlueprintChildMutation(
    ({ id, locationId, data }: { id: string; locationId?: string; data: CreateBlueprintLocationRequest | UpdateBlueprintLocationRequest }) =>
      locationId
        ? campaignBlueprintsApi.updateLocation(id, locationId, data)
        : campaignBlueprintsApi.createLocation(id, data as CreateBlueprintLocationRequest),
    'hk.blueprint.locationSaved',
    'hk.blueprint.locationFailed',
  );
}

export function useDeleteBlueprintLocation() {
  return useBlueprintChildMutation(
    ({ id, locationId }: { id: string; locationId: string }) =>
      campaignBlueprintsApi.deleteLocation(id, locationId),
    'hk.blueprint.locationDeleted',
    'hk.blueprint.locationFailed',
  );
}

export function useAttachBlueprintHomebrew() {
  return useBlueprintChildMutation(
    ({ id, data }: { id: string; data: AttachHomebrewRequest }) =>
      campaignBlueprintsApi.attachHomebrew(id, data),
    'hk.blueprint.homebrewAttached',
    'hk.blueprint.homebrewFailed',
  );
}

export function useDetachBlueprintHomebrew() {
  return useBlueprintChildMutation(
    ({ id, packageId }: { id: string; packageId: string }) =>
      campaignBlueprintsApi.detachHomebrew(id, packageId),
    'hk.blueprint.homebrewDetached',
    'hk.blueprint.homebrewFailed',
  );
}

export function useLinkBlueprintCharacter() {
  return useBlueprintChildMutation(
    ({ id, characterId }: { id: string; characterId: string }) =>
      campaignBlueprintsApi.linkCharacter(id, characterId),
    'hk.blueprint.characterLinked',
    'hk.blueprint.characterFailed',
  );
}

export function useUnlinkBlueprintCharacter() {
  return useBlueprintChildMutation(
    ({ id, characterId }: { id: string; characterId: string }) =>
      campaignBlueprintsApi.unlinkCharacter(id, characterId),
    'hk.blueprint.characterUnlinked',
    'hk.blueprint.characterFailed',
  );
}
