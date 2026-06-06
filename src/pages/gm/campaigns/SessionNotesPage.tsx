import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, OrdoDivider, EmptyVault } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCampaignSessionNotes,
  useCreateSessionNote,
  useUpdateSessionNote,
  useDeleteSessionNote,
} from '@/hooks/useSessionNotes';
import { useT } from '@/i18n/I18nContext';
import type { GmSessionNoteResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function SessionNotesPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: notes, isLoading, error, refetch } = useCampaignSessionNotes(campaignId!);
  const createMutation = useCreateSessionNote();
  const updateMutation = useUpdateSessionNote();
  const deleteMutation = useDeleteSessionNote();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GmSessionNoteResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
  };

  const handleOpenCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (note: GmSessionNoteResponse) => {
    setEditing(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!campaignId) return;

    if (editing) {
      updateMutation.mutate(
        {
          campaignId,
          noteId: editing.id,
          data: { title: formTitle, content: formContent },
        },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); } },
      );
    } else {
      createMutation.mutate(
        {
          campaignId,
          data: { title: formTitle, content: formContent },
        },
        { onSuccess: () => { setDialogOpen(false); resetForm(); } },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId || !campaignId) return;
    deleteMutation.mutate(
      { campaignId, noteId: deleteId },
      { onSuccess: () => setDeleteId(null) },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.session.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.session.title')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '50%', height: 16, marginBottom: 10 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 6 }} />
              <div className="ao-ph" style={{ width: '60%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('camp2.session.loadError')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  const notesList: GmSessionNoteResponse[] = notes ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        style={{ marginBottom: 16 }}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span style={{ marginLeft: 4 }}>{t('camp2.session.backToDashboard')}</span>
      </button>

      {/* Privacy banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'rgba(100,20,30,0.12)',
          border: '1px solid rgba(140,40,50,0.3)',
          borderLeft: '3px solid rgba(180,80,80,0.6)',
          marginBottom: 24,
        }}
      >
        <Rune kind="lock" size={16} color="rgba(180,80,80,0.6)" />
        <div>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'rgba(220,120,120,0.9)' }}>
            {t('camp2.session.gmEyesOnly')}
          </span>
          <span className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-quiet)', marginLeft: 8 }}>
            {t('camp2.session.privacyNote')}
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.session.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.session.title')}</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {t('camp2.session.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={handleOpenCreate}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>{t('camp2.session.newNote')}</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notesList.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title={t('camp2.session.empty.title')}
          body={t('camp2.session.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{t('camp2.session.newNote')}</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {notesList.map((note: GmSessionNoteResponse) => (
            <OrdoPanel
              key={note.id}
              frame
              padding={0}
              style={{
                borderColor: 'rgba(140,40,50,0.25)',
              }}
            >
              <div style={{ padding: 18 }}>
                {/* Title */}
                <h5 className="ao-h5" style={{ color: 'var(--ink-bright)', marginBottom: 6 }}>
                  {note.title}
                </h5>

                {/* Author + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Rune kind="lock" size={9} color="rgba(180,80,80,0.5)" />
                  <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>
                    {note.authorUsername} &mdash; {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.updatedAt !== note.createdAt && (
                    <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-ghost)' }}>
                      {t('camp2.session.edited')}
                    </span>
                  )}
                </div>

                {/* Body preview */}
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--ink)',
                    lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {note.content}
                </p>
              </div>

              {/* Actions footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '10px 18px',
                  borderTop: '1px solid rgba(140,40,50,0.2)',
                  background: 'rgba(100,20,30,0.04)',
                }}
              >
                <button
                  className="ao-btn ao-btn--sm"
                  onClick={() => handleOpenEdit(note)}
                >
                  <Rune kind="scroll" size={10} /> {t('camp2.session.edit')}
                </button>
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  onClick={() => setDeleteId(note.id)}
                >
                  <Rune kind="x" size={10} />
                </button>
              </div>
            </OrdoPanel>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('camp2.session.dialog.editTitle') : t('camp2.session.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label={t('camp2.session.field.title')} required>
              <input
                className="ao-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('camp2.session.field.titlePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('camp2.session.field.content')} required>
              <textarea
                className="ao-input"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t('camp2.session.field.contentPlaceholder')}
                rows={8}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('camp2.session.withhold')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formTitle || !formContent || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? t('camp2.session.seal') : t('camp2.session.record')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp2.session.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp2.session.delete.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('camp2.session.withhold')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.session.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
