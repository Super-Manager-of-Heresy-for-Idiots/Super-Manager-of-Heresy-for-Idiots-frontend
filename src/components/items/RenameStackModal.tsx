import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useRenameItem } from '@/hooks/useInventory';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ItemInstanceResponse } from '@/types';
import s from './RenameStackModal.module.css';

/* ── Props ─────────────────────────────────────────────────────── */

interface RenameStackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemInstanceResponse;
  campaignId: string;
  characterId: string;
}

/* ── Mode option data ──────────────────────────────────────────── */

const MODES: { value: boolean; labelKey: string; descKey: string; glyph: string }[] = [
  {
    value: true,
    labelKey: 'cmp.rename.modeWholeLabel',
    descKey: 'cmp.rename.modeWholeDesc',
    glyph: 'square',
  },
  {
    value: false,
    labelKey: 'cmp.rename.modeSplitLabel',
    descKey: 'cmp.rename.modeSplitDesc',
    glyph: 'diamond',
  },
];

/* ── Component ─────────────────────────────────────────────────── */

export function RenameStackModal({
  open,
  onOpenChange,
  item,
  campaignId,
  characterId,
}: RenameStackModalProps) {
  const t = useT();
  const renameMutation = useRenameItem();

  const [renameEntireStack, setRenameEntireStack] = useState(true);
  const [newName, setNewName] = useState('');

  const resetForm = () => {
    setRenameEntireStack(true);
    setNewName('');
  };

  const handleRename = () => {
    if (!newName.trim()) return;

    renameMutation.mutate(
      {
        campaignId,
        characterId,
        instanceId: item.id,
        data: {
          customName: newName.trim(),
          renameEntireStack,
        },
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const displayName = item.customName ?? item.displayName;

  /* ── Footer ── */

  const footer = (
    <div className="ao-row ao-justify-end ao-gap-8">
      <button
        className="ao-btn ao-btn--ghost"
        onClick={() => handleOpenChange(false)}
        disabled={renameMutation.isPending}
      >
        {t('common.cancel')}
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleRename}
        disabled={!newName.trim() || renameMutation.isPending}
      >
        {renameMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {t('cmp.rename.rename')}
      </button>
    </div>
  );

  /* ── Render ── */

  return (
    <ModalScene
      open={open}
      onOpenChange={handleOpenChange}
      overline={t('cmp.rename.overline')}
      title={t('cmp.rename.title')}
      sub={displayName}
      rune="scroll"
      footer={footer}
    >
      <div className={s.body}>
        {/* Mode selection */}
        <OrdoField label={t('cmp.rename.mode')}>
          <div className={s.modes}>
            {MODES.map((opt) => {
              const selected = renameEntireStack === opt.value;
              return (
                <label
                  key={String(opt.value)}
                  className={cn(s.opt, selected && s.selected)}
                >
                  <input
                    type="radio"
                    name="rename-mode"
                    value={String(opt.value)}
                    checked={selected}
                    onChange={() => setRenameEntireStack(opt.value)}
                    className={s.radio}
                  />
                  <div className={s.optInfo}>
                    <div className={s.optHead}>
                      <Rune kind={opt.glyph} size={10} color={selected ? 'var(--gold)' : 'var(--ink-quiet)'} />
                      <span className={cn(s.optLabel, selected && s.on)}>
                        {t(opt.labelKey)}
                      </span>
                    </div>
                    <div className={cn('ao-italic', s.optDesc)}>
                      {t(opt.descKey)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </OrdoField>

        {/* New name input */}
        <OrdoField label={t('cmp.rename.newName')} required>
          <input
            className="ao-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('cmp.rename.placeholder')}
            autoFocus
          />
        </OrdoField>

        {/* Preview */}
        <div className={s.preview}>
          <span className={cn('ao-codex', s.previewLabel)}>
            {t('cmp.rename.preview')}
          </span>
          <div className={s.previewName}>
            {newName.trim() || displayName}
          </div>
          {newName.trim() && (
            <div className={cn('ao-italic', s.previewOrig)}>
              {t('cmp.rename.originally', { name: item.templateName })}
            </div>
          )}
        </div>
      </div>
    </ModalScene>
  );
}
