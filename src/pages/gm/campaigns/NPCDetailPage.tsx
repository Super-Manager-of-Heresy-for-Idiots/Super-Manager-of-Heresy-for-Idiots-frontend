import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider, Placeholder } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  useNpc,
  useNpcNotes,
  useAddNpcNote,
  useSetNpcVisibility,
  useUpdateNpc,
  useDeleteNpc,
} from '@/hooks/useNpcs';
import { useCampaignReferenceContent, useCampaignReferenceSpells } from '@/hooks/useHomebrewCampaign';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import type { NpcNoteResponse, QuestStatus } from '@/types';
import { NpcFormFields, type NpcFormState } from './NpcFormFields';
import {
  emptyNpcForm,
  npcFormFromResponse,
  buildNpcPayload,
  isNpcFormValid,
} from './NpcFormFields.helpers';
import s from './NPCDetailPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

function OriginRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.originRow}>
      <span className={cn('ao-overline', s.originLabel)}>{label}</span>
      <span className={s.originValue}>{value}</span>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function NPCDetailPage() {
  const t = useT();
  const { campaignId, npcId } = useParams<{ campaignId: string; npcId: string }>();
  const backTo = `/campaigns/${campaignId}/npcs`;
  const navigate = useNavigate();
  const { data: npc, isLoading, error, refetch } = useNpc(campaignId!, npcId!);
  const { data: notes, isLoading: notesLoading } = useNpcNotes(campaignId!, npcId!);
  const addNoteMutation = useAddNpcNote();
  const visibilityMutation = useSetNpcVisibility();
  const updateMutation = useUpdateNpc();
  const deleteMutation = useDeleteNpc();

  const [noteText, setNoteText] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<NpcFormState>(emptyNpcForm);
  const patch = (p: Partial<NpcFormState>) => setForm((prev) => ({ ...prev, ...p }));

  const { data: refData } = useCampaignReferenceContent(campaignId!);
  const { data: spells = [], isLoading: spellsLoading } = useCampaignReferenceSpells(
    campaignId!,
    form.classId || undefined,
  );
  const { data: monsters = [] } = useCampaignMonsters(campaignId!);

  const openEdit = () => {
    if (!npc) return;
    setForm(npcFormFromResponse(npc));
    setEditOpen(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate(
      { campaignId: campaignId!, npcId: npcId!, data: buildNpcPayload(form) },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { campaignId: campaignId!, npcId: npcId! },
      { onSuccess: () => navigate(backTo) },
    );
  };

  const toggleVisibility = () => {
    if (!npc) return;
    visibilityMutation.mutate({
      campaignId: campaignId!,
      npcId: npcId!,
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate(
      {
        campaignId: campaignId!,
        npcId: npcId!,
        data: { content: noteText.trim() },
      },
      { onSuccess: () => setNoteText('') },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.npcs')} className={s.backLink} />
        <div className={s.skelRow}>
          <div className={s.skelLeft}>
            <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanelLg)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW30H14)} />
              <div className={cn('ao-ph', s.phW50H24)} />
              <div className={cn('ao-ph', s.phW80H14)} />
              <div className={cn('ao-ph', s.phW60H14)} />
            </div>
          </div>
          <div className={s.skelRight}>
            <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanelSm)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW60H14mb)} />
              <div className={cn('ao-ph', s.phW40H14)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !npc) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.npcs')} className={s.backLink} />
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp2.npcDetail.notFound')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  /* ── linked entities (from quest/location data on the NPC, if available) ── */
  const npcLinks = npc as typeof npc & {
    linkedQuests?: { id: string; name: string; status?: QuestStatus }[];
    linkedLocations?: { id: string; name: string }[];
  };
  const linkedQuests = npcLinks.linkedQuests ?? [];
  const linkedLocations = npcLinks.linkedLocations ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.npcs')} className={s.backLink} />
      <div className={s.cols}>
      {/* ═══ Left column ═══ */}
      <div className={s.colLeft}>
        {/* Identity block */}
        <OrdoPanel frame padding={20}>
          <div className={s.identityRow}>
            {/* Portrait placeholder */}
            <Placeholder className={s.portrait}>
              {t('camp2.npcDetail.portrait')}
            </Placeholder>

            <div className={s.identityMain}>
              <div className={s.idRow}>
                <CodexID>{npc.id.slice(0, 8).toUpperCase()}</CodexID>
                <VisibilityToggle visible={npc.isVisibleToPlayers} onToggle={toggleVisibility} />
              </div>
              <h3 className={cn('ao-h3', s.npcName)}>
                {npc.name}
              </h3>
            </div>
          </div>

          {/* Reveal button */}
          <div className={s.revealWrap}>
            <button
              className={`ao-btn ${npc.isVisibleToPlayers ? 'ao-btn--ghost' : 'ao-btn--primary'}`}
              onClick={toggleVisibility}
              disabled={visibilityMutation.isPending}
            >
              {visibilityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Rune kind={npc.isVisibleToPlayers ? 'lock' : 'eye'} size={14} color="currentColor" />
              <span className={s.ml6}>{npc.isVisibleToPlayers ? t('camp2.npcDetail.hideFromPlayers') : t('camp2.npcDetail.revealToPlayers')}</span>
            </button>
          </div>

          <div className={s.actionRow}>
            <button className={cn('ao-btn ao-btn--sm', s.actionBtn)} onClick={openEdit}>
              <Pencil size={13} />
              <span className={s.ml6}>{t('camp2.npcDetail.edit')}</span>
            </button>
            <button
              className={cn('ao-btn ao-btn--sm ao-btn--danger', s.actionBtn)}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} />
              <span className={s.ml6}>{t('camp2.npcDetail.delete')}</span>
            </button>
          </div>
        </OrdoPanel>

        {/* Public account box */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.publicAccount')} glyph="eye" tone="gold" sub={t('camp2.npcDetail.publicSub')} />
          <div className={s.boxPad}>
            <p className={s.accountText}>
              {npc.publicDescription || (
                <span className={cn('ao-italic', s.ghost)}>
                  {t('camp2.npcDetail.noPublicAccount')}
                </span>
              )}
            </p>
          </div>
        </OrdoPanel>

        {/* Private account box */}
        <OrdoPanel frame padding={0} className={s.privatePanel}>
          <PanelHeader title={t('camp2.npcDetail.privateAccount')} glyph="lock" tone="ember" sub={t('camp2.npcDetail.privateSub')} />
          <div className={s.boxPad}>
            <p className={s.accountText}>
              {npc.privateDescription || (
                <span className={cn('ao-italic', s.ghost)}>
                  {t('camp2.npcDetail.noPrivateNotes')}
                </span>
              )}
            </p>
          </div>
        </OrdoPanel>

        {/* Notes feed */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.chronicleNotes')} glyph="scroll" tone="gold" />
          <div className={s.notesBody}>
            {notesLoading ? (
              <div className="ao-breathe">
                <div className={cn('ao-ph', s.phW70H14)} />
                <div className={cn('ao-ph', s.phW50H14)} />
              </div>
            ) : !notes || notes.length === 0 ? (
              <p className={cn('ao-italic', s.notesEmpty)}>
                {t('camp2.npcDetail.noNotes')}
              </p>
            ) : (
              notes.map((note: NpcNoteResponse) => (
                <div key={note.id} className={s.note}>
                  <div className={s.noteHead}>
                    <Rune
                      kind="scroll"
                      size={10}
                      color="var(--brass)"
                    />
                    <span className={cn('ao-overline', s.noteMeta)}>
                    {note.authorUsername} - {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={s.noteText}>
                    {note.content}
                  </p>
                </div>
              ))
            )}

            <OrdoDivider glyph="diamond" />

            {/* Inline add-note */}
            <div className={s.addNoteRow}>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t('camp2.npcDetail.addNotePlaceholder')}
                className={cn('ao-input', s.grow)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNote();
                }}
              />
              <button
                className="ao-btn ao-btn--primary ao-btn--sm"
                onClick={handleAddNote}
                disabled={!noteText.trim() || addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rune kind="plus" size={12} color="currentColor" />
                )}
              </button>
            </div>
          </div>
        </OrdoPanel>
      </div>

      {/* ═══ Right column ═══ */}
      <div className={s.colRight}>
        {/* Origin / statblock */}
        {(npc.sourceType === 'CLASS_BASED' || npc.sourceType === 'MONSTER_BASED') && (
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('camp2.npcDetail.origin')}
              glyph={npc.sourceType === 'MONSTER_BASED' ? 'flame' : 'helm'}
              tone="gold"
            />
            <div className={s.boxPad}>
              <div className={s.originType}>
                {npc.sourceType === 'CLASS_BASED'
                  ? t('camp2.npcForm.source.class')
                  : t('camp2.npcForm.source.monster')}
              </div>
              {npc.sourceType === 'CLASS_BASED' ? (
                <div className={s.originList}>
                  {npc.race && <OriginRow label={t('camp2.npcForm.race')} value={npc.race.name} />}
                  {npc.characterClass && (
                    <OriginRow label={t('camp2.npcForm.class')} value={npc.characterClass.name} />
                  )}
                  {npc.level != null && (
                    <OriginRow label={t('camp2.npcForm.level')} value={String(npc.level)} />
                  )}
                  {npc.abilities && (
                    <div className={s.originBlock}>
                      <span className={cn('ao-overline', s.originLabel)}>{t('camp2.npcForm.abilities')}</span>
                      <p className={s.originText}>{npc.abilities}</p>
                    </div>
                  )}
                  {npc.spells && npc.spells.length > 0 && (
                    <div className={s.originBlock}>
                      <span className={cn('ao-overline', s.originLabel)}>{t('camp2.npcForm.spells')}</span>
                      <div className={s.spellTags}>
                        {npc.spells.map((sp) => (
                          <span key={sp.id} className={s.spellTag}>{sp.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={s.originList}>
                  {npc.sourceMonster && (
                    <OriginRow label={t('camp2.npcForm.monster')} value={npc.sourceMonster.name} />
                  )}
                </div>
              )}
            </div>
          </OrdoPanel>
        )}

        {/* Linked Quests */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.linkedQuests')} glyph="scroll" tone="gold" />
          <div className={s.boxPad}>
            {linkedQuests.length === 0 ? (
              <p className={cn('ao-italic', s.linkEmpty)}>
                {t('camp2.npcDetail.noLinkedQuests')}
              </p>
            ) : (
              <div className={s.linkList}>
                {linkedQuests.map((q) => (
                  <div key={q.id} className={s.linkRow}>
                    <Rune kind="scroll" size={12} color="var(--brass)" />
                    <span className={s.linkNameGrow}>
                      {q.name}
                    </span>
                    {q.status && <QuestStatusBadge status={q.status} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </OrdoPanel>

        {/* Linked Locations */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.linkedLocations')} glyph="sigil-3" tone="arcane" />
          <div className={s.boxPad}>
            {linkedLocations.length === 0 ? (
              <p className={cn('ao-italic', s.linkEmpty)}>
                {t('camp2.npcDetail.noLinkedLocations')}
              </p>
            ) : (
              <div className={s.linkList}>
                {linkedLocations.map((loc) => (
                  <div key={loc.id} className={s.linkRow}>
                    <Rune kind="sigil-3" size={12} color="var(--arcane)" />
                    <span className={s.linkName}>
                      {loc.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OrdoPanel>
      </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.npcDetail.editTitle')}</DialogTitle>
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
              onClick={() => setEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t('camp2.npcDetail.cancel')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleUpdate}
              disabled={!isNpcFormValid(form) || updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.npcDetail.save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.npcDetail.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className={s.deleteBody}>{t('camp2.npcDetail.deleteConfirm', { name: npc.name })}</p>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t('camp2.npcDetail.cancel')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.npcDetail.delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
