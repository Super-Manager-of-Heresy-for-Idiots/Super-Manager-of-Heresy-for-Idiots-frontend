import { useMemo, useState } from 'react';
import { Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useResourceTypes,
  useCreateResourceType,
  useUpdateResourceType,
  useDeleteResourceType,
} from '@/hooks/useResourceTypes';
import { useValidateFormula } from '@/hooks/useFeatureRules';
import { useFeats } from '@/hooks/useContentCatalog';
import { useGlobalReferenceContent } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ResourceTypeAdmin, ResourceTypeRequest } from '@/api/resourceTypes.api';
import s from './ResourceTypesPage.module.css';

const EMPTY: ResourceTypeRequest = { name: '', description: '', maxValue: null, maxFormula: '', classBoundId: null, featBoundId: null, resetOn: 'none' };

export default function ResourceTypesPage() {
  const t = useT();
  const { data: types, isLoading } = useResourceTypes();
  const { data: refContent } = useGlobalReferenceContent();
  const { data: feats } = useFeats();
  const create = useCreateResourceType();
  const update = useUpdateResourceType();
  const del = useDeleteResourceType();
  const validate = useValidateFormula();

  const [editing, setEditing] = useState<{ id: string | null; form: ResourceTypeRequest } | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const classes = useMemo(() => refContent?.classes ?? [], [refContent]);
  const featList = useMemo(() => feats ?? [], [feats]);

  const startNew = () => {
    setEditing({ id: null, form: { ...EMPTY } });
    setValidationMsg(null);
  };
  const startEdit = (r: ResourceTypeAdmin) => {
    setEditing({
      id: r.id,
      form: {
        name: r.name,
        description: r.description ?? '',
        maxValue: r.maxValue ?? null,
        maxFormula: r.maxFormula ?? '',
        classBoundId: r.classBoundId ?? null,
        featBoundId: r.featBoundId ?? null,
        resetOn: r.resetOn ?? 'none',
      },
    });
    setValidationMsg(null);
  };
  const setF = (patch: Partial<ResourceTypeRequest>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));

  const onValidate = () => {
    const expr = editing?.form.maxFormula?.trim();
    if (!expr) return;
    validate.mutate(
      { expression: expr, resultType: 'integer' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.resourceTypes.formulaOk') : v?.message || t('adm.resourceTypes.formulaBad'));
        },
      },
    );
  };

  const onSave = () => {
    if (!editing) return;
    if (!editing.form.name.trim()) {
      toast.error(t('adm.resourceTypes.nameRequired'));
      return;
    }
    const data: ResourceTypeRequest = {
      name: editing.form.name.trim(),
      description: editing.form.description?.trim() || null,
      maxValue: editing.form.maxValue ?? null,
      maxFormula: editing.form.maxFormula?.trim() || null,
      classBoundId: editing.form.classBoundId || null,
      featBoundId: editing.form.featBoundId || null,
      resetOn: editing.form.resetOn || 'none',
    };
    const done = () => setEditing(null);
    if (editing.id) update.mutate({ id: editing.id, data }, { onSuccess: done });
    else create.mutate(data, { onSuccess: done });
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className="ao-overline">{t('adm.resourceTypes.overline')}</p>
        <h2 className="ao-h2">{t('adm.resourceTypes.title')}</h2>
        <p className={s.lede}>{t('adm.resourceTypes.lede')}</p>
      </header>

      {!editing && (
        <div>
          <button className="ao-btn ao-btn--primary" onClick={startNew}>
            <Plus size={14} /> {t('adm.resourceTypes.new')}
          </button>
        </div>
      )}

      {editing && (
        <div className={cn('ao-panel', s.form)}>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.name')}</label>
            <input className="ao-input" value={editing.form.name} onChange={(e) => setF({ name: e.target.value })} />
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.description')}</label>
            <input className="ao-input" value={editing.form.description ?? ''} onChange={(e) => setF({ description: e.target.value })} />
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.class')}</label>
            <select className="ao-input" value={editing.form.classBoundId ?? ''} onChange={(e) => setF({ classBoundId: e.target.value || null })}>
              <option value="">{t('adm.resourceTypes.classNone')}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.feat')}</label>
            <select className="ao-input" value={editing.form.featBoundId ?? ''} onChange={(e) => setF({ featBoundId: e.target.value || null })}>
              <option value="">{t('adm.resourceTypes.featNone')}</option>
              {featList.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.maxValue')}</label>
            <input
              className="ao-input"
              type="number"
              value={editing.form.maxValue ?? ''}
              onChange={(e) => setF({ maxValue: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.maxFormula')}</label>
            <input
              className="ao-input"
              placeholder='class_level("monk")'
              value={editing.form.maxFormula ?? ''}
              onChange={(e) => {
                setF({ maxFormula: e.target.value });
                setValidationMsg(null);
              }}
            />
            <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !editing.form.maxFormula?.trim()}>
              <ShieldCheck size={14} /> {t('adm.resourceTypes.validate')}
            </button>
          </div>
          {validationMsg && <p className={s.muted}>{validationMsg}</p>}
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.resetOn')}</label>
            <select className="ao-input" value={editing.form.resetOn ?? 'none'} onChange={(e) => setF({ resetOn: e.target.value })}>
              <option value="none">{t('adm.resourceTypes.resetNone')}</option>
              <option value="short_rest">{t('adm.resourceTypes.resetShort')}</option>
              <option value="long_rest">{t('adm.resourceTypes.resetLong')}</option>
            </select>
          </div>
          <p className={s.muted}>{t('adm.resourceTypes.hint')}</p>
          <div className={s.formActions}>
            <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={create.isPending || update.isPending}>
              <Save size={14} /> {t('adm.resourceTypes.save')}
            </button>
            <button className="ao-btn" onClick={() => setEditing(null)}>
              <X size={14} /> {t('adm.resourceTypes.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className={cn('ao-panel', s.tablePanel)}>
        {isLoading ? (
          <p className={s.muted}>{t('common.loading')}</p>
        ) : (
          <table className="ao-table">
            <thead>
              <tr>
                <th>{t('adm.resourceTypes.col.name')}</th>
                <th>{t('adm.resourceTypes.col.class')}</th>
                <th>{t('adm.resourceTypes.col.max')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(types ?? []).map((r) => (
                <tr key={r.id} className={s.row} onClick={() => startEdit(r)}>
                  <td>{r.name}</td>
                  <td>{r.className ?? '—'}</td>
                  <td>{r.maxFormula ? <code className={s.formulaCell}>{r.maxFormula}</code> : (r.maxValue ?? '—')}</td>
                  <td className={s.actionsCell}>
                    <button
                      className="ao-btn ao-btn--sm ao-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t('adm.resourceTypes.confirmDelete'))) del.mutate(r.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
