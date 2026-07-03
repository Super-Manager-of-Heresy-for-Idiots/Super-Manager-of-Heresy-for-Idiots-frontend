import { Fragment, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, SlidersHorizontal, X, AlertTriangle } from 'lucide-react';
import { useAdminMonster, useAdminMonsters, useDeleteAdminMonster, useSetAdminMonsterActive } from '@/hooks/useBestiary';
import MonsterStatblock from '@/components/bestiary/MonsterStatblock';
import { DetailStatus, ExpandChevron, ExpandableRow } from '@/components/common/ExpandableRow';
import { SIZE_VALUES, dictName, sizeKey, type TFunc } from '@/components/bestiary/constants';
import { useI18n, useT } from '@/i18n/I18nContext';
import type { CreatureSize, DictionaryRef, MonsterSummaryResponse } from '@/types';
import { cn } from '@/lib/utils';
import s from './BestiaryMonstersPage.module.css';

const CR_RANGES: { v: string; labelKey: string; min: number; max: number }[] = [
  { v: 'ALL', labelKey: 'best.mon.crAll', min: -1, max: 99 },
  { v: 'low', labelKey: 'best.mon.crLow', min: 0, max: 4 },
  { v: 'mid', labelKey: 'best.mon.crMid', min: 5, max: 10 },
  { v: 'high', labelKey: 'best.mon.crHigh', min: 11, max: 16 },
  { v: 'epic', labelKey: 'best.mon.crEpic', min: 17, max: 99 },
];

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span className={s.diamond} style={{ width: size, height: size, background: color }} />;
}
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled} className={cn(s.toggle, on && s.on)}>
      <span className={s.toggleThumb} />
    </button>
  );
}
function SizeBadge({ size, lang }: { size: DictionaryRef; lang: string }) {
  return (
    <span className={s.sizeBadge}>
      <Diamond size={6} color="var(--bronze)" />{dictName(size, lang)}
    </span>
  );
}
function StatusDot({ active, t }: { active: boolean; t: TFunc }) {
  const c = active ? '#7a9866' : 'var(--ink-faint)';
  return (
    <span className={cn(s.statusDot, active && s.active)} style={{ '--c': c } as CSSProperties}>
      <span className={s.statusInner} />
      {active ? t('best.mon.active') : t('best.mon.inactive')}
    </span>
  );
}
function monsterName(m: MonsterSummaryResponse, lang: string): string {
  return m.name || (lang === 'en' ? m.nameEngloc || m.nameRusloc : m.nameRusloc);
}
function secondaryMonsterName(m: MonsterSummaryResponse, lang: string): string | null {
  const secondary = lang === 'en' ? m.nameRusloc : m.nameEngloc ?? null;
  return secondary && secondary !== monsterName(m, lang) ? secondary : null;
}
function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <select className={cn('ao-input', s.filterSelect)} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.v} value={o.v} className={s.selectOption}>{o.label}</option>)}
    </select>
  );
}

/** Lazily-loaded full statblock rendered inside the expandable detail row. */
function AdminMonsterDetail({ monsterId }: { monsterId: string }) {
  const t = useT();
  const q = useAdminMonster(monsterId);
  if (q.isLoading) return <DetailStatus>{t('best.com.loading')}</DetailStatus>;
  if (q.isError) return <DetailStatus>{t('best.mon.loadError')}</DetailStatus>;
  return q.data ? <MonsterStatblock monster={q.data} /> : null;
}

export default function BestiaryMonstersPage() {
  const navigate = useNavigate();
  const t = useT();
  const { lang } = useI18n();
  const { data: rows = [], isLoading, isError } = useAdminMonsters();
  const setActive = useSetAdminMonsterActive();
  const del = useDeleteAdminMonster();

  const [query, setQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<CreatureSize | 'ALL'>('ALL');
  const [crFilter, setCrFilter] = useState('ALL');
  const [confirmDel, setConfirmDel] = useState<MonsterSummaryResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sizeOptions = [{ v: 'ALL' as const, label: t('best.mon.allSizes') }, ...SIZE_VALUES.map((v) => ({ v, label: t(sizeKey(v)) }))];
  const crOptions = CR_RANGES.map((r) => ({ v: r.v, label: t(r.labelKey) }));

  const filtered = useMemo(() => {
    const cr = CR_RANGES.find((r) => r.v === crFilter)!;
    return rows.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || monsterName(m, lang).toLowerCase().includes(q)
        || m.nameRusloc.toLowerCase().includes(q)
        || (m.nameEngloc ?? '').toLowerCase().includes(q);
      const matchSize = sizeFilter === 'ALL' || m.size.code === sizeFilter;
      const matchCr = m.crValue >= cr.min && m.crValue <= cr.max;
      return matchQ && matchSize && matchCr;
    });
  }, [rows, query, sizeFilter, crFilter, lang]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <Diamond size={9} />
          <div>
            <div className={s.headerTitle}>{t('best.mon.title')}</div>
            <div className={s.headerSub}>{t('best.mon.subtitle')}</div>
          </div>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('new')}><Plus size={13} /> {t('best.mon.create')}</button>
      </header>

      <div className={s.body}>
        <div className={s.filters}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}><Search size={15} /></span>
            <input className={cn('ao-input', s.searchInput)} placeholder={t('best.mon.searchPh')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={sizeFilter} onChange={setSizeFilter} options={sizeOptions} />
          <Select value={crFilter} onChange={setCrFilter} options={crOptions} />
          <span className={s.count}>
            <SlidersHorizontal size={13} /> {t('best.mon.countOf', { n: filtered.length, total: rows.length })}
          </span>
        </div>

        <div className={cn('ao-panel', s.tablePanel)}>
          <table className={cn('ao-table bd-table', s.table)}>
            <thead>
              <tr>
                <th>{t('best.mon.colMonster')}</th>
                <th className={s.colSize}>{t('best.mon.colSize')}</th>
                <th className={s.colCr}>{t('best.mon.colCr')}</th>
                <th className={s.colStatus}>{t('best.mon.colStatus')}</th>
                <th className={s.colActive}>{t('best.mon.colActive')}</th>
                <th className={s.colActions}>{t('best.mon.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isOpen = expandedId === m.id;
                const toggle = () => setExpandedId(isOpen ? null : m.id);
                const displayName = monsterName(m, lang);
                const secondaryName = secondaryMonsterName(m, lang);
                return (
                <Fragment key={m.id}>
                <tr className={cn(s.row, isOpen && s.rowOpen, !m.isActive && s.inactive)}>
                  <td onClick={toggle}>
                    <div className={s.monsterCell}>
                      <ExpandChevron open={isOpen} />
                      <Diamond size={7} color="var(--bronze)" />
                      <div className={s.monsterMeta}>
                        <div className={s.monsterName}>{displayName}</div>
                        <div className={s.monsterSub}>{secondaryName ?? '—'} · {m.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td onClick={toggle}><SizeBadge size={m.size} lang={lang} /></td>
                  <td className={s.center} onClick={toggle}><span className={s.crValue}>{m.crRating}</span></td>
                  <td><StatusDot active={m.isActive} t={t} /></td>
                  <td className={s.center}><Toggle on={m.isActive} disabled={setActive.isPending} onChange={() => setActive.mutate({ id: m.id, active: !m.isActive })} /></td>
                  <td>
                    <div className={s.actions}>
                      <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => navigate(`${m.id}/edit`)}><Pencil size={14} /></button>
                      <button className={cn('ao-iconbtn', s.delBtn)} title={t('best.com.delete')} onClick={() => setConfirmDel(m)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                <ExpandableRow open={isOpen} colSpan={6}><AdminMonsterDetail monsterId={m.id} /></ExpandableRow>
                </Fragment>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className={s.emptyCell}>{isError ? t('best.mon.loadError') : t('best.mon.empty')}</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={6} className={s.emptyCell}>{t('best.com.loading')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} className={s.overlay}>
          <div onClick={(e) => e.stopPropagation()} className={cn('ao-panel ao-frame ao-rise', s.modal)}>
            <span className="ao-frame-c" />
            <div className={s.modalHead}>
              <AlertTriangle size={20} className={s.modalIcon} />
              <div className={s.modalHeadText}>
                <div className={s.modalTitle}>{t('best.mon.delTitle')}</div>
                <div className={s.modalSub}>{t('best.com.irreversible')}</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setConfirmDel(null)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div className={s.modalBody}>
              <p className={s.modalText}>
                {t('best.mon.delBody', { name: monsterName(confirmDel, lang) })}
              </p>
              <div className={s.modalActions}>
                <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>{t('best.com.cancel')}</button>
                <button className="ao-btn ao-btn--danger" disabled={del.isPending} onClick={() => del.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
