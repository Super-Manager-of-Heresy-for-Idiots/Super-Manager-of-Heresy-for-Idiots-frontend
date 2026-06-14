import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { questsApi } from '@/api/quests.api';
import { useT } from '@/i18n/I18nContext';
import type {
  CreateQuestRequest,
  UpdateQuestRequest,
  CreateNoteRequest,
  CreateQuestRewardRequest,
  CompleteQuestRequest,
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
