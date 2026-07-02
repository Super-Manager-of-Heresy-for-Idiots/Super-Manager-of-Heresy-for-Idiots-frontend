import type { CampaignDetailResponse, UserResponse } from '@/types';

export function isCampaignGmOrAdmin(
  user: Pick<UserResponse, 'id' | 'role'> | null | undefined,
  campaign: CampaignDetailResponse | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return campaign?.members?.some(
    (member) => !member.kicked && member.userId === user.id && member.roleInCampaign === 'GM',
  ) ?? false;
}
