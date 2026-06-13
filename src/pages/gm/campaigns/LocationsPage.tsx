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
import { cn } from '@/lib/utils';
import type { LocationResponse } from '@/types';
import s from './LocationsPage.module.css';

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
        <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.header}>
          <div>
            <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.loc.overline')}</p>
            <h3 className={cn('ao-h3', s.title)}>{t('camp2.loc.title')}</h3>
          </div>
        </div>
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phMap)} />
              <div className={cn('ao-ph', s.phW50H14)} />
              <div className={cn('ao-ph', s.phW70H14)} />
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
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>
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
      <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.loc.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.loc.title')}</h3>
          <p className={cn('ao-italic', s.subtitle)}>
            {t('camp2.loc.subtitle')}
          </p>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={handleOpenCreate}>
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp2.loc.newLocation')}</span>
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
              <span className={s.ml6}>{t('camp2.loc.newLocation')}</span>
            </button>
          }
        />
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {locations.map((loc) => (
            <OrdoPanel key={loc.id} frame padding={0}>
              <div className={s.cardPad}>
                {/* Map vignette placeholder */}
                <Placeholder className={cn(s.mapVignette, !loc.isVisibleToPlayers && s.dimmed)}>
                  {t('camp2.loc.mapVignette')}
                </Placeholder>

                {/* ID + Visibility */}
                <div className={s.idRow}>
                  <CodexID>{loc.id.slice(0, 8).toUpperCase()}</CodexID>
                  <VisibilityToggle visible={loc.isVisibleToPlayers} onToggle={() => toggleVisibility(loc)} />
                </div>

                {/* Name */}
                <h5 className={cn('ao-h5', s.locName, !loc.isVisibleToPlayers && s.dimmed60)}>
                  {loc.name}
                </h5>

                {/* Description */}
                {loc.description && (
                  <p className={cn('ao-italic', s.locDesc)}>
                    {loc.description}
                  </p>
                )}
              </div>

              {/* Actions footer */}
              <div className={s.cardFooter}>
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
          <div className={s.dialogCol}>
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
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('camp2.loc.field.descriptionPlaceholder')}
                rows={4}
                className={cn('ao-input', s.resizeV)}
              />
            </OrdoField>

            <label className={s.checkRow}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className={cn('ao-label', s.checkLabel)}>{t('camp2.loc.field.visible')}</span>
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
