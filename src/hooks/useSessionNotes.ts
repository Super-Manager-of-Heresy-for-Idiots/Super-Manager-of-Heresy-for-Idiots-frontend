import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sessionNotesApi } from '@/api/session-notes.api';
import type {
  CreateSessionNoteRequest,
  UpdateSessionNoteRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignSessionNotes(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'session-notes'],
    queryFn: async () => {
      const response = await sessionNotesApi.list(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateSessionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateSessionNoteRequest }) =>
      sessionNotesApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'session-notes'] });
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
      data: UpdateSessionNoteRequest;
    }) => sessionNotesApi.update(campaignId, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'session-notes'] });
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
      sessionNotesApi.delete(campaignId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'session-notes'] });
      toast.success('Session note deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete session note');
    },
  });
}
