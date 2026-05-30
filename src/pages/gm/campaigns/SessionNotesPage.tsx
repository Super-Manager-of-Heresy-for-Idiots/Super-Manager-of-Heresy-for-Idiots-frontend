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
import type { SessionNoteResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function SessionNotesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: notes, isLoading, error, refetch } = useCampaignSessionNotes(id!);
  const createMutation = useCreateSessionNote();
  const updateMutation = useUpdateSessionNote();
  const deleteMutation = useDeleteSessionNote();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SessionNoteResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
  };

  const handleOpenCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (note: SessionNoteResponse) => {
    setEditing(note);
    setFormTitle(note.title);
    setFormBody(note.body);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!id) return;

    if (editing) {
      updateMutation.mutate(
        {
          campaignId: id,
          noteId: editing.id,
          data: { title: formTitle, body: formBody },
        },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); } },
      );
    } else {
      createMutation.mutate(
        {
          campaignId: id,
          data: { title: formTitle, body: formBody },
        },
        { onSuccess: () => { setDialogOpen(false); resetForm(); } },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId || !id) return;
    deleteMutation.mutate(
      { campaignId: id, noteId: deleteId },
      { onSuccess: () => setDeleteId(null) },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>GM Chronicle</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Session Notes</h3>
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
          The session chronicle could not be read. Its bindings remain sealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const notesList: SessionNoteResponse[] = notes ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(`/gm/campaigns/${id}`)}
        style={{ marginBottom: 16 }}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span style={{ marginLeft: 4 }}>Back to Dashboard</span>
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
            GM Eyes Only
          </span>
          <span className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-quiet)', marginLeft: 8 }}>
            Session notes are private to the Game-Master and are never shown to players.
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>GM Chronicle</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Session Notes</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            Private records of sessions past, inscribed for the Game-Master alone.
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={handleOpenCreate}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>New Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notesList.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title="No Session Notes"
          body="The chronicle is blank. Record your first session to begin building the saga."
          action={
            <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>New Note</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {notesList.map((note: SessionNoteResponse) => (
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
                      (edited)
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
                  {note.body}
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
                  <Rune kind="scroll" size={10} /> Edit
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
            <DialogTitle>{editing ? 'Edit Session Note' : 'Record Session Note'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Title" required>
              <input
                className="ao-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Session 12 - The Siege of Blackwall"
              />
            </OrdoField>

            <OrdoField label="Body" required>
              <textarea
                className="ao-input"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Record the events, decisions, and consequences of the session..."
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
              Withhold
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formTitle || !formBody || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? 'Seal' : 'Record'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erase this Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The session record shall be stricken from the chronicle for all eternity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
