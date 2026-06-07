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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="ao-overline">{t('adm.feats.overline')}</div>
            <div className="ao-h3" style={{ marginTop: 4 }}>{t('adm.feats.title')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('adm.shared.tomeUnavailable')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="ao-overline">{t('adm.feats.overline')}</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>{t('adm.feats.title')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="ao-input"
                placeholder={t('adm.feats.searchPlaceholder')}
                style={{ width: 220, padding: '6px 12px' }}
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
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td style={{ color: 'var(--ink-bright)' }}>{f.name}</td>
                <td className="ao-italic">{f.prerequisites || '—'}</td>
                <td className="ao-italic" style={{ color: 'var(--ink-quiet)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.description || '—'}
                </td>
                <td>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button className="ao-iconbtn" style={{ width: 26, height: 26 }} onClick={() => handleEdit(f)} title={t('adm.shared.edit')}>
                      <Rune kind="scroll" size={11} />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="ao-iconbtn" style={{ width: 26, height: 26, color: '#d8896a' }} title={t('adm.shared.delete')}>
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
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{t('adm.feats.emptyTable')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--rule)', background: 'var(--abyss)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.feats.namePlaceholder')}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}
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
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.feats.descriptionPlaceholder')}
                rows={3}
                style={{ resize: 'vertical', fontSize: 14 }}
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
