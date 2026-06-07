import { useNavigate } from 'react-router-dom';
import { CharacterCreationWizard } from '@/features/character-wizard/CharacterCreationWizard';
import { useCreateTemplate, useGlobalReferenceContent } from '@/hooks/useTemplates';
import type { CreateFullCharacterRequest } from '@/api/characters-full.api';

export default function TemplateWizardPage() {
  const navigate = useNavigate();
  const { data: reference, isLoading } = useGlobalReferenceContent();
  const createTemplate = useCreateTemplate();

  const backToList = () => navigate('/characters/templates');

  if (isLoading || !reference) {
    return (
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 24, marginBottom: 12 }} />
        <div className="ao-ph" style={{ width: '60%', height: 14 }} />
      </div>
    );
  }

  const handleSubmit = (req: CreateFullCharacterRequest) => {
    // Templates live outside campaigns — strip the field.
    const { campaignId: _campaignId, ...rest } = req;
    void _campaignId;
    createTemplate.mutate(rest as CreateFullCharacterRequest, {
      onSuccess: (res) => {
        const id = res.data?.id;
        if (id) navigate(`/characters/templates/${id}`);
        else backToList();
      },
    });
  };

  return (
    <CharacterCreationWizard
      campaignId=""
      availableClasses={reference.availableClasses}
      availableRaces={reference.availableRaces}
      availableSkills={[]}
      availableFeats={[]}
      availableItemTypes={[]}
      referenceClasses={reference.classes}
      referenceRaces={reference.races}
      referenceBackgrounds={reference.backgrounds}
      referenceProficiencySkills={reference.skills}
      referenceStatTypes={reference.statTypes}
      availableCurrencies={reference.currencies}
      submitting={createTemplate.isPending}
      onSubmit={handleSubmit}
      onCancel={backToList}
    />
  );
}
