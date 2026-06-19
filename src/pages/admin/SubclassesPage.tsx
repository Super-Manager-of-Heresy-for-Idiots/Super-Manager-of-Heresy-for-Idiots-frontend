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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  useSubclasses,
  useCreateSubclass,
  useUpdateSubclass,
  useDeleteSubclass,
  useCharacterClasses,
} from '@/hooks/useAdmin';
import type { SubclassResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import s from './AdminCrud.module.css';

export default function SubclassesPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useSubclasses();
  const { data: classes } = useCharacterClasses();
  const createMutation = useCreateSubclass();
  const updateMutation = useUpdateSubclass();
  const deleteMutation = useDeleteSubclass();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubclassResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormClassId('');
    setFormDescription('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: SubclassResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormClassId(item.classId);
    setFormDescription(item.description || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      classId: formClassId,
      description: formDescription || undefined,
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

  const filtered = (data || []).filter((sc) =>
    sc.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <div className="ao-overline">{t('adm.subclasses.overline')}</div>
            <div className={cn('ao-h3', s.titleH3)}>{t('adm.subclasses.title')}</div>
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
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <div>
          <div className="ao-overline">{t('adm.subclasses.overline')}</div>
          <div className={cn('ao-h3', s.titleH3)}>{t('adm.subclasses.title')}</div>
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
          title={t('adm.subclasses.title')}
          sub={t('adm.subclasses.entries', { count: data?.length || 0 })}
          glyph="hex"
          right={
            <div className={s.panelSearch}>
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder={t('adm.subclasses.searchPlaceholder')}
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
              <th>{t('adm.subclasses.colClass')}</th>
              <th>{t('adm.shared.colDescription')}</th>
              <th className={s.colNarrow}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sc) => (
              <tr key={sc.id}>
                <td className={s.cellName}>{sc.name}</td>
                <td>
                  <span className={s.classBadge}>
                    <Rune kind="hex" size={10} color="#9a7ec0" />
                    {sc.className || '—'}
                  </span>
                </td>
                <td className={cn('ao-italic', s.descCell)}>
                  {sc.description || '—'}
                </td>
                <td>
                  <div className={s.iconGroup}>
                    <button className={cn('ao-iconbtn', s.iconSm)} onClick={() => handleEdit(sc)} title={t('adm.shared.edit')}>
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
                          <AlertDialogTitle>{t('adm.subclasses.unmakeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('adm.subclasses.unmakeDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('adm.shared.withhold')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(sc.id)}>{t('adm.shared.unmake')}</AlertDialogAction>
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
                  <span className={cn('ao-italic', s.emptyText)}>{t('adm.subclasses.emptyTable')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={s.footer}>
          <span className="ao-codex">{t('adm.subclasses.countOf', { filtered: filtered.length, total: data?.length || 0 })}</span>
          <span className="ao-codex">{t('adm.subclasses.sortedByClass')}</span>
        </div>
      </OrdoPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.subclasses.dialogEdit') : t('adm.subclasses.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className={cn('ao-input', s.nameInput)}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.subclasses.namePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('adm.subclasses.parentClassLabel')} required>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.subclasses.selectClass')} />
                </SelectTrigger>
                <SelectContent>
                  {(classes || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>
            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.subclasses.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || !formClassId || createMutation.isPending || updateMutation.isPending}
            >
              <Rune kind="diamond-fill" size={9} /> {editing ? t('adm.shared.amend') : t('adm.shared.inscribe')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
