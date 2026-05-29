import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { teamsApi } from '@/api/teams.api';
import type { CreateTeamRequest, JoinTeamRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamsApi.list();
      return response.data;
    },
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: async () => {
      const response = await teamsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamRequest) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to create team';
      toast.error(message);
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTeamRequest }) =>
      teamsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', variables.id] });
      toast.success('Team updated successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update team';
      toast.error(message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to delete team';
      toast.error(message);
    },
  });
}

export function useRegenerateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.regenerateInvite(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Invite code regenerated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to regenerate invite code';
      toast.error(message);
    },
  });
}

export function useInviteCode(id: string) {
  return useQuery({
    queryKey: ['teams', id, 'invite-code'],
    queryFn: async () => {
      const response = await teamsApi.getInviteCode(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useJoinTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinTeamRequest) => teamsApi.join(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      const teamName = response.data?.name || 'the team';
      toast.success(`Joined team ${teamName}!`);
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to join team';
      toast.error(message);
    },
  });
}
