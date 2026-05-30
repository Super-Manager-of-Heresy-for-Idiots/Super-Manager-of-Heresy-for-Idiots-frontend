import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { questsApi } from '@/api/quests.api';
import type {
  CreateQuestRequest,
  UpdateQuestRequest,
  CreateQuestNoteRequest,
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

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateQuestRequest }) =>
      questsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success('Quest created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create quest');
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();

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
      toast.success('Quest updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update quest');
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, questId }: { campaignId: string; questId: string }) =>
      questsApi.delete(campaignId, questId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'quests'] });
      toast.success('Quest deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete quest');
    },
  });
}

// Quest Notes

export function useQuestNotes(campaignId: string, questId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'quests', questId, 'notes'],
    queryFn: async () => {
      const response = await questsApi.listNotes(campaignId, questId);
      return response.data;
    },
    enabled: !!campaignId && !!questId,
  });
}

export function useAddQuestNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      questId,
      data,
    }: {
      campaignId: string;
      questId: string;
      data: CreateQuestNoteRequest;
    }) => questsApi.addNote(campaignId, questId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'quests', variables.questId, 'notes'],
      });
      toast.success('Note added!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });
}
