import React, { useState } from 'react';
import type { CSSProperties } from 'react';
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
import { DICTIONARY_KINDS, dictLabelKey, dictName } from '@/components/bestiary/constants';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { DictionaryEntryResponse, DictionaryKind, DictionaryRef, MonsterSummaryResponse } from '@/types';
import s from './HomebrewBestiaryPage.module.css';

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span className={s.diamond} style={{ '--dsz': `${size}px`, '--c': color } as CSSProperties} />;
}
function SizeBadge({ size, lang }: { size: DictionaryRef; lang: string }) {
  return <span className={s.sizeBadge}><Diamond size={6} color="var(--bronze)" />{dictName(size, lang)}</span>;
}

interface DraftState { id: string | null; code: string; nameRusloc: string; nameEngloc: string; bookCode: string; isUnique: boolean; }
const EMPTY_DRAFT: DraftState = { id: null, code: '', nameRusloc: '', nameEngloc: '', bookCode: '', isUnique: false };

export default function HomebrewBestiaryPage() {
  const navigate = useNavigate();
  const t = useT();
  const { lang } = useI18n();
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
  const forkList = (forkSourcesQ.data ?? []).filter((src) => !forkFilter.trim() || src.nameRusloc.toLowerCase().includes(forkFilter.trim().toLowerCase()));
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
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headRow}>
          <span className={s.headIcon}><Package size={22} /></span>
          <div className={s.headTitleWrap}>
            <span className={s.headTitle}>{t('best.hb.title')}</span>
            <div className={s.headSub}>{t('best.hb.subtitle', { id: packageId.slice(0, 8) })}</div>
          </div>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/gm/homebrew/${packageId}/edit`)}>{t('best.hb.toPackage')}</button>
        </div>
        <div className={s.tabBar}>
          {([['monsters', t('best.hb.tabMonsters')], ['dictionaries', t('best.hb.tabDicts')]] as const).map(([tk, label]) => {
            const on = tab === tk;
            return (
              <button key={tk} onClick={() => setTab(tk)} className={cn(s.tabBtn, on && s.on)}>{label}</button>
            );
          })}
        </div>
      </header>

      <div className={s.body}>
        {tab === 'monsters' ? (
          <>
            <div className={s.toolbar}>
              <div className={s.toolCount}>{t('best.hb.count', { n: monsters.length })}</div>
              <div className={s.grow} />
              <button className="ao-btn ao-btn--ghost" onClick={() => { setForkFilter(''); setForkOpen(true); }}><Copy size={13} /> {t('best.hb.duplicate')}</button>
              <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> {t('best.hb.create')}</button>
            </div>
            <div className={cn('ao-panel', s.tableWrap)}>
              <table className={cn('ao-table', s.monTable)}>
                <thead><tr><th>{t('best.mon.colMonster')}</th><th className={s.colW80}>{t('best.mon.colCr')}</th><th className={s.colW130}>{t('best.mon.colSize')}</th><th className={s.colW110}>{t('best.hb.colOrigin')}</th><th className={s.colW96}>{t('best.mon.colActions')}</th></tr></thead>
                <tbody>
                  {monsters.map((m) => (
                    <tr key={m.id} className={s.clickRow}>
                      <td onClick={() => navigate(`monsters/${m.id}`)}>
                        <div className={s.monNameCell}>
                          <Diamond size={7} color="var(--bronze)" />
                          <div>
                            <div className={s.monName}>{m.nameRusloc}</div>
                            <div className={s.monSlug}>{m.nameEngloc ?? '—'} · {m.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className={s.colCenter}><span className={s.crValue}>{m.crRating}</span></td>
                      <td><SizeBadge size={m.size} lang={lang} /></td>
                      <td>{m.sourceMonsterId ? <span className="ao-chip ao-chip--gold">{t('best.hb.fork')}</span> : <span className="ao-chip">{t('best.hb.fromScratch')}</span>}</td>
                      <td>
                        <div className={s.rowActions}>
                          <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => navigate(`monsters/${m.id}/edit`)}><Pencil size={14} /></button>
                          <button className={cn('ao-iconbtn', s.dangerIcon)} title={t('best.com.delete')} onClick={() => setConfirmMonster(m)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!monstersQ.isLoading && monsters.length === 0 && <tr><td colSpan={5} className={s.emptyCell}>{t('best.hb.emptyMonsters')}</td></tr>}
                  {monstersQ.isLoading && <tr><td colSpan={5} className={s.emptyCell}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <p className={s.dictsCaption}>{t('best.hb.dictsCaption')}</p>
            <div className={s.kindRow}>
              {DICTIONARY_KINDS.map((k) => {
                const on = k === activeKind;
                return (
                  <button key={k} onClick={() => setActiveKind(k)} className={cn(s.kindBtn, on && s.on)}>
                    {t(dictLabelKey(k))}
                  </button>
                );
              })}
              <div className={s.grow} />
              <button className="ao-btn ao-btn--primary" onClick={() => setDraft({ ...EMPTY_DRAFT })}><Plus size={13} /> {t('best.hb.addEntry')}</button>
            </div>
            <div className={cn('ao-panel', s.tableWrap)}>
              <table className={cn('ao-table', s.dictTable)}>
                <thead><tr><th className={s.colW180}>{t('best.dicts.colCode')}</th><th>{t('best.dicts.colRu')}</th><th>{t('best.dicts.colEn')}</th>{isSources && <th className={s.colW100}>{t('best.dicts.colBook')}</th>}<th className={s.colW88}></th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td><span className={s.dictCode}>{e.code}</span> <span className={cn('ao-chip ao-chip--arcane', s.chipGap)}>{t('best.hb.homebrew')}</span></td>
                      <td className={s.dictRu}>{e.nameRusloc}</td>
                      <td className={s.dictEn}>{e.nameEngloc || '—'}</td>
                      {isSources && <td><span className={s.dictBook}>{e.bookCode || '—'}</span></td>}
                      <td>
                        <div className={s.rowActions}>
                          <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => setDraft({ id: e.id, code: e.code, nameRusloc: e.nameRusloc, nameEngloc: e.nameEngloc || '', bookCode: e.bookCode || '', isUnique: e.isUnique })}><Pencil size={14} /></button>
                          <button className={cn('ao-iconbtn', s.dangerIcon)} title={t('best.com.delete')} onClick={() => setConfirmEntry(e)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!dictQ.isLoading && entries.length === 0 && <tr><td colSpan={isSources ? 5 : 4} className={s.emptyCell}>{t('best.hb.emptyDict')}</td></tr>}
                  {dictQ.isLoading && <tr><td colSpan={isSources ? 5 : 4} className={s.emptyCell}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {forkOpen && (
        <div onClick={() => setForkOpen(false)} className={s.overlay}>
          <div onClick={(e) => e.stopPropagation()} className={cn('ao-panel ao-frame ao-rise', s.forkCard)}>
            <span className="ao-frame-c" />
            <div className={s.modalHead}>
              <Copy size={18} className={s.iconGold} />
              <div className={s.modalHeadMain}>
                <div className={s.modalHeadTitle}>{t('best.hb.forkTitle')}</div>
                <div className={s.modalHeadSub}>{t('best.hb.forkSub')}</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setForkOpen(false)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div className={s.modalContent}>
              <div className={s.searchRel}>
                <span className={s.searchIcon}><Search size={14} /></span>
                <input className={cn('ao-input', s.searchInput)} placeholder={t('best.hb.forkSearchPh')} value={forkFilter} onChange={(e) => setForkFilter(e.target.value)} autoFocus />
              </div>
              <div className={cn(s.forkList, 'ao-scroll')}>
                {forkSourcesQ.isLoading && <div className={s.forkLoading}>{t('best.com.loading')}</div>}
                {forkList.map((src) => (
                  <button key={src.id} className={cn('ao-panel--inset', s.forkItem)} disabled={duplicate.isPending} onClick={() => duplicate.mutate(src.id, { onSuccess: () => setForkOpen(false) })}>
                    <Diamond size={7} color="var(--bronze)" />
                    <div className={s.forkItemMain}>
                      <div className={s.forkItemName}>{src.nameRusloc}</div>
                      <div className={s.forkItemCr}>{t('best.com.cr')} {src.crRating}</div>
                    </div>
                    <BookOpen size={15} className={s.iconFaint} />
                  </button>
                ))}
                {!forkSourcesQ.isLoading && forkList.length === 0 && <div className={s.forkLoading}>{t('best.mon.empty')}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {draft && (
        <DictModal title={draft.id ? t('best.dicts.editTitle') : t('best.dicts.newTitleHb')} onClose={() => setDraft(null)}>
          <div className={s.fields}>
            <Labeled label={t('best.dicts.fCode')} required><input className={cn('ao-input', s.mono)} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="moon-touched" /></Labeled>
            <Labeled label={t('best.dicts.fRu')} required><input className="ao-input" value={draft.nameRusloc} onChange={(e) => setDraft({ ...draft, nameRusloc: e.target.value })} placeholder={t('best.hb.ruPh')} /></Labeled>
            <Labeled label={t('best.dicts.fEn')}><input className="ao-input" value={draft.nameEngloc} onChange={(e) => setDraft({ ...draft, nameEngloc: e.target.value })} placeholder="Moon-Touched" /></Labeled>
            {isSources && <Labeled label={t('best.dicts.fBook')}><input className={cn('ao-input', s.mono)} value={draft.bookCode} onChange={(e) => setDraft({ ...draft, bookCode: e.target.value })} placeholder="HM" /></Labeled>}
          </div>
          <div className={s.modalActions}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDraft(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--primary" disabled={createEntry.isPending || updateEntry.isPending} onClick={saveDraft}><Save size={13} /> {t('best.com.save')}</button>
          </div>
        </DictModal>
      )}

      {confirmMonster && (
        <DictModal title={t('best.hb.delMonsterTitle')} danger onClose={() => setConfirmMonster(null)}>
          <p className={s.confirmText}>{t('best.hb.delMonsterBody', { name: confirmMonster.nameRusloc })}</p>
          <div className={s.modalActions}>
            <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmMonster(null)}>{t('best.com.cancel')}</button>
            <button className="ao-btn ao-btn--danger" disabled={deleteMonster.isPending} onClick={() => deleteMonster.mutate(confirmMonster.id, { onSuccess: () => setConfirmMonster(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
          </div>
        </DictModal>
      )}

      {confirmEntry && (
        <DictModal title={t('best.hb.delEntryTitle')} danger onClose={() => setConfirmEntry(null)}>
          <p className={s.confirmText}>{t('best.hb.delEntryBody', { name: confirmEntry.nameRusloc })}</p>
          <div className={s.modalActions}>
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
      <label className={cn('ao-label', s.label)}>{label}{required && <span className={s.reqMark}> *</span>}</label>
      {children}
    </div>
  );
}
function DictModal({ title, danger, onClose, children }: { title: string; danger?: boolean; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  const accent = danger ? '#d8896a' : 'var(--gold)';
  return (
    <div onClick={onClose} className={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={cn('ao-panel ao-frame ao-rise', s.modalCard)}>
        <span className="ao-frame-c" />
        <div className={cn(s.modalHead, danger && s.modalHeadDanger)}>
          {danger
            ? <AlertTriangle size={20} className={s.modalAccentIcon} style={{ '--c': accent } as CSSProperties} />
            : <span className={s.modalAccentDiamond} style={{ '--c': accent } as CSSProperties} />}
          <div className={s.modalTitleFull}>{title}</div>
          <button className="ao-iconbtn" onClick={onClose} title={t('best.com.close')}><X size={14} /></button>
        </div>
        <div className={s.modalContent}>{children}</div>
      </div>
    </div>
  );
}
