import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { questsApi } from '@/api/quests.api';
import { useT } from '@/i18n/I18nContext';
import type {
  CreateQuestRequest,
  UpdateQuestRequest,
  CreateNoteRequest,
  CreateQuestRewardRequest,
  CompleteQuestRequest,
  CreateQuestObjectiveRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignQuests(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'quests'],
    queryFn: async () => {
      const response = await questsApi.list(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useQuest(campaignId: string, questId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'quests', questId],
    queryFn: async () => {
      const response = await questsApi.getById(campaignId, questId);
      return response.data;
    },
    enabled: !!campaignId && !!questId,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateQuestRequest }) =>
      questsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success(t('hk.quest.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.createFailed'));
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      data,
    }: {
      campaignId: string;
      questId: string;
      data: UpdateQuestRequest;
    }) => questsApi.update(campaignId, questId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId] });
      toast.success(t('hk.quest.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.updateFailed'));
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, questId }: { campaignId: string; questId: string }) =>
      questsApi.delete(campaignId, questId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success(t('hk.quest.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.deleteFailed'));
    },
  });
}

// Quest ↔ NPC links (квестодатели)

/**
 * Привязывает NPC к квесту: после этого NPC предлагает квест игрокам,
 * находящимся с ним в одной локации, и принимает его сдачу.
 */
export function useLinkQuestNpc() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, questId, npcId }: QuestNpcLinkVars) =>
      questsApi.linkNpc(campaignId, questId, npcId),
    onSuccess: (_, v) => {
      invalidateQuestNpcLink(queryClient, v);
      toast.success(t('hk.quest.npcLinked'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.npcLinkFailed'));
    },
  });
}

export function useUnlinkQuestNpc() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, questId, npcId }: QuestNpcLinkVars) =>
      questsApi.unlinkNpc(campaignId, questId, npcId),
    onSuccess: (_, v) => {
      invalidateQuestNpcLink(queryClient, v);
      toast.success(t('hk.quest.npcUnlinked'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.npcUnlinkFailed'));
    },
  });
}

interface QuestNpcLinkVars {
  campaignId: string;
  questId: string;
  npcId: string;
}

/** Связь видна с обеих сторон, поэтому обновляем и карточку квеста, и карточку NPC. */
function invalidateQuestNpcLink(queryClient: QueryClient, v: QuestNpcLinkVars) {
  queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'quests', v.questId] });
  queryClient.invalidateQueries({ queryKey: ['campaigns', v.campaignId, 'npcs', v.npcId] });
}

// Quest Notes

export function useAddQuestNote() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      data,
    }: {
      campaignId: string;
      questId: string;
      data: CreateNoteRequest;
    }) => questsApi.addNote(campaignId, questId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId],
      });
      toast.success(t('hk.quest.noteAdded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.noteAddFailed'));
    },
  });
}

// Quest Rewards

export function useAddQuestReward() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      data,
    }: {
      campaignId: string;
      questId: string;
      data: CreateQuestRewardRequest;
    }) => questsApi.addReward(campaignId, questId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success(t('hk.quest.rewardAdded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.rewardAddFailed'));
    },
  });
}

export function useDeleteQuestReward() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      rewardId,
    }: {
      campaignId: string;
      questId: string;
      rewardId: string;
    }) => questsApi.deleteReward(campaignId, questId, rewardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success(t('hk.quest.rewardDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.rewardDeleteFailed'));
    },
  });
}

// Quest Objectives (optional, GM-authored)

export function useQuestObjectives(campaignId: string, questId: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'quests', questId, 'objectives'],
    queryFn: async () => {
      const response = await questsApi.listObjectives(campaignId, questId);
      return response.data;
    },
    enabled: !!campaignId && !!questId && enabled,
  });
}

export function useAddQuestObjective() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, questId, data }: { campaignId: string; questId: string; data: CreateQuestObjectiveRequest }) =>
      questsApi.addObjective(campaignId, questId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId, 'objectives'] });
      toast.success(t('hk.quest.objectiveAdded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.objectiveAddFailed'));
    },
  });
}

export function useDeleteQuestObjective() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, questId, objectiveId }: { campaignId: string; questId: string; objectiveId: string }) =>
      questsApi.deleteObjective(campaignId, questId, objectiveId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId, 'objectives'] });
      toast.success(t('hk.quest.objectiveDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.objectiveDeleteFailed'));
    },
  });
}

export function useSetObjectiveProgress() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, questId, objectiveId, currentCount }: { campaignId: string; characterId: string; questId: string; objectiveId: string; currentCount: number }) =>
      questsApi.setObjectiveProgress(campaignId, characterId, questId, objectiveId, currentCount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      toast.success(t('hk.quest.objectiveProgressSet'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.objectiveProgressFailed'));
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      data,
    }: {
      campaignId: string;
      questId: string;
      data: CompleteQuestRequest;
    }) => questsApi.complete(campaignId, questId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      // Granted items/currency/XP land on the recipient — refresh their sheet, inventory and wallet.
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      const c = response.data;
      if (c) {
        toast.success(
          t('hk.quest.completed', {
            name: c.recipientCharacterName,
            items: c.itemsGranted,
            xp: c.xpGranted,
          }),
        );
      } else {
        toast.success(t('hk.quest.updated'));
      }
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.quest.completeFailed'));
    },
  });
}
