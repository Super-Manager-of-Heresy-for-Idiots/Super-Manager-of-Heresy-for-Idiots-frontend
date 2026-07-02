import { Fragment, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, X, Search, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCampaignMonster,
  useCampaignMonsters,
  useCloneCampaignMonster,
  useDeleteCampaignMonster,
  usePublicMonster,
  usePublicMonsters,
  useToggleCampaignMonsterVisibility,
} from '@/hooks/useBestiary';
import MonsterStatblock from '@/components/bestiary/MonsterStatblock';
import { DetailStatus, ExpandChevron, ExpandableRow } from '@/components/common/ExpandableRow';
import { SIZE_VALUES, dictName, sizeKey } from '@/components/bestiary/constants';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CreatureSize, DictionaryRef, MonsterSummaryResponse } from '@/types';
import s from './CampaignBestiaryPage.module.css';

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
function SizeBadge({ size, lang }: { size: DictionaryRef; lang: string }) {
  return <span className={s.sizeBadge}><Diamond size={6} color="var(--bronze)" />{dictName(size, lang)}</span>;
}
function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <select className={cn('ao-input', s.filterSelect)} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.v} value={o.v} className={s.selectOption}>{o.label}</option>)}
    </select>
  );
}

/** Campaign monster full statblock, lazily fetched on first expand. */
function CampaignMonsterDetail({ campaignId, monsterId }: { campaignId: string; monsterId: string }) {
  const t = useT();
  const q = useCampaignMonster(campaignId, monsterId);
  if (q.isLoading) return <DetailStatus>{t('best.com.loading')}</DetailStatus>;
  if (q.isError) return <DetailStatus>{t('best.mon.loadError')}</DetailStatus>;
  return q.data ? <MonsterStatblock monster={q.data} /> : null;
}

/** System (public) monster full statblock, lazily fetched on first expand. */
function SystemMonsterDetail({ monsterId }: { monsterId: string }) {
  const t = useT();
  const q = usePublicMonster(monsterId);
  if (q.isLoading) return <DetailStatus>{t('best.com.loading')}</DetailStatus>;
  if (q.isError) return <DetailStatus>{t('best.mon.loadError')}</DetailStatus>;
  return q.data ? <MonsterStatblock monster={q.data} /> : null;
}

type Tab = 'system' | 'campaign';

export default function CampaignBestiaryPage() {
  const navigate = useNavigate();
  const t = useT();
  const { lang } = useI18n();
  const { campaignId = '' } = useParams();
  const role = useAuthStore((s) => s.user?.role);
  const isGM = role === 'GAME_MASTER' || role === 'ADMIN';

  const monstersQ = useCampaignMonsters(campaignId);
  const clone = useCloneCampaignMonster(campaignId);
  const toggleVis = useToggleCampaignMonsterVisibility(campaignId);
  const del = useDeleteCampaignMonster(campaignId);

  const [tab, setTab] = useState<Tab>('campaign');
  const [confirmDel, setConfirmDel] = useState<MonsterSummaryResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // System browse filters
  const [query, setQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<CreatureSize | 'ALL'>('ALL');
  const [crFilter, setCrFilter] = useState('ALL');

  const systemActive = isGM && tab === 'system';
  const systemQ = usePublicMonsters(systemActive);
  const systemRows = useMemo(() => systemQ.data ?? [], [systemQ.data]);

  const monsters = monstersQ.data ?? [];
  const visible = monsters.filter((m) => m.isVisibleToPlayers);

  const sizeOptions = [{ v: 'ALL' as const, label: t('best.mon.allSizes') }, ...SIZE_VALUES.map((v) => ({ v, label: t(sizeKey(v)) }))];
  const crOptions = CR_RANGES.map((r) => ({ v: r.v, label: t(r.labelKey) }));

  const filteredSystem = useMemo(() => {
    const cr = CR_RANGES.find((r) => r.v === crFilter)!;
    return systemRows.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || m.nameRusloc.toLowerCase().includes(q) || (m.nameEngloc ?? '').toLowerCase().includes(q);
      const matchSize = sizeFilter === 'ALL' || m.size.code === sizeFilter;
      const matchCr = m.crValue >= cr.min && m.crValue <= cr.max;
      return matchQ && matchSize && matchCr;
    });
  }, [systemRows, query, sizeFilter, crFilter]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerMain}>
          <Diamond size={9} />
          <div>
            <div className={s.headerTitle}>{t('best.cmp.title')}</div>
            <div className={s.headerSub}>{t('best.cmp.subtitle', { view: isGM ? t('best.cmp.viewGm') : t('best.cmp.viewPlayer'), n: isGM ? monsters.length : visible.length })}</div>
          </div>
        </div>
        {isGM && tab === 'campaign' && (
          <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> {t('best.cmp.create')}</button>
        )}
      </header>

      {/* Tabs (GM only) */}
      {isGM && (
        <div className={s.tabs}>
          {([
            { v: 'campaign' as const, label: t('best.cmp.tabCampaign') },
            { v: 'system' as const, label: t('best.cmp.tabSystem') },
          ]).map((tb) => (
            <button
              key={tb.v}
              onClick={() => { setTab(tb.v); setExpandedId(null); }}
              className={cn(s.tab, tab === tb.v && s.active)}
            >
              {tb.label}
            </button>
          ))}
        </div>
      )}

      <div className={s.body}>
        {systemActive ? (
          <>
            <div className={s.filterBar}>
              <div className={s.searchWrap}>
                <span className={s.searchIcon}><Search size={15} /></span>
                <input className={cn('ao-input', s.searchInput)} placeholder={t('best.mon.searchPh')} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={sizeFilter} onChange={setSizeFilter} options={sizeOptions} />
              <Select value={crFilter} onChange={setCrFilter} options={crOptions} />
              <span className={s.countBadge}>
                <SlidersHorizontal size={13} /> {t('best.mon.countOf', { n: filteredSystem.length, total: systemRows.length })}
              </span>
            </div>

            <div className={cn('ao-panel', s.tableWrap)}>
              <table className={cn('ao-table bd-table', s.tableSystem)}>
                <thead>
                  <tr>
                    <th>{t('best.mon.colMonster')}</th>
                    <th className={s.colSize}>{t('best.mon.colSize')}</th>
                    <th className={s.colCr}>{t('best.mon.colCr')}</th>
                    <th className={s.colActions}>{t('best.mon.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystem.map((m) => {
                    const isOpen = expandedId === m.id;
                    const toggle = () => setExpandedId(isOpen ? null : m.id);
                    return (
                    <Fragment key={m.id}>
                    <tr className={cn(s.rowClickable, isOpen && s.rowOpen)}>
                      <td onClick={toggle}>
                        <div className={s.nameCell}>
                          <ExpandChevron open={isOpen} />
                          <Diamond size={7} color="var(--bronze)" />
                          <div className={s.nameInner}>
                            <div className={s.monName}>{m.nameRusloc}</div>
                            <div className={s.monSub}>{m.nameEngloc ?? '—'} · {m.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={toggle}><SizeBadge size={m.size} lang={lang} /></td>
                      <td className={s.centerCell} onClick={toggle}><span className={s.crValue}>{m.crRating}</span></td>
                      <td>
                        <div className={s.actionsCell}>
                          <button className="ao-btn ao-btn--ghost ao-btn--sm" disabled={clone.isPending} onClick={() => clone.mutate(m.id, { onSuccess: () => setTab('campaign') })}>
                            <Copy size={13} /> {t('best.cmp.cloneInto')}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <ExpandableRow open={isOpen} colSpan={4}><SystemMonsterDetail monsterId={m.id} /></ExpandableRow>
                    </Fragment>
                    );
                  })}
                  {!systemQ.isLoading && filteredSystem.length === 0 && (
                    <tr><td colSpan={4} className={s.emptyCell}>{systemQ.isError ? t('best.mon.loadError') : t('best.mon.empty')}</td></tr>
                  )}
                  {systemQ.isLoading && (
                    <tr><td colSpan={4} className={s.emptyCell}>{t('best.com.loading')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className={cn('ao-panel', s.tableWrap)}>
              <table className={cn('ao-table', s.tableCampaign, isGM && s.gm)}>
                <thead>
                  <tr>
                    <th>{t('best.mon.colMonster')}</th>
                    <th className={s.colCr}>{t('best.mon.colCr')}</th>
                    <th className={s.colSize}>{t('best.mon.colSize')}</th>
                    <th className={s.colVis}>{t('best.cmp.colVisibility')}</th>
                    {isGM && <th className={s.colActions160}>{t('best.mon.colActions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {monsters.map((m) => {
                    const isOpen = expandedId === m.id;
                    return (
                    <Fragment key={m.id}>
                    <tr className={cn(s.rowClickable, isOpen && s.rowOpen)}>
                      <td onClick={() => setExpandedId(isOpen ? null : m.id)}>
                        <div className={s.nameCell}>
                          <ExpandChevron open={isOpen} />
                          <Diamond size={7} color="var(--bronze)" />
                          <div>
                            <div className={s.monName}>{m.nameRusloc}</div>
                            <div className={s.monSubPlain}>{m.nameEngloc ?? '—'}{m.sourceMonsterId ? ` · ${t('best.cmp.cloneTag')}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className={s.centerCell} onClick={() => setExpandedId(isOpen ? null : m.id)}><span className={s.crValue}>{m.crRating}</span></td>
                      <td onClick={() => setExpandedId(isOpen ? null : m.id)}><SizeBadge size={m.size} lang={lang} /></td>
                      <td className={s.centerCell} onClick={() => setExpandedId(isOpen ? null : m.id)}>
                        {m.isVisibleToPlayers
                          ? <span className={cn(s.visState, s.visOpen)}><Eye size={14} /> {t('best.cmp.open')}</span>
                          : <span className={cn(s.visState, s.visHidden)}><EyeOff size={14} /> {t('best.cmp.hidden')}</span>}
                      </td>
                      {isGM && (
                        <td>
                          <div className={s.actionsCell}>
                            <button className={cn('ao-iconbtn', m.isVisibleToPlayers ? s.iconVisOn : s.iconVisOff)} disabled={toggleVis.isPending} title={m.isVisibleToPlayers ? t('best.cmp.hide') : t('best.cmp.show')} onClick={() => toggleVis.mutate(m.id)}>
                              {m.isVisibleToPlayers ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => navigate(`monsters/${m.id}/edit`)}><Pencil size={14} /></button>
                            <button className={cn('ao-iconbtn', s.iconDanger)} title={t('best.com.delete')} onClick={() => setConfirmDel(m)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                    <ExpandableRow open={isOpen} colSpan={isGM ? 5 : 4}><CampaignMonsterDetail campaignId={campaignId} monsterId={m.id} /></ExpandableRow>
                    </Fragment>
                    );
                  })}
                  {!monstersQ.isLoading && monsters.length === 0 && (
                    <tr><td colSpan={isGM ? 5 : 4} className={s.emptyCell}>{isGM ? t('best.cmp.emptyGm') : t('best.cmp.emptyPlayer')}</td></tr>
                  )}
                  {monstersQ.isLoading && <tr><td colSpan={isGM ? 5 : 4} className={s.emptyCell}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>

            {!isGM && (
              <p className={s.playerNote}>
                <EyeOff size={13} /> {t('best.cmp.note404')}
              </p>
            )}
          </>
        )}
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} className={s.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} className={cn('ao-panel ao-frame ao-rise', s.modalCard)}>
            <span className="ao-frame-c" />
            <div className={s.modalHead}>
              <AlertTriangle size={20} className={s.modalIcon} />
              <div className={s.modalTitle}>{t('best.cmp.delTitle')}</div>
              <button className="ao-iconbtn" onClick={() => setConfirmDel(null)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div className={s.modalBody}>
              <p className={s.modalText}>{t('best.cmp.delBody', { name: confirmDel.nameRusloc })}</p>
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
