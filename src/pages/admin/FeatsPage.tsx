import { useState } from 'react';
import { Rune, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
import { PanelHeader } from '@/components/ordo';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useFeats,
  useCreateFeat,
  useUpdateFeat,
  useDeleteFeat,
} from '@/hooks/useAdmin';
import type { FeatResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './AdminCrud.module.css';

export default function FeatsPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useFeats();
  const createMutation = useCreateFeat();
  const updateMutation = useUpdateFeat();
  const deleteMutation = useDeleteFeat();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeatResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrerequisites, setFormPrerequisites] = useState('');
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrerequisites('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: FeatResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormPrerequisites(item.prerequisites || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      description: formDescription || undefined,
      prerequisites: formPrerequisites || undefined,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const filtered = (data || []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <div className="ao-overline">{t('adm.feats.overline')}</div>
            <div className={cn('ao-h3', s.titleH3)}>{t('adm.feats.title')}</div>
          </div>
        </div>
        <div className={s.skelCol}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-ph', s.skelRow)} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('adm.shared.tomeUnavailable')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <div>
          <div className="ao-overline">{t('adm.feats.overline')}</div>
          <div className={cn('ao-h3', s.titleH3)}>{t('adm.feats.title')}</div>
        </div>
        <div className={s.headerActions}>
          <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
          <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
            <Rune kind="plus" size={11} /> {t('adm.shared.newEntry')}
          </button>
        </div>
      </div>

      {/* Table */}
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={t('adm.feats.title')}
          sub={t('adm.feats.entries', { count: data?.length || 0 })}
          glyph="scroll"
          right={
            <div className={s.panelSearch}>
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder={t('adm.feats.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />

        <table className="ao-table">
          <thead>
            <tr>
              <th>{t('adm.shared.colName')}</th>
              <th>{t('adm.feats.colPrerequisite')}</th>
              <th>{t('adm.shared.colDescription')}</th>
              <th className={s.colNarrow}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td className={s.cellName}>{f.name}</td>
                <td className="ao-italic">{f.prerequisites || '—'}</td>
                <td className={cn('ao-italic', s.descCell)}>
                  {f.description || '—'}
                </td>
                <td>
                  <div className={s.iconGroup}>
                    <button className={cn('ao-iconbtn', s.iconSm)} onClick={() => handleEdit(f)} title={t('adm.shared.edit')}>
                      <Rune kind="scroll" size={11} />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className={cn('ao-iconbtn', s.iconSm, s.iconDanger)} title={t('adm.shared.delete')}>
                          <Rune kind="x" size={11} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('adm.feats.unmakeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('adm.feats.unmakeDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('adm.shared.withhold')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(f.id)}>{t('adm.shared.unmake')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className={s.emptyCell}>
                  <span className={cn('ao-italic', s.emptyText)}>{t('adm.feats.emptyTable')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={s.footer}>
          <span className="ao-codex">{t('adm.feats.countOf', { filtered: filtered.length, total: data?.length || 0 })}</span>
          <span className="ao-codex">{t('adm.shared.sortedByName')}</span>
        </div>
      </OrdoPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.feats.dialogEdit') : t('adm.feats.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className={cn('ao-input', s.nameInput)}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.feats.namePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('adm.feats.prerequisitesLabel')} hint={t('adm.feats.prerequisitesHint')}>
              <input
                className="ao-input"
                value={formPrerequisites}
                onChange={(e) => setFormPrerequisites(e.target.value)}
                placeholder={t('adm.feats.prerequisitesPlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.feats.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || createMutation.isPending || updateMutation.isPending}
            >
              <Rune kind="diamond-fill" size={9} /> {editing ? t('adm.shared.amend') : t('adm.shared.inscribe')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
