import { useNavigate } from 'react-router-dom';
import { CharacterCreationWizard } from '@/features/character-wizard/CharacterCreationWizard';
import { useCreateTemplate, useGlobalReferenceContent } from '@/hooks/useTemplates';
import type {
  CreateFullCharacterRequest,
  CreateTemplateCharacterRequest,
} from '@/api/characters-full.api';
import { cn } from '@/lib/utils';
import s from './TemplateWizardPage.module.css';

export default function TemplateWizardPage() {
  const navigate = useNavigate();
  const { data: reference, isLoading } = useGlobalReferenceContent();
  const createTemplate = useCreateTemplate();

  const backToList = () => navigate('/characters/templates');

  if (isLoading || !reference) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.skelTitle)} />
        <div className={cn('ao-ph', s.skelLine)} />
      </div>
    );
  }

  const handleSubmit = (req: CreateFullCharacterRequest) => {
    // Templates live outside campaigns — strip the field.
    const { campaignId: _campaignId, ...rest } = req;
    void _campaignId;
    createTemplate.mutate(rest as CreateTemplateCharacterRequest, {
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
      referenceSpells={reference.spells}
      availableCurrencies={reference.currencies}
      submitting={createTemplate.isPending}
      onSubmit={handleSubmit}
      onCancel={backToList}
    />
  );
}
