import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, Rune, OrdoField, Placeholder, EmptyVault } from '@/components/ordo';
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
  useCampaignLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/hooks/useLocations';
import type { LocationResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function LocationsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: locations, isLoading, error, refetch } = useCampaignLocations(campaignId!);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormVisible(true);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (loc: LocationResponse) => {
    setEditing(loc);
    setFormName(loc.name);
    setFormDescription(loc.description || '');
    setFormVisible(loc.visible ?? false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate(
        {
          campaignId: campaignId!,
          locationId: editing.id,
          data: {
            name: formName,
            description: formDescription || undefined,
            visible: formVisible,
          },
        },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); } },
      );
    } else {
      createMutation.mutate(
        {
          campaignId: campaignId!,
          data: {
            name: formName,
            description: formDescription || undefined,
            visible: formVisible,
          },
        },
        { onSuccess: () => { setDialogOpen(false); resetForm(); } },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { campaignId: campaignId!, locationId: deleteId },
      { onSuccess: () => setDeleteId(null) },
    );
  };

  const toggleVisibility = (loc: LocationResponse) => {
    updateMutation.mutate({
      campaignId: campaignId!,
      locationId: loc.id,
      data: { visible: !loc.visible },
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>Cartography</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>Locations</h3>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 180 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '100%', height: 100, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '50%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '70%', height: 14 }} />
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
          The atlas could not be unfurled. Its bindings remain sealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Cartography</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Locations</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            Realms, ruins, and waypoints mapped by the Game-Master's hand.
          </p>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>New Location</span>
        </button>
      </div>

      {/* Grid */}
      {!locations || locations.length === 0 ? (
        <EmptyVault
          glyph="sigil-3"
          title="No Locations Charted"
          body="The map lies blank. Create your first location to begin charting the realm."
          action={
            <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>New Location</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {locations.map((loc) => (
            <OrdoPanel key={loc.id} frame padding={0}>
              <div style={{ padding: 18 }}>
                {/* Map vignette placeholder */}
                <Placeholder
                  style={{
                    width: '100%',
                    height: 110,
                    marginBottom: 14,
                    opacity: loc.visible ? 1 : 0.5,
                  }}
                >
                  Map Vignette
                </Placeholder>

                {/* ID + Visibility */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <CodexID>{loc.id.slice(0, 8).toUpperCase()}</CodexID>
                  <VisibilityToggle visible={loc.visible ?? false} onToggle={() => toggleVisibility(loc)} />
                </div>

                {/* Name */}
                <h5
                  className="ao-h5"
                  style={{
                    color: 'var(--ink-bright)',
                    marginTop: 4,
                    opacity: loc.visible ? 1 : 0.6,
                  }}
                >
                  {loc.name}
                </h5>

                {/* Description */}
                {loc.description && (
                  <p
                    className="ao-italic"
                    style={{
                      fontSize: 13,
                      color: 'var(--ink)',
                      lineHeight: 1.5,
                      marginTop: 6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {loc.description}
                  </p>
                )}
              </div>

              {/* Actions footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '12px 18px',
                  borderTop: '1px solid var(--hairline)',
                  background: 'var(--abyss)',
                }}
              >
                <button className="ao-btn ao-btn--sm" onClick={() => handleOpenEdit(loc)}>
                  <Rune kind="scroll" size={10} /> Edit
                </button>
                <button
                  className="ao-btn ao-btn--sm"
                  onClick={() => toggleVisibility(loc)}
                  disabled={updateMutation.isPending}
                >
                  <Rune kind={loc.visible ? 'lock' : 'eye'} size={10} />
                  {loc.visible ? ' Hide' : ' Reveal'}
                </button>
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  onClick={() => setDeleteId(loc.id)}
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
            <DialogTitle>{editing ? 'Alter Location' : 'Chart New Location'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name of the location"
              />
            </OrdoField>

            <OrdoField label="Description">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the location..."
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className="ao-label" style={{ marginBottom: 0 }}>Visible to players</span>
            </label>
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
              disabled={!formName || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? 'Seal' : 'Chart'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erase this Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The location shall be stricken from the atlas for all eternity.
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
