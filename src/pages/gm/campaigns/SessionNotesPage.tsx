import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { cn } from '@/lib/utils';
import type { GmSessionNoteResponse } from '@/types';
import s from './SessionNotesPage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function SessionNotesPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
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
        <div className={s.head}>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.session.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.session.title')}</h3>
        </div>
        <div className={cn('ao-rgrid', s.grid2)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW50)} />
              <div className={cn('ao-ph', s.phW80)} />
              <div className={cn('ao-ph', s.phW60)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>
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
      {/* Privacy banner */}
      <div className={s.privacyBanner}>
        <Rune kind="lock" size={16} color="rgba(180,80,80,0.6)" />
        <div>
          <span className={s.privacyTitle}>
            {t('camp2.session.gmEyesOnly')}
          </span>
          <span className={cn('ao-italic', s.privacyNote)}>
            {t('camp2.session.privacyNote')}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.session.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.session.title')}</h3>
          <p className={cn('ao-italic', s.sub)}>
            {t('camp2.session.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={handleOpenCreate}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp2.session.newNote')}</span>
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
              <span className={s.ml6}>{t('camp2.session.newNote')}</span>
            </button>
          }
        />
      ) : (
        <div className={cn('ao-rgrid', s.grid2)}>
          {notesList.map((note: GmSessionNoteResponse) => (
            <OrdoPanel key={note.id} frame padding={0} className={s.noteCard}>
              <div className={s.noteBody}>
                {/* Title */}
                <h5 className={cn('ao-h5', s.noteTitle)}>
                  {note.title}
                </h5>

                {/* Author + date */}
                <div className={s.noteMeta}>
                  <Rune kind="lock" size={9} color="rgba(180,80,80,0.5)" />
                  <span className={cn('ao-overline', s.metaLabel)}>
                    {note.authorUsername} &mdash; {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.updatedAt !== note.createdAt && (
                    <span className={cn('ao-overline', s.metaEdited)}>
                      {t('camp2.session.edited')}
                    </span>
                  )}
                </div>

                {/* Body preview */}
                <p className={s.notePreview}>
                  {note.content}
                </p>
              </div>

              {/* Actions footer */}
              <div className={s.noteFooter}>
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
          <div className={s.dialogCol}>
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
                className={cn('ao-input', s.resizeV)}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t('camp2.session.field.contentPlaceholder')}
                rows={8}
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
