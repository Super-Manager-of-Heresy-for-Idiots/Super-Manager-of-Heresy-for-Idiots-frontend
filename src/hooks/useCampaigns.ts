import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { campaignsApi } from '@/api/campaigns.api';
import type {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  SetCampaignStatusRequest,
  JoinCampaignRequest,
  KickMemberRequest,
  ReassignCharacterRequest,
  CreateStorageContainerRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await campaignsApi.list();
      return response.data?.content;
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const response = await campaignsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to delete campaign';
      toast.error(message);
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to create campaign';
      toast.error(message);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
      toast.success('Campaign updated successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update campaign';
      toast.error(message);
    },
  });
}

export function useSetCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetCampaignStatusRequest }) =>
      campaignsApi.setStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign status updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update campaign status';
      toast.error(message);
    },
  });
}

export function useJoinCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinCampaignRequest) => campaignsApi.join(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      const campaignName = response.data?.name || 'the campaign';
      toast.success(`Joined campaign ${campaignName}!`);
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to join campaign';
      toast.error(message);
    },
  });
}

export function useLeaveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Left campaign successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to leave campaign';
      toast.error(message);
    },
  });
}

export function useCampaignInviteCode(id: string) {
  return useQuery({
    queryKey: ['campaigns', id, 'invite-code'],
    queryFn: async () => {
      const response = await campaignsApi.getInviteCode(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useRegenerateCampaignInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.regenerateInviteCode(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Invite code regenerated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to regenerate invite code';
      toast.error(message);
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, userId }: { campaignId: string; userId: string }) =>
      campaignsApi.kick(campaignId, { userId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Member kicked from campaign!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to kick member';
      toast.error(message);
    },
  });
}

export function useReassignCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId: string; characterId: string; data: ReassignCharacterRequest }) =>
      campaignsApi.reassignCharacter(campaignId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Character reassigned successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to reassign character';
      toast.error(message);
    },
  });
}

export function useCampaignStorage(id: string) {
  return useQuery({
    queryKey: ['campaigns', id, 'shared-storage'],
    queryFn: async () => {
      const response = await campaignsApi.getStorage(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateStorageContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateStorageContainerRequest }) =>
      campaignsApi.createStorage(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      toast.success('Storage container created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to create storage container';
      toast.error(message);
    },
  });
}

export function useDepositItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, storageId, instanceId }: { campaignId: string; storageId: string; instanceId: string }) =>
      campaignsApi.depositItem(campaignId, storageId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      toast.success('Item deposited to storage!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to deposit item';
      toast.error(message);
    },
  });
}

export function useTakeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, storageId, instanceId, characterId }: { campaignId: string; storageId: string; instanceId: string; characterId: string }) =>
      campaignsApi.takeItem(campaignId, storageId, instanceId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      toast.success('Item taken from storage!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to take item';
      toast.error(message);
    },
  });
}
