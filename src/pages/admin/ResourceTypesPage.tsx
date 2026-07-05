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
import { MAX_LEVEL, buildStepFormula, parseStepTable } from '@/lib/stepTable';
import FormulaInput from '@/components/admin/FormulaInput';
import type { ResourceTypeAdmin, ResourceTypeRequest } from '@/api/resourceTypes.api';
import s from './ResourceTypesPage.module.css';

type MaxMode = 'number' | 'formula' | 'table';

const EMPTY: ResourceTypeRequest = {
  name: '', description: '', maxValue: null, maxFormula: '', classBoundId: null, featBoundId: null,
  resetOn: 'none', shortRestRecovery: 'none', shortRestFormula: '', longRestRecovery: 'none', longRestFormula: '',
};

const emptyLevels = () => new Array(MAX_LEVEL + 1).fill('');

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
  const [maxMode, setMaxMode] = useState<MaxMode>('number');
  const [levels, setLevels] = useState<string[]>(emptyLevels());

  const classes = useMemo(() => refContent?.classes ?? [], [refContent]);
  const featList = useMemo(() => feats ?? [], [feats]);

  const startNew = () => {
    setEditing({ id: null, form: { ...EMPTY } });
    setMaxMode('number');
    setLevels(emptyLevels());
    setValidationMsg(null);
  };
  const startEdit = (r: ResourceTypeAdmin) => {
    const table = parseStepTable(r.maxFormula);
    setMaxMode(table ? 'table' : r.maxFormula ? 'formula' : 'number');
    setLevels(table ?? emptyLevels());
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
        shortRestRecovery: r.shortRestRecovery ?? 'none',
        shortRestFormula: r.shortRestFormula ?? '',
        longRestRecovery: r.longRestRecovery ?? 'none',
        longRestFormula: r.longRestFormula ?? '',
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
    const tableFormula = maxMode === 'table' ? buildStepFormula(levels) : null;
    const maxFormula =
      maxMode === 'table' ? tableFormula || null : maxMode === 'formula' ? editing.form.maxFormula?.trim() || null : null;
    const maxValue = editing.form.maxValue ?? null;
    const data: ResourceTypeRequest = {
      name: editing.form.name.trim(),
      description: editing.form.description?.trim() || null,
      maxValue,
      maxFormula,
      classBoundId: editing.form.classBoundId || null,
      featBoundId: editing.form.featBoundId || null,
      resetOn: editing.form.resetOn || 'none',
      shortRestRecovery: editing.form.shortRestRecovery || 'none',
      shortRestFormula: editing.form.shortRestRecovery === 'formula' ? editing.form.shortRestFormula?.trim() || null : null,
      longRestRecovery: editing.form.longRestRecovery || 'none',
      longRestFormula: editing.form.longRestRecovery === 'formula' ? editing.form.longRestFormula?.trim() || null : null,
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
            <label className={s.label}>{t('adm.resourceTypes.maxMode')}</label>
            <div className="ao-row ao-gap-8">
              {(['number', 'formula', 'table'] as MaxMode[]).map((m) => (
                <button
                  key={m}
                  className={cn('ao-btn', maxMode === m && 'ao-btn--primary')}
                  onClick={() => setMaxMode(m)}
                >
                  {t(`adm.resourceTypes.maxMode.${m}`)}
                </button>
              ))}
            </div>
          </div>
          {maxMode === 'number' && (
            <div className={s.formRow}>
              <label className={s.label}>{t('adm.resourceTypes.maxValue')}</label>
              <input
                className="ao-input"
                type="number"
                value={editing.form.maxValue ?? ''}
                onChange={(e) => setF({ maxValue: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
          )}
          {maxMode === 'formula' && (
            <>
              <div className={s.formRow}>
                <label className={s.label}>{t('adm.resourceTypes.maxFormula')}</label>
                <FormulaInput
                  placeholder='class_level("monk")'
                  value={editing.form.maxFormula ?? ''}
                  onChange={(v) => {
                    setF({ maxFormula: v });
                    setValidationMsg(null);
                  }}
                />
                <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !editing.form.maxFormula?.trim()}>
                  <ShieldCheck size={14} /> {t('adm.resourceTypes.validate')}
                </button>
              </div>
              {validationMsg && <p className={s.muted}>{validationMsg}</p>}
            </>
          )}
          {maxMode === 'table' && (
            <div className={s.formRow}>
              <label className={s.label}>{t('adm.resourceTypes.levelTable')}</label>
              <div className={s.levelGrid}>
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lvl) => (
                  <label key={lvl} className={s.levelCell}>
                    <span className={s.levelNum}>{lvl}</span>
                    <input
                      className="ao-input"
                      type="number"
                      value={levels[lvl] ?? ''}
                      onChange={(e) => setLevels((arr) => arr.map((v, i) => (i === lvl ? e.target.value : v)))}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
          {maxMode === 'table' && <p className={s.muted}>{t('adm.resourceTypes.levelTableHint')}</p>}

          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.shortRest')}</label>
            <select className="ao-input" value={editing.form.shortRestRecovery ?? 'none'} onChange={(e) => setF({ shortRestRecovery: e.target.value })}>
              <option value="none">{t('adm.resourceTypes.recNone')}</option>
              <option value="full">{t('adm.resourceTypes.recFull')}</option>
              <option value="formula">{t('adm.resourceTypes.recFormula')}</option>
            </select>
            {editing.form.shortRestRecovery === 'formula' && (
              <FormulaInput
                placeholder='ceil(class_level("wizard")/2)'
                value={editing.form.shortRestFormula ?? ''}
                onChange={(v) => setF({ shortRestFormula: v })}
              />
            )}
          </div>
          <div className={s.formRow}>
            <label className={s.label}>{t('adm.resourceTypes.longRest')}</label>
            <select className="ao-input" value={editing.form.longRestRecovery ?? 'none'} onChange={(e) => setF({ longRestRecovery: e.target.value })}>
              <option value="none">{t('adm.resourceTypes.recNone')}</option>
              <option value="full">{t('adm.resourceTypes.recFull')}</option>
              <option value="formula">{t('adm.resourceTypes.recFormula')}</option>
            </select>
            {editing.form.longRestRecovery === 'formula' && (
              <FormulaInput
                placeholder='class_level("druid")'
                value={editing.form.longRestFormula ?? ''}
                onChange={(v) => setF({ longRestFormula: v })}
              />
            )}
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
