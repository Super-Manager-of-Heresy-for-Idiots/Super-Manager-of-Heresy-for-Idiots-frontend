import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField } from '@/components/ordo';
import { useCreateUniverse } from '@/hooks/useUniverses';
import { useT } from '@/i18n/I18nContext';
import type { UniverseResponse } from '@/types';
import s from './blueprints.module.css';

interface CreateUniverseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (universe: UniverseResponse) => void;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function CreateUniverseModal({ open, onOpenChange, onCreated }: CreateUniverseModalProps) {
  const t = useT();
  const createMutation = useCreateUniverse();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const reset = () => {
    setSlug('');
    setName('');
    setDescription('');
    setSlugTouched(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const finalSlug = (slug.trim() || slugify(name));
  const canSubmit = !!finalSlug && !!name.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(
      { slug: finalSlug, name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (res) => {
          reset();
          onOpenChange(false);
          if (res.data) onCreated?.(res.data);
        },
      },
    );
  };

  const footer = (
    <div className="ao-row ao-justify-end ao-gap-8">
      <button className="ao-btn ao-btn--ghost" onClick={() => handleClose(false)} disabled={createMutation.isPending}>
        {t('common.cancel')}
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleSubmit}
        disabled={!canSubmit || createMutation.isPending}
      >
        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('bp.universe.create')}
      </button>
    </div>
  );

  return (
    <ModalScene
      open={open}
      onOpenChange={handleClose}
      title={t('bp.universe.title')}
      rune="cir-dot"
      footer={footer}
    >
      <div className={s.modalForm}>
        <OrdoField label={t('bp.universe.name')} required>
          <input
            className="ao-input"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('bp.universe.namePlaceholder')}
            autoFocus
          />
        </OrdoField>
        <OrdoField label={t('bp.universe.slug')} required hint={t('bp.universe.slugHint')}>
          <input
            className="ao-input"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder={t('bp.universe.slugPlaceholder')}
          />
        </OrdoField>
        <OrdoField label={t('bp.universe.description')}>
          <textarea
            className="ao-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </OrdoField>
      </div>
    </ModalScene>
  );
}
