import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { useAuthStore } from '@/store/authStore';
import { useCampaign } from '@/hooks/useCampaigns';
import { useAvailableContent, useCampaignReferenceContent } from '@/hooks/useHomebrewCampaign';
import { useCreateFullCharacter } from '@/hooks/useCreateFullCharacter';
import { useReferenceCurrencies } from '@/hooks/useTemplates';
import { CharacterCreationWizard } from '@/features/character-wizard/CharacterCreationWizard';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';
import { cn } from '@/lib/utils';
import s from './CharacterCreationWizardPage.module.css';

export default function CharacterCreationWizardPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuthStore();
  const { data: campaign, isLoading, error } = useCampaign(campaignId!);
  const { data: availableContent, isLoading: contentLoading } = useAvailableContent(campaignId!);
  const { data: referenceContent, isLoading: referenceLoading } = useCampaignReferenceContent(campaignId!);
  const { data: currencies } = useReferenceCurrencies();
  const createMutation = useCreateFullCharacter();

  const backToDashboard = () => navigate(`/campaigns/${campaignId}`);

  if (isLoading || contentLoading || referenceLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.loadingPanel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.phTitle)} />
        <div className={cn('ao-ph', s.phLine)} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className={s.stateBox}>
        <p className={cn('ao-italic', s.stateText)}>
          {t('camp.create.loadError')}
        </p>
        <button className="ao-btn" onClick={backToDashboard}>{t('camp.create.return')}</button>
      </div>
    );
  }

  // Creation is for players, only while the campaign is active.
  const isPlayer = user?.role === 'PLAYER';
  if (!isPlayer || campaign.status !== 'ACTIVE') {
    return (
      <div className={s.stateBox}>
        <p className={cn('ao-italic', s.stateText)}>
          {t('camp.create.notAvailable')}
        </p>
        <button className="ao-btn" onClick={backToDashboard}>{t('camp.create.returnToCampaign')}</button>
      </div>
    );
  }

  const handleSubmit = (req: CreateFullCharacterRequest) => {
    createMutation.mutate(req, {
      onSuccess: () => backToDashboard(),
    });
  };

  return (
    <CharacterCreationWizard
      campaignId={campaignId!}
      availableClasses={availableContent?.classes ?? []}
      availableRaces={availableContent?.races ?? []}
      availableSkills={availableContent?.skills ?? []}
      availableFeats={availableContent?.feats ?? []}
      availableItemTypes={availableContent?.itemTypes ?? []}
      referenceClasses={referenceContent?.classes ?? []}
      referenceRaces={referenceContent?.races ?? []}
      referenceBackgrounds={referenceContent?.backgrounds ?? []}
      referenceProficiencySkills={referenceContent?.skills ?? []}
      referenceStatTypes={referenceContent?.statTypes ?? []}
      referenceSpells={referenceContent?.spells ?? []}
      availableCurrencies={currencies ?? []}
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
      onCancel={backToDashboard}
    />
  );
}
