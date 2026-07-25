import { Navigate, useParams } from 'react-router-dom';

interface CampaignSectionRedirectProps {
  /** New path relative to `/campaigns/:campaignId`, e.g. `world/maps`. */
  to: string;
}

/**
 * Keeps links and bookmarks alive after a section moved inside the campaign
 * tree. Mounted on a splat route (`maps/*`), it carries the remaining segments
 * over, so `/maps/42/edit` lands on `/world/maps/42/edit`.
 */
export function CampaignSectionRedirect({ to }: CampaignSectionRedirectProps) {
  const params = useParams();
  const target = [`/campaigns/${params.campaignId}`, to, params['*']].filter(Boolean).join('/');
  return <Navigate to={target} replace />;
}
