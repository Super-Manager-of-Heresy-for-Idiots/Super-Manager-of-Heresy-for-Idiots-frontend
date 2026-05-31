import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { gmNotesApi } from '@/api/session-notes.api';
import type {
  CreateGmNoteRequest,
  UpdateGmNoteRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignSessionNotes(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'gm-notes'],
    queryFn: async () => {
      const response = await gmNotesApi.list(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateSessionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateGmNoteRequest }) =>
      gmNotesApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'gm-notes'] });
      toast.success('Session note created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create session note');
    },
  });
}

export function useUpdateSessionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      noteId,
      data,
    }: {
      campaignId: string;
      noteId: string;
      data: UpdateGmNoteRequest;
    }) => gmNotesApi.update(campaignId, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'gm-notes'] });
      toast.success('Session note updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update session note');
    },
  });
}

export function useDeleteSessionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, noteId }: { campaignId: string; noteId: string }) =>
      gmNotesApi.delete(campaignId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'gm-notes'] });
      toast.success('Session note deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete session note');
    },
  });
}
