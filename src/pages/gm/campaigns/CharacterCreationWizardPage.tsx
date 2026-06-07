import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@/i18n/I18nContext';
import { useAuthStore } from '@/store/authStore';
import { useCampaign } from '@/hooks/useCampaigns';
import { useAvailableContent, useCampaignReferenceContent } from '@/hooks/useHomebrewCampaign';
import { useCreateFullCharacter } from '@/hooks/useCreateFullCharacter';
import { useReferenceCurrencies } from '@/hooks/useTemplates';
import { CharacterCreationWizard } from '@/features/character-wizard/CharacterCreationWizard';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';

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
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 24, marginBottom: 12 }} />
        <div className="ao-ph" style={{ width: '60%', height: 14 }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      availableCurrencies={currencies ?? []}
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
      onCancel={backToDashboard}
    />
  );
}
