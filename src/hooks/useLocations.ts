import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { locationsApi } from '@/api/locations.api';
import type {
  CreateLocationRequest,
  UpdateLocationRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignLocations(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'locations'],
    queryFn: async () => {
      const response = await locationsApi.list(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateLocationRequest }) =>
      locationsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      toast.success('Location created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create location');
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      locationId,
      data,
    }: {
      campaignId: string;
      locationId: string;
      data: UpdateLocationRequest;
    }) => locationsApi.update(campaignId, locationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      toast.success('Location updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update location');
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, locationId }: { campaignId: string; locationId: string }) =>
      locationsApi.delete(campaignId, locationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'locations'] });
      toast.success('Location deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    },
  });
}
