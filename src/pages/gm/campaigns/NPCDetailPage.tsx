import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider, Placeholder, EmptyVault } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  useNpc,
  useNpcNotes,
  useAddNpcNote,
  useSetNpcVisibility,
} from '@/hooks/useNpcs';
import type { NpcNoteResponse, QuestStatus } from '@/types';
import s from './NPCDetailPage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function NPCDetailPage() {
  const t = useT();
  const { campaignId, npcId } = useParams<{ campaignId: string; npcId: string }>();
  const backTo = `/campaigns/${campaignId}/npcs`;
  const { data: npc, isLoading, error, refetch } = useNpc(campaignId!, npcId!);
  const { data: notes, isLoading: notesLoading } = useNpcNotes(campaignId!, npcId!);
  const addNoteMutation = useAddNpcNote();
  const visibilityMutation = useSetNpcVisibility();

  const [noteText, setNoteText] = useState('');

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
  const linkedQuests: { id: string; name: string; status?: QuestStatus }[] =
    (npc as any).linkedQuests ?? [];
  const linkedLocations: { id: string; name: string }[] =
    (npc as any).linkedLocations ?? [];

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
    </div>
  );
}
