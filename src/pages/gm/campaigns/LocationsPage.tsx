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
  useToggleLocationVisibility,
} from '@/hooks/useLocations';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import type { LocationResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function LocationsPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: locations, isLoading, error, refetch } = useCampaignLocations(campaignId!);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const visibilityMutation = useToggleLocationVisibility();

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
    setFormVisible(loc.isVisibleToPlayers);
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
            isVisibleToPlayers: formVisible,
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
            isVisibleToPlayers: formVisible,
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
    visibilityMutation.mutate({
      campaignId: campaignId!,
      locationId: loc.id,
    });
  };

  const backTo = `/campaigns/${campaignId}`;
  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.loc.overline')}</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.loc.title')}</h3>
          </div>
        </div>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
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
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
            {t('camp2.loc.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.loc.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.loc.title')}</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {t('camp2.loc.subtitle')}
          </p>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>{t('camp2.loc.newLocation')}</span>
        </button>
      </div>

      {/* Grid */}
      {!locations || locations.length === 0 ? (
        <EmptyVault
          glyph="sigil-3"
          title={t('camp2.loc.empty.title')}
          body={t('camp2.loc.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{t('camp2.loc.newLocation')}</span>
            </button>
          }
        />
      ) : (
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {locations.map((loc) => (
            <OrdoPanel key={loc.id} frame padding={0}>
              <div style={{ padding: 18 }}>
                {/* Map vignette placeholder */}
                <Placeholder
                  style={{
                    width: '100%',
                    height: 110,
                    marginBottom: 14,
                    opacity: loc.isVisibleToPlayers ? 1 : 0.5,
                  }}
                >
                  {t('camp2.loc.mapVignette')}
                </Placeholder>

                {/* ID + Visibility */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <CodexID>{loc.id.slice(0, 8).toUpperCase()}</CodexID>
                  <VisibilityToggle visible={loc.isVisibleToPlayers} onToggle={() => toggleVisibility(loc)} />
                </div>

                {/* Name */}
                <h5
                  className="ao-h5"
                  style={{
                    color: 'var(--ink-bright)',
                    marginTop: 4,
                    opacity: loc.isVisibleToPlayers ? 1 : 0.6,
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
                  <Rune kind="scroll" size={10} /> {t('camp2.loc.edit')}
                </button>
                <button
                  className="ao-btn ao-btn--sm"
                  onClick={() => toggleVisibility(loc)}
                  disabled={visibilityMutation.isPending}
                >
                  <Rune kind={loc.isVisibleToPlayers ? 'lock' : 'eye'} size={10} />
                  {loc.isVisibleToPlayers ? ` ${t('camp2.loc.hide')}` : ` ${t('camp2.loc.reveal')}`}
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
            <DialogTitle>{editing ? t('camp2.loc.dialog.editTitle') : t('camp2.loc.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label={t('camp2.loc.field.name')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('camp2.loc.field.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('camp2.loc.field.description')}>
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('camp2.loc.field.descriptionPlaceholder')}
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
              <span className="ao-label" style={{ marginBottom: 0 }}>{t('camp2.loc.field.visible')}</span>
            </label>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('camp2.loc.withhold')}
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
              {editing ? t('camp2.loc.seal') : t('camp2.loc.chart')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp2.loc.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp2.loc.delete.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('camp2.loc.withhold')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.loc.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
