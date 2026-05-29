import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { artifactsApi } from '@/api/artifacts.api';
import type { CreateArtifactRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useArtifacts() {
  return useQuery({
    queryKey: ['artifacts'],
    queryFn: async () => {
      const response = await artifactsApi.list();
      return response.data;
    },
  });
}

export function useArtifact(id: string) {
  return useQuery({
    queryKey: ['artifacts', id],
    queryFn: async () => {
      const response = await artifactsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArtifactRequest) => artifactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      toast.success('Artifact created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create artifact');
    },
  });
}

export function useUpdateArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateArtifactRequest }) =>
      artifactsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      queryClient.invalidateQueries({ queryKey: ['artifacts', variables.id] });
      toast.success('Artifact updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update artifact');
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => artifactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      toast.success('Artifact deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete artifact');
    },
  });
}
