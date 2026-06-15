import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { campaignsApi } from '@/api/campaigns.api';
import { useT } from '@/i18n/I18nContext';
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

export function useCampaigns(enabled = true) {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await campaignsApi.list();
      return response.data?.content;
    },
    enabled,
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
  const t = useT();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.deleteFailed');
      toast.error(message);
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.createFailed');
      toast.error(message);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
      toast.success(t('hk.campaign.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.updateFailed');
      toast.error(message);
    },
  });
}

export function useSetCampaignStatus() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetCampaignStatusRequest }) =>
      campaignsApi.setStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.statusUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.statusUpdateFailed');
      toast.error(message);
    },
  });
}

export function useJoinCampaign() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (data: JoinCampaignRequest) => campaignsApi.join(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      const campaignName = response.data?.name || t('hk.campaign.joinFallback');
      toast.success(t('hk.campaign.joined', { name: campaignName }));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.joinFailed');
      toast.error(message);
    },
  });
}

export function useLeaveCampaign() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.left'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.leaveFailed');
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
  const t = useT();

  return useMutation({
    mutationFn: (id: string) => campaignsApi.regenerateInviteCode(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.inviteRegenerated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.inviteRegenFailed');
      toast.error(message);
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, userId }: { campaignId: string; userId: string }) =>
      campaignsApi.kick(campaignId, { userId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('hk.campaign.memberKicked'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.kickFailed');
      toast.error(message);
    },
  });
}

export function useReassignCharacter() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId: string; characterId: string; data: ReassignCharacterRequest }) =>
      campaignsApi.reassignCharacter(campaignId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(t('hk.campaign.charReassigned'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.reassignFailed');
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
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateStorageContainerRequest }) =>
      campaignsApi.createStorage(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      toast.success(t('hk.campaign.storageCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.storageCreateFailed');
      toast.error(message);
    },
  });
}

export function useDepositItem() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, storageId, instanceId, quantity }: { campaignId: string; storageId: string; instanceId: string; characterId?: string; quantity?: number }) =>
      campaignsApi.depositItem(campaignId, storageId, instanceId, quantity),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      if (variables.characterId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      }
      toast.success(t('hk.campaign.itemDeposited'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.depositFailed');
      toast.error(message);
    },
  });
}

export function useTakeItem() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, storageId, instanceId, characterId, quantity }: { campaignId: string; storageId: string; instanceId: string; characterId: string; quantity?: number }) =>
      campaignsApi.takeItem(campaignId, storageId, instanceId, characterId, quantity),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'shared-storage'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.campaign.itemTaken'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.campaign.takeFailed');
      toast.error(message);
    },
  });
}
