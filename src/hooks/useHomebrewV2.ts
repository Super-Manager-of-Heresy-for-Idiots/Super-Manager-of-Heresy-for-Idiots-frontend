import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { homebrewV2Api } from '@/api/homebrew-v2.api';
import type {
  RateHomebrewRequest,
  AttachHomebrewRequest,
  PinHomebrewVersionRequest,
  CreateOverrideHomebrewRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useHomebrewLibrary() {
  return useQuery({
    queryKey: ['homebrew-library'],
    queryFn: async () => {
      const response = await homebrewV2Api.getLibrary();
      return response.data;
    },
  });
}

export function useRateHomebrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: RateHomebrewRequest }) =>
      homebrewV2Api.rate(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-library'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success('Rating submitted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    },
  });
}

export function useAttachHomebrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: AttachHomebrewRequest }) =>
      homebrewV2Api.attach(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'homebrew'] });
      toast.success('Homebrew attached to campaign!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to attach homebrew');
    },
  });
}

export function useDetachHomebrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, activationId }: { campaignId: string; activationId: string }) =>
      homebrewV2Api.detach(campaignId, activationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'homebrew'] });
      toast.success('Homebrew detached from campaign!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to detach homebrew');
    },
  });
}

export function useAttachedHomebrew(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'homebrew'],
    queryFn: async () => {
      const response = await homebrewV2Api.listAttached(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function usePinHomebrewVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      activationId,
      data,
    }: {
      campaignId: string;
      activationId: string;
      data: PinHomebrewVersionRequest;
    }) => homebrewV2Api.pinVersion(campaignId, activationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'homebrew'] });
      toast.success('Version pinned!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to pin version');
    },
  });
}

export function useCreateOverrideHomebrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOverrideHomebrewRequest) =>
      homebrewV2Api.createOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-library'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success('Override doctrine created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create override');
    },
  });
}

export function useHomebrewVersions(packageId: string) {
  return useQuery({
    queryKey: ['homebrew', packageId, 'versions'],
    queryFn: async () => {
      const response = await homebrewV2Api.getVersions(packageId);
      return response.data;
    },
    enabled: !!packageId,
  });
}
