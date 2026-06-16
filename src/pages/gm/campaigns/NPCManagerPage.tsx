import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, Rune, EmptyVault, ErrorAltar } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle } from '@/components/narrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCampaignNpcs,
  useCreateNpc,
  useSetNpcVisibility,
} from '@/hooks/useNpcs';
import { useCampaignReferenceContent, useCampaignReferenceSpells } from '@/hooks/useHomebrewCampaign';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { NpcResponse } from '@/types';
import { NpcFormFields, type NpcFormState } from './NpcFormFields';
import {
  emptyNpcForm,
  buildNpcPayload,
  isNpcFormValid,
} from './NpcFormFields.helpers';
import s from './NPCManagerPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

const GLYPH_POOL = ['helm', 'shield', 'sigil-1', 'sigil-2', 'sigil-3', 'flame', 'sword', 'eye'];

function glyphForNpc(id: string): string {
  const idx = id.charCodeAt(0) % GLYPH_POOL.length;
  return GLYPH_POOL[idx];
}

/* ── page ────────────────────────────────────────────────────── */

export default function NPCManagerPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: npcs, isLoading, error, refetch } = useCampaignNpcs(campaignId!);
  const createMutation = useCreateNpc();
  const visibilityMutation = useSetNpcVisibility();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NpcFormState>(emptyNpcForm);
  const patch = (p: Partial<NpcFormState>) => setForm((prev) => ({ ...prev, ...p }));
  const resetForm = () => setForm(emptyNpcForm());

  const { data: refData } = useCampaignReferenceContent(campaignId!);
  const { data: spells = [], isLoading: spellsLoading } = useCampaignReferenceSpells(
    campaignId!,
    form.classId || undefined,
  );
  const { data: monsters = [] } = useCampaignMonsters(campaignId!);

  const handleCreate = () => {
    createMutation.mutate(
      { campaignId: campaignId!, data: buildNpcPayload(form) },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  const sourceLabel = (npc: NpcResponse): string | null => {
    if (npc.sourceType === 'CLASS_BASED') {
      const who = [npc.race?.name, npc.characterClass?.name].filter(Boolean).join(' ');
      const lvl = npc.level != null ? t('camp2.npcForm.levelShort', { n: npc.level }) : '';
      return [who, lvl].filter(Boolean).join(' · ') || null;
    }
    if (npc.sourceType === 'MONSTER_BASED') {
      return npc.sourceMonster?.name ?? t('camp2.npcForm.source.monster');
    }
    return null;
  };

  const toggleVisibility = (npc: NpcResponse) => {
    visibilityMutation.mutate({
      campaignId: campaignId!,
      npcId: npc.id,
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  const backTo = `/campaigns/${campaignId}`;
  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.header}>
          <div>
            <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.npcMgr.overline')}</p>
            <h3 className={cn('ao-h3', s.title)}>{t('camp2.npcMgr.title')}</h3>
          </div>
        </div>
        <div className={s.skelList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW40H14)} />
              <div className={cn('ao-ph', s.phW60H18)} />
              <div className={cn('ao-ph', s.phW30H14)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
        <ErrorAltar
          title={t('camp2.npcMgr.loadError')}
          onRetry={() => refetch()}
          retryLabel={t('common.retry')}
        />
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.npcMgr.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.npcMgr.title')}</h3>
          <p className={cn('ao-italic', s.subtitle)}>
            {t('camp2.npcMgr.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp2.npcMgr.newNpc')}</span>
        </button>
      </div>

      {/* NPC List */}
      {!npcs || npcs.length === 0 ? (
        <EmptyVault
          glyph="helm"
          title={t('camp2.npcMgr.empty.title')}
          body={t('camp2.npcMgr.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp2.npcMgr.newNpc')}</span>
            </button>
          }
        />
      ) : (
        <div className={s.list}>
          {npcs.map((npc) => {
            const glyph = glyphForNpc(npc.id);
            const srcLabel = sourceLabel(npc);
            return (
              <OrdoPanel key={npc.id} frame padding={0}>
                <div className={s.cardPad}>
                  {/* Top row: icon box + name block + visibility */}
                  <div className={s.topRow}>
                    {/* Icon box */}
                    <div className={cn(s.iconBox, !npc.isVisibleToPlayers && s.dimmed)}>
                      <Rune kind={glyph} size={22} color="var(--gold)" />
                    </div>

                    {/* Name block */}
                    <div className={s.nameBlock}>
                      <div className={s.idRow}>
                        <CodexID>{npc.id.slice(0, 8).toUpperCase()}</CodexID>
                        <VisibilityToggle
                          visible={npc.isVisibleToPlayers}
                          onToggle={() => toggleVisibility(npc)}
                        />
                      </div>
                      <h5 className={cn('ao-h5', s.npcName)}>
                        {npc.name}
                      </h5>
                      {srcLabel && (
                        <div className={s.sourceBadge}>
                          <Rune
                            kind={npc.sourceType === 'MONSTER_BASED' ? 'flame' : 'helm'}
                            size={10}
                            color="var(--ink-faint)"
                          />
                          <span>{srcLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-column description grid */}
                  <div className={cn('ao-rgrid', s.descGrid)}>
                    {/* Public description */}
                    <div className={s.descBox}>
                      <div className={s.descHead}>
                        <Rune kind="eye" size={10} color="var(--ink-faint)" />
                        <span className={cn('ao-overline', s.descLabel)}>
                          {t('camp2.npcMgr.publicLabel')}
                        </span>
                      </div>
                      <p className={s.descText}>
                        {npc.publicDescription || <span className={cn('ao-italic', s.descEmpty)}>{t('camp2.npcMgr.noPublicDescription')}</span>}
                      </p>
                    </div>

                    {/* Private description */}
                    <div className={s.descBoxPrivate}>
                      <div className={s.descHead}>
                        <Rune kind="lock" size={10} color="rgba(180,80,80,0.6)" />
                        <span className={cn('ao-overline', s.descLabelPrivate)}>
                          {t('camp2.npcMgr.privateLabel')}
                        </span>
                      </div>
                      <p className={s.descText}>
                        {npc.privateDescription || <span className={cn('ao-italic', s.descEmpty)}>{t('camp2.npcMgr.noPrivateNotes')}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className={s.cardFooter}>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => navigate(`/campaigns/${campaignId}/npcs/${npc.id}`)}
                  >
                    <Rune kind="scroll" size={10} /> {t('camp2.npcMgr.open')}
                  </button>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => toggleVisibility(npc)}
                    disabled={visibilityMutation.isPending}
                  >
                    <Rune kind={npc.isVisibleToPlayers ? 'lock' : 'eye'} size={10} />
                    {npc.isVisibleToPlayers ? ` ${t('camp2.npcMgr.hide')}` : ` ${t('camp2.npcMgr.reveal')}`}
                  </button>
                </div>
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.npcMgr.dialog.title')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogScroll}>
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
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('camp2.npcMgr.withhold')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!isNpcFormValid(form) || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('camp2.npcMgr.inscribe')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
