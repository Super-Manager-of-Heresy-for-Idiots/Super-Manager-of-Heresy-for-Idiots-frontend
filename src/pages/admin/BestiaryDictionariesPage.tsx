import React, { useState } from 'react';
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

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
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
    <div style={{ minHeight: '100%', background: 'var(--stone)' }}>
      <header style={{ minHeight: 64, borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)' }}>
        <Diamond size={9} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.dicts.title')}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{t('best.dicts.subtitle')}</div>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }} className="bd-split">
        <nav style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--rule)', background: 'var(--abyss)', padding: '12px 0' }} className="bd-nav">
          {DICTIONARY_KINDS.map((k) => {
            const on = k === activeKind;
            const count = (data?.[k] ?? []).length;
            return (
              <button key={k} onClick={() => { setActiveKind(k); setQuery(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: on ? 'linear-gradient(90deg, rgba(176,141,78,0.1), transparent)' : 'transparent', border: 'none', borderLeft: `2px solid ${on ? 'var(--gold)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
                <Diamond size={6} color={on ? 'var(--gold)' : 'var(--bronze)'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: on ? 'var(--ink-bright)' : 'var(--ink)' }}>{t(dictLabelKey(k))}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{t(dictSubKey(k))}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: on ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>{count}</span>
              </button>
            );
          })}
        </nav>

        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(16px, 3vw, 24px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink-bright)' }}>{kindLabel}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{t('best.dicts.count', { kind: activeKind, n: rows.length })}</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative', width: 220 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={14} /></span>
              <input className="ao-input" placeholder={t('best.com.search')} value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: '8px 12px 8px 34px' }} />
            </div>
            <button className="ao-btn ao-btn--primary" onClick={openCreate}><Plus size={13} /> {t('best.dicts.add')}</button>
          </div>

          <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="ao-table" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ width: 160 }}>{t('best.dicts.colCode')}</th>
                  <th>{t('best.dicts.colRu')}</th>
                  <th>{t('best.dicts.colEn')}</th>
                  {isSources && <th style={{ width: 100 }}>{t('best.dicts.colBook')}</th>}
                  <th style={{ width: 88, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-pale)' }}>{e.code}</span>{e.isUnique && <span className="ao-chip" style={{ marginLeft: 8 }}>{t('best.dicts.unique')}</span>}</td>
                    <td style={{ color: 'var(--ink-bright)', fontFamily: 'var(--font-serif)', fontSize: 16 }}>{e.nameRusloc}</td>
                    <td style={{ color: 'var(--ink-quiet)' }}>{e.nameEngloc || '—'}</td>
                    {isSources && <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--arcane)' }}>{e.bookCode || '—'}</span></td>}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => openEdit(e)}><Pencil size={14} /></button>
                        <button className="ao-iconbtn" title={t('best.com.delete')} onClick={() => setConfirmDel(e)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && rows.length === 0 && <tr><td colSpan={isSources ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.dicts.empty')}</td></tr>}
                {isLoading && <tr><td colSpan={isSources ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {draft && (
        <Modal title={draft.id ? t('best.dicts.editTitle') : t('best.dicts.newTitle')} sub={t('best.dicts.modalSub', { label: kindLabel })} onClose={() => setDraft(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label={t('best.dicts.fCode')} required hint={t('best.dicts.fCodeHint')}>
              <input className="ao-input" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="dragon" style={{ fontFamily: 'var(--font-mono)' }} />
            </Field>
            <Field label={t('best.dicts.fRu')} required>
              <input className="ao-input" value={draft.nameRusloc} onChange={(e) => setDraft({ ...draft, nameRusloc: e.target.value })} placeholder={t('best.dicts.ruPh')} />
            </Field>
            <Field label={t('best.dicts.fEn')}>
              <input className="ao-input" value={draft.nameEngloc} onChange={(e) => setDraft({ ...draft, nameEngloc: e.target.value })} placeholder="Dragon" />
            </Field>
            {isSources && (
              <Field label={t('best.dicts.fBook')} hint={t('best.dicts.fBookHint')}>
                <input className="ao-input" value={draft.bookCode} onChange={(e) => setDraft({ ...draft, bookCode: e.target.value })} placeholder="MM" style={{ fontFamily: 'var(--font-mono)' }} />
              </Field>
            )}
            <button onClick={() => setDraft({ ...draft, isUnique: !draft.isUnique })} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
              <span style={{ width: 18, height: 18, border: `1px solid ${draft.isUnique ? 'var(--brass)' : 'var(--rule)'}`, background: draft.isUnique ? 'var(--gold-deep)' : 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {draft.isUnique && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--void)" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>}
              </span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{t('best.dicts.fUnique')}</span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDraft(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--primary" disabled={createMut.isPending || updateMut.isPending} onClick={saveDraft}><Save size={13} /> {t('best.com.save')}</button>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title={t('best.dicts.delTitle')} sub={t('best.com.irreversible')} danger onClose={() => setConfirmDel(null)}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
            {t('best.dicts.delBody', { name: confirmDel.nameRusloc, code: confirmDel.code, label: kindLabel })}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--danger" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate({ kind: activeKind, id: confirmDel.id }, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
          </div>
        </Modal>
      )}

      <style>{`
        @media (max-width: 720px) {
          .bd-split { flex-direction: column; }
          .bd-nav { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--rule); display: flex; overflow-x: auto; padding: 8px !important; }
          .bd-nav > button { width: auto !important; flex-shrink: 0; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="ao-label" style={{ marginBottom: 6 }}>{label}{required && <span style={{ color: 'var(--ember)' }}> *</span>}</label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Modal({ title, sub, danger, onClose, children }: { title: string; sub?: string; danger?: boolean; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  const accent = danger ? '#d8896a' : 'var(--gold)';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
      <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 480, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
        <span className="ao-frame-c" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
          {danger ? <AlertTriangle size={20} style={{ color: accent, marginTop: 2 }} /> : <span style={{ width: 18, height: 18, transform: 'rotate(45deg)', background: accent, marginTop: 4 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{title}</div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{sub}</div>}
          </div>
          <button className="ao-iconbtn" onClick={onClose} title={t('best.com.close')}><X size={14} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
