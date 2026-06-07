import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { npcsApi } from '@/api/npcs.api';
import { useT } from '@/i18n/I18nContext';
import type {
  CreateNpcRequest,
  UpdateNpcRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
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
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateNpcRequest }) =>
      npcsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      toast.success(t('hk.npc.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.createFailed'));
    },
  });
}

export function useUpdateNpc() {
  const queryClient = useQueryClient();
  const t = useT();

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
      toast.success(t('hk.npc.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.updateFailed'));
    },
  });
}

export function useDeleteNpc() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, npcId }: { campaignId: string; npcId: string }) =>
      npcsApi.delete(campaignId, npcId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      toast.success(t('hk.npc.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.deleteFailed'));
    },
  });
}

export function useToggleNpcVisibility() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
    }: {
      campaignId: string;
      npcId: string;
    }) => npcsApi.toggleVisibility(campaignId, npcId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId] });
      toast.success(t('hk.npc.visibilityUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.visibilityUpdateFailed'));
    },
  });
}

// NPC Notes

export function useAddNpcNote() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      data,
    }: {
      campaignId: string;
      npcId: string;
      data: CreateNoteRequest;
    }) => npcsApi.addNote(campaignId, npcId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId],
      });
      toast.success(t('hk.npc.noteAdded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.noteAddFailed'));
    },
  });
}

export function useUpdateNpcNote() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      npcId,
      noteId,
      data,
    }: {
      campaignId: string;
      npcId: string;
      noteId: string;
      data: UpdateNoteRequest;
    }) => npcsApi.updateNote(campaignId, npcId, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId],
      });
      toast.success(t('hk.npc.noteUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.noteUpdateFailed'));
    },
  });
}

export function useDeleteNpcNote() {
  const queryClient = useQueryClient();
  const t = useT();

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
        queryKey: ['campaigns', variables.campaignId, 'npcs', variables.npcId],
      });
      toast.success(t('hk.npc.noteDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.npc.noteDeleteFailed'));
    },
  });
}

// Aliases
export function useNpcNotes(campaignId: string, npcId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'npcs', npcId, 'notes'],
    queryFn: async () => {
      const response = await npcsApi.getById(campaignId, npcId);
      return response.data?.notes ?? [];
    },
    enabled: !!campaignId && !!npcId,
  });
}

export const useSetNpcVisibility = useToggleNpcVisibility;
