import { useAuthStore } from '@/store/authStore';

export interface CampaignRole {
  /** Game Master or Admin — may run and edit the campaign. */
  isGm: boolean;
  /** Plain player — owns characters, has no campaign tools. */
  isPlayer: boolean;
  /** Current user id, for owner checks against character.ownerId. */
  userId: string | undefined;
}

/**
 * Single source of truth for role checks inside a campaign.
 * Replaces the ad-hoc `user?.role === 'GAME_MASTER' || user?.role === 'ADMIN'`
 * repeated across the campaign pages, so navigation and page bodies can never
 * disagree about what a role may see.
 *
 * Campaign ownership (`campaign.isCreator`) stays on the campaign payload —
 * it is data about one campaign, not a role of the user.
 */
export function useCampaignRole(): CampaignRole {
  const { user } = useAuthStore();
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  return { isGm, isPlayer: user?.role === 'PLAYER', userId: user?.id };
}
