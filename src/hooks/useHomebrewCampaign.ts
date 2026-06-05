import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { homebrewCampaignApi } from '@/api/homebrew-campaign.api';
import { homebrewApi } from '@/api/homebrew.api';
import type {
  AttachHomebrewRequest,
  PinHomebrewVersionRequest,
  RateHomebrewRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useAttachHomebrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: AttachHomebrewRequest }) =>
      homebrewCampaignApi.attach(campaignId, data),
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
    mutationFn: ({ campaignId, packageId }: { campaignId: string; packageId: string }) =>
      homebrewCampaignApi.detach(campaignId, packageId),
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
      const response = await homebrewCampaignApi.listAttached(campaignId);
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
      packageId,
      data,
    }: {
      campaignId: string;
      packageId: string;
      data: PinHomebrewVersionRequest;
    }) => homebrewCampaignApi.pinVersion(campaignId, packageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'homebrew'] });
      toast.success('Version pinned!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to pin version');
    },
  });
}

export function useAvailableContent(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'available-content'],
    queryFn: async () => {
      const response = await homebrewCampaignApi.getAvailableContent(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignReferenceContent(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'reference-content'],
    queryFn: async () => {
      const [classes, races, backgrounds, skills, statTypes] = await Promise.all([
        homebrewCampaignApi.getReferenceClasses(campaignId),
        homebrewCampaignApi.getReferenceRaces(campaignId),
        homebrewCampaignApi.getReferenceBackgrounds(campaignId),
        homebrewCampaignApi.getReferenceSkills(campaignId),
        homebrewCampaignApi.getReferenceStatTypes(campaignId),
      ]);

      return {
        classes: classes.data ?? [],
        races: races.data ?? [],
        backgrounds: backgrounds.data ?? [],
        skills: skills.data ?? [],
        statTypes: statTypes.data ?? [],
      };
    },
    enabled: !!campaignId,
  });
}

export function useHomebrewLibrary() {
  return useQuery({
    queryKey: ['homebrew-library'],
    queryFn: async () => {
      const response = await homebrewApi.getLibrary();
      return response.data;
    },
  });
}

export function useRateHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: RateHomebrewRequest }) =>
      homebrewApi.rate(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-library'] });
      toast.success('Rating submitted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to rate');
    },
  });
}

export function useHomebrewVersions(packageId: string | undefined) {
  return useQuery({
    queryKey: ['homebrew-versions', packageId],
    queryFn: async () => {
      const response = await homebrewApi.getPackageDetail(packageId!);
      return response.data;
    },
    enabled: !!packageId,
  });
}
