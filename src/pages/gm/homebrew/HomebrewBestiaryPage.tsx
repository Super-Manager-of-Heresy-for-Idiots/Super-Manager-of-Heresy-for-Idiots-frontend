import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Copy, X, Search, Package, BookOpen, Save, AlertTriangle } from 'lucide-react';
import {
  useCreateHomebrewDictionaryEntry,
  useDeleteHomebrewDictionaryEntry,
  useDeleteHomebrewMonster,
  useDuplicateHomebrewMonster,
  useHomebrewDictionary,
  useHomebrewMonsters,
  usePublicMonsters,
  useUpdateHomebrewDictionaryEntry,
} from '@/hooks/useBestiary';
import { DICTIONARY_KINDS, dictLabelKey, sizeKey, type TFunc } from '@/components/bestiary/constants';
import { useT } from '@/i18n/I18nContext';
import type { CreatureSize, DictionaryEntryResponse, DictionaryKind, MonsterSummaryResponse } from '@/types';

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function SizeBadge({ size, t }: { size: CreatureSize; t: TFunc }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-quiet)' }}><Diamond size={6} color="var(--bronze)" />{t(sizeKey(size))}</span>;
}

interface DraftState { id: string | null; code: string; nameRusloc: string; nameEngloc: string; bookCode: string; isUnique: boolean; }
const EMPTY_DRAFT: DraftState = { id: null, code: '', nameRusloc: '', nameEngloc: '', bookCode: '', isUnique: false };

export default function HomebrewBestiaryPage() {
  const navigate = useNavigate();
  const t = useT();
  const { packageId = '' } = useParams();
  const [tab, setTab] = useState<'monsters' | 'dictionaries'>('monsters');
  const [activeKind, setActiveKind] = useState<DictionaryKind>('creature-types');
  const [forkOpen, setForkOpen] = useState(false);
  const [forkFilter, setForkFilter] = useState('');
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [confirmMonster, setConfirmMonster] = useState<MonsterSummaryResponse | null>(null);
  const [confirmEntry, setConfirmEntry] = useState<DictionaryEntryResponse | null>(null);

  const monstersQ = useHomebrewMonsters(packageId);
  const dictQ = useHomebrewDictionary(packageId, activeKind);
  const forkSourcesQ = usePublicMonsters(forkOpen);

  const duplicate = useDuplicateHomebrewMonster(packageId);
  const deleteMonster = useDeleteHomebrewMonster(packageId);
  const createEntry = useCreateHomebrewDictionaryEntry(packageId);
  const updateEntry = useUpdateHomebrewDictionaryEntry(packageId);
  const deleteEntry = useDeleteHomebrewDictionaryEntry(packageId);

  const monsters = monstersQ.data ?? [];
  const entries = dictQ.data ?? [];
  const forkList = (forkSourcesQ.data ?? []).filter((s) => !forkFilter.trim() || s.nameRusloc.toLowerCase().includes(forkFilter.trim().toLowerCase()));
  const isSources = activeKind === 'sources';

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
    if (draft.id) updateEntry.mutate({ kind: activeKind, id: draft.id, data: payload }, { onSuccess });
    else createEntry.mutate({ kind: activeKind, data: payload }, { onSuccess });
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--stone)' }}>
      <header style={{ borderBottom: '1px solid var(--rule)', padding: '16px clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 44, height: 44, border: '1px solid var(--brass)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}><Package size={22} /></span>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.hb.title')}</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>{t('best.hb.subtitle', { id: packageId.slice(0, 8) })}</div>
          </div>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/gm/homebrew/${packageId}/edit`)}>{t('best.hb.toPackage')}</button>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 16, marginBottom: -16 }}>
          {([['monsters', t('best.hb.tabMonsters')], ['dictionaries', t('best.hb.tabDicts')]] as const).map(([tk, label]) => {
            const on = tab === tk;
            return (
              <button key={tk} onClick={() => setTab(tk)} style={{ position: 'relative', padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: `2px solid ${on ? 'var(--gold)' : 'transparent'}`, color: on ? 'var(--gold-pale)' : 'var(--ink-faint)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', cursor: 'pointer' }}>{label}</button>
            );
          })}
        </div>
      </header>

      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        {tab === 'monsters' ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-quiet)' }}>{t('best.hb.count', { n: monsters.length })}</div>
              <div style={{ flex: 1 }} />
              <button className="ao-btn ao-btn--ghost" onClick={() => { setForkFilter(''); setForkOpen(true); }}><Copy size={13} /> {t('best.hb.duplicate')}</button>
              <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> {t('best.hb.create')}</button>
            </div>
            <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="ao-table" style={{ minWidth: 620 }}>
                <thead><tr><th>{t('best.mon.colMonster')}</th><th style={{ width: 80, textAlign: 'center' }}>{t('best.mon.colCr')}</th><th style={{ width: 130 }}>{t('best.mon.colSize')}</th><th style={{ width: 110 }}>{t('best.hb.colOrigin')}</th><th style={{ width: 96, textAlign: 'right' }}>{t('best.mon.colActions')}</th></tr></thead>
                <tbody>
                  {monsters.map((m) => (
                    <tr key={m.id} style={{ cursor: 'pointer' }}>
                      <td onClick={() => navigate(`monsters/${m.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Diamond size={7} color="var(--bronze)" />
                          <div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink-bright)' }}>{m.nameRusloc}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{m.nameEngloc ?? '—'} · {m.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--gold-pale)' }}>{m.crRating}</span></td>
                      <td><SizeBadge size={m.size} t={t} /></td>
                      <td>{m.sourceMonsterId ? <span className="ao-chip ao-chip--gold">{t('best.hb.fork')}</span> : <span className="ao-chip">{t('best.hb.fromScratch')}</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => navigate(`monsters/${m.id}/edit`)}><Pencil size={14} /></button>
                          <button className="ao-iconbtn" title={t('best.com.delete')} onClick={() => setConfirmMonster(m)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!monstersQ.isLoading && monsters.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '36px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.hb.emptyMonsters')}</td></tr>}
                  {monstersQ.isLoading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '36px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-quiet)', margin: '0 0 16px' }}>{t('best.hb.dictsCaption')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {DICTIONARY_KINDS.map((k) => {
                const on = k === activeKind;
                return (
                  <button key={k} onClick={() => setActiveKind(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: on ? 'rgba(176,141,78,0.1)' : 'var(--abyss)', border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, color: on ? 'var(--gold-pale)' : 'var(--ink-quiet)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {t(dictLabelKey(k))}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button className="ao-btn ao-btn--primary" onClick={() => setDraft({ ...EMPTY_DRAFT })}><Plus size={13} /> {t('best.hb.addEntry')}</button>
            </div>
            <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="ao-table" style={{ minWidth: 480 }}>
                <thead><tr><th style={{ width: 180 }}>{t('best.dicts.colCode')}</th><th>{t('best.dicts.colRu')}</th><th>{t('best.dicts.colEn')}</th>{isSources && <th style={{ width: 100 }}>{t('best.dicts.colBook')}</th>}<th style={{ width: 88, textAlign: 'right' }}></th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-pale)' }}>{e.code}</span> <span className="ao-chip ao-chip--arcane" style={{ marginLeft: 6 }}>{t('best.hb.homebrew')}</span></td>
                      <td style={{ color: 'var(--ink-bright)', fontFamily: 'var(--font-serif)', fontSize: 16 }}>{e.nameRusloc}</td>
                      <td style={{ color: 'var(--ink-quiet)' }}>{e.nameEngloc || '—'}</td>
                      {isSources && <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--arcane)' }}>{e.bookCode || '—'}</span></td>}
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => setDraft({ id: e.id, code: e.code, nameRusloc: e.nameRusloc, nameEngloc: e.nameEngloc || '', bookCode: e.bookCode || '', isUnique: e.isUnique })}><Pencil size={14} /></button>
                          <button className="ao-iconbtn" title={t('best.com.delete')} onClick={() => setConfirmEntry(e)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!dictQ.isLoading && entries.length === 0 && <tr><td colSpan={isSources ? 5 : 4} style={{ textAlign: 'center', padding: '36px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.hb.emptyDict')}</td></tr>}
                  {dictQ.isLoading && <tr><td colSpan={isSources ? 5 : 4} style={{ textAlign: 'center', padding: '36px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {forkOpen && (
        <div onClick={() => setForkOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
          <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 500, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
            <span className="ao-frame-c" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
              <Copy size={18} style={{ color: 'var(--gold)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.hb.forkTitle')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{t('best.hb.forkSub')}</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setForkOpen(false)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={14} /></span>
                <input className="ao-input" placeholder={t('best.hb.forkSearchPh')} value={forkFilter} onChange={(e) => setForkFilter(e.target.value)} style={{ paddingLeft: 34 }} autoFocus />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }} className="ao-scroll">
                {forkSourcesQ.isLoading && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</div>}
                {forkList.map((s) => (
                  <button key={s.id} className="ao-panel--inset" disabled={duplicate.isPending} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--rule)' }} onClick={() => duplicate.mutate(s.id, { onSuccess: () => setForkOpen(false) })}>
                    <Diamond size={7} color="var(--bronze)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink-bright)' }}>{s.nameRusloc}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{t('best.com.cr')} {s.crRating}</div>
                    </div>
                    <BookOpen size={15} style={{ color: 'var(--ink-faint)' }} />
                  </button>
                ))}
                {!forkSourcesQ.isLoading && forkList.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.mon.empty')}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {draft && (
        <DictModal title={draft.id ? t('best.dicts.editTitle') : t('best.dicts.newTitleHb')} onClose={() => setDraft(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Labeled label={t('best.dicts.fCode')} required><input className="ao-input" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="moon-touched" style={{ fontFamily: 'var(--font-mono)' }} /></Labeled>
            <Labeled label={t('best.dicts.fRu')} required><input className="ao-input" value={draft.nameRusloc} onChange={(e) => setDraft({ ...draft, nameRusloc: e.target.value })} placeholder={t('best.hb.ruPh')} /></Labeled>
            <Labeled label={t('best.dicts.fEn')}><input className="ao-input" value={draft.nameEngloc} onChange={(e) => setDraft({ ...draft, nameEngloc: e.target.value })} placeholder="Moon-Touched" /></Labeled>
            {isSources && <Labeled label={t('best.dicts.fBook')}><input className="ao-input" value={draft.bookCode} onChange={(e) => setDraft({ ...draft, bookCode: e.target.value })} placeholder="HM" style={{ fontFamily: 'var(--font-mono)' }} /></Labeled>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDraft(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--primary" disabled={createEntry.isPending || updateEntry.isPending} onClick={saveDraft}><Save size={13} /> {t('best.com.save')}</button>
          </div>
        </DictModal>
      )}

      {confirmMonster && (
        <DictModal title={t('best.hb.delMonsterTitle')} danger onClose={() => setConfirmMonster(null)}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>{t('best.hb.delMonsterBody', { name: confirmMonster.nameRusloc })}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmMonster(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--danger" disabled={deleteMonster.isPending} onClick={() => deleteMonster.mutate(confirmMonster.id, { onSuccess: () => setConfirmMonster(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
          </div>
        </DictModal>
      )}

      {confirmEntry && (
        <DictModal title={t('best.hb.delEntryTitle')} danger onClose={() => setConfirmEntry(null)}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>{t('best.hb.delEntryBody', { name: confirmEntry.nameRusloc })}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmEntry(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--danger" disabled={deleteEntry.isPending} onClick={() => deleteEntry.mutate({ kind: activeKind, id: confirmEntry.id }, { onSuccess: () => setConfirmEntry(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
          </div>
        </DictModal>
      )}
    </div>
  );
}

function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="ao-label" style={{ marginBottom: 6 }}>{label}{required && <span style={{ color: 'var(--ember)' }}> *</span>}</label>
      {children}
    </div>
  );
}
function DictModal({ title, danger, onClose, children }: { title: string; danger?: boolean; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  const accent = danger ? '#d8896a' : 'var(--gold)';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
      <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 460, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
        <span className="ao-frame-c" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
          {danger ? <AlertTriangle size={20} style={{ color: accent, marginTop: 2 }} /> : <span style={{ width: 18, height: 18, transform: 'rotate(45deg)', background: accent, marginTop: 4 }} />}
          <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{title}</div>
          <button className="ao-iconbtn" onClick={onClose} title={t('best.com.close')}><X size={14} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
