import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateNpc } from '@/hooks/useNpcs';
import { useCampaignReferenceContent, useCampaignReferenceSpells } from '@/hooks/useHomebrewCampaign';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { useT } from '@/i18n/I18nContext';
import type { NpcResponse } from '@/types';
import { NpcFormFields, type NpcFormState } from './NpcFormFields';
import { emptyNpcForm, buildNpcPayload, isNpcFormValid } from './NpcFormFields.helpers';
import s from './NpcCreateDialog.module.css';

interface Props {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Вызывается после успешного создания — например, чтобы сразу разместить NPC в локации. */
  onCreated?: (npc: NpcResponse) => void;
}

/**
 * Диалог создания NPC. Вынесен из NPCManagerPage, чтобы мастер мог заводить NPC
 * там, где он о нём думает — в том числе прямо из панели управления миром.
 */
export function NpcCreateDialog({ campaignId, open, onOpenChange, onCreated }: Props) {
  const t = useT();
  const createMutation = useCreateNpc();
  const [form, setForm] = useState<NpcFormState>(emptyNpcForm);
  const patch = (p: Partial<NpcFormState>) => setForm((prev) => ({ ...prev, ...p }));

  const { data: refData } = useCampaignReferenceContent(campaignId);
  const { data: spells = [], isLoading: spellsLoading } = useCampaignReferenceSpells(
    campaignId,
    form.classId || undefined,
  );
  const { data: monsters = [] } = useCampaignMonsters(campaignId);

  const close = () => {
    onOpenChange(false);
    setForm(emptyNpcForm());
  };

  const handleCreate = () => {
    createMutation.mutate(
      { campaignId, data: buildNpcPayload(form) },
      {
        onSuccess: (response) => {
          if (response.data) onCreated?.(response.data);
          close();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('camp2.npcMgr.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className={s.scroll}>
          <NpcFormFields
            value={form}
            onChange={patch}
            classes={refData?.classes ?? []}
            races={refData?.races ?? []}
            spells={spells}
            monsters={monsters}
            spellsLoading={spellsLoading}
          />
        </div>
        <DialogFooter>
          <button className="ao-btn ao-btn--ghost" onClick={close} disabled={createMutation.isPending}>
            {t('camp2.npcMgr.withhold')}
          </button>
          <button
            type="button"
            className="ao-btn ao-btn--primary"
            onClick={handleCreate}
            disabled={!isNpcFormValid(form) || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('camp2.npcMgr.inscribe')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
