import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { Plus, Pencil, Trash2, X, Save, Search, AlertTriangle } from 'lucide-react';
import {
  useBestiaryDictionaries,
  useCreateAdminDictionaryEntry,
  useDeleteAdminDictionaryEntry,
  useUpdateAdminDictionaryEntry,
} from '@/hooks/useBestiary';
import { DICTIONARY_KINDS, dictLabelKey, dictSubKey } from '@/components/bestiary/constants';
import { useT } from '@/i18n/I18nContext';
import type { DictionaryEntryResponse, DictionaryKind } from '@/types';
import { cn } from '@/lib/utils';
import s from './BestiaryDictionariesPage.module.css';

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span className={s.diamond} style={{ width: size, height: size, background: color }} />;
}

interface DraftState { id: string | null; code: string; nameRusloc: string; nameEngloc: string; bookCode: string; isUnique: boolean; }
const EMPTY_DRAFT: DraftState = { id: null, code: '', nameRusloc: '', nameEngloc: '', bookCode: '', isUnique: false };

export default function BestiaryDictionariesPage() {
  const t = useT();
  const { data, isLoading } = useBestiaryDictionaries();
  const createMut = useCreateAdminDictionaryEntry();
  const updateMut = useUpdateAdminDictionaryEntry();
  const deleteMut = useDeleteAdminDictionaryEntry();

  const [activeKind, setActiveKind] = useState<DictionaryKind>('creature-types');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [confirmDel, setConfirmDel] = useState<DictionaryEntryResponse | null>(null);

  const kindLabel = t(dictLabelKey(activeKind));
  const isSources = activeKind === 'sources';
  const all = data?.[activeKind] ?? [];
  const rows = all.filter((e) => {
    const q = query.trim().toLowerCase();
    return !q || e.code.includes(q) || e.nameRusloc.toLowerCase().includes(q) || (e.nameEngloc || '').toLowerCase().includes(q);
  });

  const openCreate = () => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (e: DictionaryEntryResponse) => setDraft({ id: e.id, code: e.code, nameRusloc: e.nameRusloc, nameEngloc: e.nameEngloc || '', bookCode: e.bookCode || '', isUnique: e.isUnique });

  const saveDraft = () => {
    if (!draft) return;
    const payload = {
      code: draft.code.trim(),
      nameRusloc: draft.nameRusloc.trim(),
      nameEngloc: draft.nameEngloc.trim() || undefined,
      bookCode: isSources ? (draft.bookCode.trim() || undefined) : undefined,
      isUnique: draft.isUnique,
    };
    const onSuccess = () => setDraft(null);
    if (draft.id) updateMut.mutate({ kind: activeKind, id: draft.id, data: payload }, { onSuccess });
    else createMut.mutate({ kind: activeKind, data: payload }, { onSuccess });
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Diamond size={9} />
        <div>
          <div className={s.headerTitle}>{t('best.dicts.title')}</div>
          <div className={s.headerSub}>{t('best.dicts.subtitle')}</div>
        </div>
      </header>

      <div className={s.split}>
        <nav className={s.nav}>
          {DICTIONARY_KINDS.map((k) => {
            const on = k === activeKind;
            const count = (data?.[k] ?? []).length;
            return (
              <button key={k} onClick={() => { setActiveKind(k); setQuery(''); }} className={cn(s.navBtn, on && s.active)}>
                <Diamond size={6} color={on ? 'var(--gold)' : 'var(--bronze)'} />
                <div className={s.navBtnMeta}>
                  <div className={s.navLabel}>{t(dictLabelKey(k))}</div>
                  <div className={s.navSub}>{t(dictSubKey(k))}</div>
                </div>
                <span className={s.navCount}>{count}</span>
              </button>
            );
          })}
        </nav>

        <main className={s.main}>
          <div className={s.toolbar}>
            <div>
              <div className={s.kindLabel}>{kindLabel}</div>
              <div className={s.kindCount}>{t('best.dicts.count', { kind: activeKind, n: rows.length })}</div>
            </div>
            <div className={s.spacer} />
            <div className={s.searchWrap}>
              <span className={s.searchIcon}><Search size={14} /></span>
              <input className={cn('ao-input', s.searchInput)} placeholder={t('best.com.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="ao-btn ao-btn--primary" onClick={openCreate}><Plus size={13} /> {t('best.dicts.add')}</button>
          </div>

          <div className={cn('ao-panel', s.tablePanel)}>
            <table className={cn('ao-table', s.table)}>
              <thead>
                <tr>
                  <th className={s.colCode}>{t('best.dicts.colCode')}</th>
                  <th>{t('best.dicts.colRu')}</th>
                  <th>{t('best.dicts.colEn')}</th>
                  {isSources && <th className={s.colBook}>{t('best.dicts.colBook')}</th>}
                  <th className={s.colActions}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><span className={s.codeText}>{e.code}</span>{e.isUnique && <span className={cn('ao-chip', s.uniqueChip)}>{t('best.dicts.unique')}</span>}</td>
                    <td className={s.ruCell}>{e.nameRusloc}</td>
                    <td className={s.enCell}>{e.nameEngloc || '—'}</td>
                    {isSources && <td><span className={s.bookText}>{e.bookCode || '—'}</span></td>}
                    <td>
                      <div className={s.actions}>
                        <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => openEdit(e)}><Pencil size={14} /></button>
                        <button className={cn('ao-iconbtn', s.delBtn)} title={t('best.com.delete')} onClick={() => setConfirmDel(e)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && rows.length === 0 && <tr><td colSpan={isSources ? 5 : 4} className={s.emptyCell}>{t('best.dicts.empty')}</td></tr>}
                {isLoading && <tr><td colSpan={isSources ? 5 : 4} className={s.emptyCell}>{t('best.com.loading')}</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {draft && (
        <Modal title={draft.id ? t('best.dicts.editTitle') : t('best.dicts.newTitle')} sub={t('best.dicts.modalSub', { label: kindLabel })} onClose={() => setDraft(null)}>
          <div className={s.formCol}>
            <Field label={t('best.dicts.fCode')} required hint={t('best.dicts.fCodeHint')}>
              <input className={cn('ao-input', s.mono)} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="dragon" />
            </Field>
            <Field label={t('best.dicts.fRu')} required>
              <input className="ao-input" value={draft.nameRusloc} onChange={(e) => setDraft({ ...draft, nameRusloc: e.target.value })} placeholder={t('best.dicts.ruPh')} />
            </Field>
            <Field label={t('best.dicts.fEn')}>
              <input className="ao-input" value={draft.nameEngloc} onChange={(e) => setDraft({ ...draft, nameEngloc: e.target.value })} placeholder="Dragon" />
            </Field>
            {isSources && (
              <Field label={t('best.dicts.fBook')} hint={t('best.dicts.fBookHint')}>
                <input className={cn('ao-input', s.mono)} value={draft.bookCode} onChange={(e) => setDraft({ ...draft, bookCode: e.target.value })} placeholder="MM" />
              </Field>
            )}
            <button onClick={() => setDraft({ ...draft, isUnique: !draft.isUnique })} className={cn(s.checkBtn, draft.isUnique && s.checked)}>
              <span className={s.checkBox}>
                {draft.isUnique && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--void)" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>}
              </span>
              <span className={s.checkLabel}>{t('best.dicts.fUnique')}</span>
            </button>
          </div>
          <div className={s.modalActions}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDraft(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--primary" disabled={createMut.isPending || updateMut.isPending} onClick={saveDraft}><Save size={13} /> {t('best.com.save')}</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title={t('best.dicts.delTitle')} sub={t('best.com.irreversible')} danger onClose={() => setConfirmDel(null)}>
          <p className={s.modalText}>
            {t('best.dicts.delBody', { name: confirmDel.nameRusloc, code: confirmDel.code, label: kindLabel })}
          </p>
          <div className={s.modalActions}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--danger" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate({ kind: activeKind, id: confirmDel.id }, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={cn('ao-label', s.fieldLabel)}>{label}{required && <span className={s.req}> *</span>}</label>
      {children}
      {hint && <div className={s.fieldHint}>{hint}</div>}
    </div>
  );
}

function Modal({ title, sub, danger, onClose, children }: { title: string; sub?: string; danger?: boolean; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  const accent = danger ? '#d8896a' : 'var(--gold)';
  return (
    <div onClick={onClose} className={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={cn('ao-panel ao-frame ao-rise', s.modal)} style={{ '--c': accent } as CSSProperties}>
        <span className="ao-frame-c" />
        <div className={s.modalHead}>
          {danger ? <AlertTriangle size={20} className={s.modalIcon} /> : <span className={s.modalMarker} />}
          <div className={s.modalHeadText}>
            <div className={s.modalTitle}>{title}</div>
            {sub && <div className={s.modalSub}>{sub}</div>}
          </div>
          <button className="ao-iconbtn" onClick={onClose} title={t('best.com.close')}><X size={14} /></button>
        </div>
        <div className={s.modalBody}>{children}</div>
      </div>
    </div>
  );
}
