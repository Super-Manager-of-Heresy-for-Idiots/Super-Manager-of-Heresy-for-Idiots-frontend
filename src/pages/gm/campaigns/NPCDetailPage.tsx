import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider, Placeholder, EmptyVault } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import {
  useNpc,
  useNpcNotes,
  useAddNpcNote,
  useSetNpcVisibility,
} from '@/hooks/useNpcs';
import type { NpcNoteResponse, QuestStatus } from '@/types';

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
        <BackLink to={backTo} label={t('camp2.back.npcs')} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: '1.5 1 0' }}>
            <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 300 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '30%', height: 14, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '50%', height: 24, marginBottom: 16 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '60%', height: 14 }} />
            </div>
          </div>
          <div style={{ flex: '1 1 0' }}>
            <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '60%', height: 14, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
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
        <BackLink to={backTo} label={t('camp2.back.npcs')} style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      <BackLink to={backTo} label={t('camp2.back.npcs')} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* ═══ Left column ═══ */}
      <div style={{ flex: '1.5 1 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Identity block */}
        <OrdoPanel frame padding={20}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Portrait placeholder */}
            <Placeholder style={{ width: 80, height: 80, flexShrink: 0 }}>
              {t('camp2.npcDetail.portrait')}
            </Placeholder>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <CodexID>{npc.id.slice(0, 8).toUpperCase()}</CodexID>
                <VisibilityToggle visible={npc.isVisibleToPlayers} onToggle={toggleVisibility} />
              </div>
              <h3 className="ao-h3" style={{ marginTop: 6, color: 'var(--ink-bright)' }}>
                {npc.name}
              </h3>
            </div>
          </div>

          {/* Reveal button */}
          <div style={{ marginTop: 16 }}>
            <button
              className={`ao-btn ${npc.isVisibleToPlayers ? 'ao-btn--ghost' : 'ao-btn--primary'}`}
              onClick={toggleVisibility}
              disabled={visibilityMutation.isPending}
            >
              {visibilityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Rune kind={npc.isVisibleToPlayers ? 'lock' : 'eye'} size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{npc.isVisibleToPlayers ? t('camp2.npcDetail.hideFromPlayers') : t('camp2.npcDetail.revealToPlayers')}</span>
            </button>
          </div>
        </OrdoPanel>

        {/* Public account box */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.publicAccount')} glyph="eye" tone="gold" sub={t('camp2.npcDetail.publicSub')} />
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
              {npc.publicDescription || (
                <span className="ao-italic" style={{ color: 'var(--ink-ghost)' }}>
                  {t('camp2.npcDetail.noPublicAccount')}
                </span>
              )}
            </p>
          </div>
        </OrdoPanel>

        {/* Private account box */}
        <OrdoPanel
          frame
          padding={0}
          style={{
            borderColor: 'rgba(140,40,50,0.3)',
            background: 'rgba(100,20,30,0.06)',
          }}
        >
          <PanelHeader title={t('camp2.npcDetail.privateAccount')} glyph="lock" tone="ember" sub={t('camp2.npcDetail.privateSub')} />
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
              {npc.privateDescription || (
                <span className="ao-italic" style={{ color: 'var(--ink-ghost)' }}>
                  {t('camp2.npcDetail.noPrivateNotes')}
                </span>
              )}
            </p>
          </div>
        </OrdoPanel>

        {/* Notes feed */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.chronicleNotes')} glyph="scroll" tone="gold" />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notesLoading ? (
              <div className="ao-breathe">
                <div className="ao-ph" style={{ width: '70%', height: 14, marginBottom: 8 }} />
                <div className="ao-ph" style={{ width: '50%', height: 14 }} />
              </div>
            ) : !notes || notes.length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 13 }}>
                {t('camp2.npcDetail.noNotes')}
              </p>
            ) : (
              notes.map((note: NpcNoteResponse) => (
                <div
                  key={note.id}
                  style={{
                    padding: 12,
                    background: 'transparent',
                    border: '1px solid rgba(180,140,80,0.25)',
                    borderLeft: '3px solid rgba(180,140,80,0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Rune
                      kind="scroll"
                      size={10}
                      color="var(--brass)"
                    />
                    <span className="ao-overline" style={{ fontSize: 8 }}>
                    {note.authorUsername} - {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                    {note.content}
                  </p>
                </div>
              ))
            )}

            <OrdoDivider glyph="diamond" />

            {/* Inline add-note */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="ao-input"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t('camp2.npcDetail.addNotePlaceholder')}
                style={{ flex: 1 }}
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
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Linked Quests */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.npcDetail.linkedQuests')} glyph="scroll" tone="gold" />
          <div style={{ padding: 16 }}>
            {linkedQuests.length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 13 }}>
                {t('camp2.npcDetail.noLinkedQuests')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linkedQuests.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <Rune kind="scroll" size={12} color="var(--brass)" />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-bright)' }}>
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
          <div style={{ padding: 16 }}>
            {linkedLocations.length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 13 }}>
                {t('camp2.npcDetail.noLinkedLocations')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linkedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <Rune kind="sigil-3" size={12} color="var(--arcane)" />
                    <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>
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
