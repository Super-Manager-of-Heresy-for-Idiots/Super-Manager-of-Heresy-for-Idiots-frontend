import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { npcsApi } from '@/api/npcs.api';
import type {
  CreateNpcRequest,
  UpdateNpcRequest,
  SetNpcVisibilityRequest,
  CreateNpcNoteRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignNpcs(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs'],
    queryFn: async () => {
      const response = await npcsApi.list(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useNpc(campaignId: string, npcId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId],
    queryFn: async () => {
      const response = await npcsApi.getById(campaignId, npcId);
      return response.data;
    },
    enabled: !!campaignId && !!npcId,
  });
}

export function useCreateNpc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateNpcRequest }) =>
      npcsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      toast.success('NPC created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create NPC');
    },
  });
}

export function useUpdateNpc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      data,
    }: {
      campaignId: string;
      npcId: string;
      data: UpdateNpcRequest;
    }) => npcsApi.update(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId] });
      toast.success('NPC updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update NPC');
    },
  });
}

export function useDeleteNpc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, npcId }: { campaignId: string; npcId: string }) =>
      npcsApi.delete(campaignId, npcId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      toast.success('NPC deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete NPC');
    },
  });
}

export function useSetNpcVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      data,
    }: {
      campaignId: string;
      npcId: string;
      data: SetNpcVisibilityRequest;
    }) => npcsApi.setVisibility(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId] });
      toast.success('NPC visibility updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update NPC visibility');
    },
  });
}

// NPC Notes

export function useNpcNotes(campaignId: string, npcId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'notes'],
    queryFn: async () => {
      const response = await npcsApi.listNotes(campaignId, npcId);
      return response.data;
    },
    enabled: !!campaignId && !!npcId,
  });
}

export function useAddNpcNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      data,
    }: {
      campaignId: string;
      npcId: string;
      data: CreateNpcNoteRequest;
    }) => npcsApi.addNote(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'notes'],
      });
      toast.success('Note added!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });
}

export function useDeleteNpcNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      noteId,
    }: {
      campaignId: string;
      npcId: string;
      noteId: string;
    }) => npcsApi.deleteNote(campaignId, npcId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId, 'notes'],
      });
      toast.success('Note deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    },
  });
}
