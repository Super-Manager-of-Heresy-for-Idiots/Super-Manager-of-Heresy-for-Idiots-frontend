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
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
} from '@/hooks/useAdmin';
import type { SkillResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './AdminCrud.module.css';

export default function SkillsPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useSkills();
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const deleteMutation = useDeleteSkill();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SkillResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSkillType, setFormSkillType] = useState('');
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormSkillType('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: SkillResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormSkillType(item.skillType || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      description: formDescription || undefined,
      skillType: formSkillType || undefined,
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

  const filtered = (data || []).filter((sk) =>
    sk.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <div className="ao-overline">{t('adm.skills.overline')}</div>
            <div className={cn('ao-h3', s.titleH3)}>{t('adm.skills.title')}</div>
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
          <div className="ao-overline">{t('adm.skills.overline')}</div>
          <div className={cn('ao-h3', s.titleH3)}>{t('adm.skills.title')}</div>
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
          title={t('adm.skills.title')}
          sub={t('adm.skills.entries', { count: data?.length || 0 })}
          glyph="eye"
          right={
            <div className={s.panelSearch}>
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder={t('adm.skills.searchPlaceholder')}
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
              <th>{t('adm.skills.colSkillType')}</th>
              <th>{t('adm.shared.colDescription')}</th>
              <th className={s.colNarrow}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sk) => (
              <tr key={sk.id}>
                <td className={s.cellName}>{sk.name}</td>
                <td>
                  {sk.skillType ? (
                    <span className={cn('ao-chip ao-chip--rune', s.typeChip)}>
                      {sk.skillType}
                    </span>
                  ) : (
                    <span className={cn('ao-codex', s.dash)}>—</span>
                  )}
                </td>
                <td className={cn('ao-italic', s.descCell)}>
                  {sk.description || '—'}
                </td>
                <td>
                  <div className={s.iconGroup}>
                    <button className={cn('ao-iconbtn', s.iconSm)} onClick={() => handleEdit(sk)} title={t('adm.shared.edit')}>
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
                          <AlertDialogTitle>{t('adm.skills.unmakeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('adm.skills.unmakeDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('adm.shared.withhold')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(sk.id)}>{t('adm.shared.unmake')}</AlertDialogAction>
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
                  <span className={cn('ao-italic', s.emptyText)}>{t('adm.skills.emptyTable')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={s.footer}>
          <span className="ao-codex">{t('adm.skills.countOf', { filtered: filtered.length, total: data?.length || 0 })}</span>
          <span className="ao-codex">{t('adm.shared.sortedByName')}</span>
        </div>
      </OrdoPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.skills.dialogEdit') : t('adm.skills.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className={cn('ao-input', s.nameInput)}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.skills.namePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('adm.skills.typeLabel')} hint={t('adm.skills.typeHint')}>
              <input
                className="ao-input"
                value={formSkillType}
                onChange={(e) => setFormSkillType(e.target.value)}
                placeholder={t('adm.skills.typePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.skills.descriptionPlaceholder')}
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
