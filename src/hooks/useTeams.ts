import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { teamsApi } from '@/api/teams.api';
import type { JoinTeamRequest, ApiError } from '@/types';
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
