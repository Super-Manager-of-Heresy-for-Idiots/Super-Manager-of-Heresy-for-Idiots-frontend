import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField } from '@/components/ordo';
import { useInstantiateBlueprint } from '@/hooks/useCampaignBlueprints';
import { useT } from '@/i18n/I18nContext';
import type { CampaignBlueprintResponse } from '@/types';
import s from './blueprints.module.css';

interface InstantiateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blueprint: CampaignBlueprintResponse;
}

export function InstantiateModal({ open, onOpenChange, blueprint }: InstantiateModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const instMutation = useInstantiateBlueprint();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setName('');
    setDescription('');
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    instMutation.mutate(
      { id: blueprint.id, data: { name: name.trim(), description: description.trim() || undefined } },
      {
        onSuccess: (res) => {
          reset();
          onOpenChange(false);
          const campaignId = res.data?.id;
          if (campaignId) navigate(`/campaigns/${campaignId}`);
        },
      },
    );
  };

  const footer = (
    <div className="ao-row ao-justify-end ao-gap-8">
      <button className="ao-btn ao-btn--ghost" onClick={() => handleClose(false)} disabled={instMutation.isPending}>
        {t('common.cancel')}
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleSubmit}
        disabled={!name.trim() || instMutation.isPending}
      >
        {instMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {instMutation.isPending ? t('bp.inst.submitting') : t('bp.inst.submit')}
      </button>
    </div>
  );

  return (
    <ModalScene
      open={open}
      onOpenChange={handleClose}
      overline={blueprint.title}
      title={t('bp.inst.title')}
      sub={t('bp.inst.subtitle')}
      rune="hex"
      footer={footer}
    >
      <div className={s.modalForm}>
        <OrdoField label={t('bp.inst.name')} required>
          <input
            className="ao-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('bp.inst.namePlaceholder')}
            autoFocus
          />
        </OrdoField>
        <OrdoField label={t('bp.inst.description')}>
          <textarea
            className="ao-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('bp.inst.descriptionPlaceholder')}
          />
        </OrdoField>
      </div>
    </ModalScene>
  );
}
