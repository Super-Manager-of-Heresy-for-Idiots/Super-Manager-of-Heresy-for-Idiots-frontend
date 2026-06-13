import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, X, Search, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCampaignMonsters,
  useCloneCampaignMonster,
  useDeleteCampaignMonster,
  usePublicMonsters,
  useToggleCampaignMonsterVisibility,
} from '@/hooks/useBestiary';
import { SIZE_VALUES, dictName, sizeKey } from '@/components/bestiary/constants';
import { useI18n, useT } from '@/i18n/I18nContext';
import type { CreatureSize, DictionaryRef, MonsterSummaryResponse } from '@/types';

const CR_RANGES: { v: string; labelKey: string; min: number; max: number }[] = [
  { v: 'ALL', labelKey: 'best.mon.crAll', min: -1, max: 99 },
  { v: 'low', labelKey: 'best.mon.crLow', min: 0, max: 4 },
  { v: 'mid', labelKey: 'best.mon.crMid', min: 5, max: 10 },
  { v: 'high', labelKey: 'best.mon.crHigh', min: 11, max: 16 },
  { v: 'epic', labelKey: 'best.mon.crEpic', min: 17, max: 99 },
];

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function SizeBadge({ size, lang }: { size: DictionaryRef; lang: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-quiet)' }}><Diamond size={6} color="var(--bronze)" />{dictName(size, lang)}</span>;
}
function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <select className="ao-input" value={value} onChange={(e) => onChange(e.target.value as T)}
      style={{ width: 'auto', minWidth: 150, padding: '8px 30px 8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', appearance: 'none', cursor: 'pointer', backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23968c75' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
      {options.map((o) => <option key={o.v} value={o.v} style={{ background: 'var(--abyss)' }}>{o.label}</option>)}
    </select>
  );
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

  // System browse filters
  const [query, setQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<CreatureSize | 'ALL'>('ALL');
  const [crFilter, setCrFilter] = useState('ALL');

  const systemActive = isGM && tab === 'system';
  const systemQ = usePublicMonsters(systemActive);
  const systemRows = systemQ.data ?? [];

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
    <div style={{ minHeight: '100%', background: 'var(--stone)' }}>
      <header style={{ minHeight: 64, borderBottom: '1px solid var(--rule)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '12px clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
          <Diamond size={9} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.cmp.title')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{t('best.cmp.subtitle', { view: isGM ? t('best.cmp.viewGm') : t('best.cmp.viewPlayer'), n: isGM ? monsters.length : visible.length })}</div>
          </div>
        </div>
        {isGM && tab === 'campaign' && (
          <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> {t('best.cmp.create')}</button>
        )}
      </header>

      {/* Tabs (GM only) */}
      {isGM && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', padding: '0 clamp(16px, 3vw, 32px)', background: 'var(--panel)' }}>
          {([
            { v: 'campaign' as const, label: t('best.cmp.tabCampaign') },
            { v: 'system' as const, label: t('best.cmp.tabSystem') },
          ]).map((tb) => (
            <button
              key={tb.v}
              onClick={() => setTab(tb.v)}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === tb.v ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                letterSpacing: 'var(--track-eng)',
                textTransform: 'uppercase',
                color: tab === tb.v ? 'var(--ink-bright)' : 'var(--ink-faint)',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        {systemActive ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={15} /></span>
                <input className="ao-input" placeholder={t('best.mon.searchPh')} value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
              </div>
              <Select value={sizeFilter} onChange={setSizeFilter} options={sizeOptions} />
              <Select value={crFilter} onChange={setCrFilter} options={crOptions} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
                <SlidersHorizontal size={13} /> {t('best.mon.countOf', { n: filteredSystem.length, total: systemRows.length })}
              </span>
            </div>

            <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="ao-table bd-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>{t('best.mon.colMonster')}</th>
                    <th style={{ width: 130 }}>{t('best.mon.colSize')}</th>
                    <th style={{ width: 80, textAlign: 'center' }}>{t('best.mon.colCr')}</th>
                    <th style={{ width: 180, textAlign: 'right' }}>{t('best.mon.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystem.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Diamond size={7} color="var(--bronze)" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink-bright)' }}>{m.nameRusloc}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>{m.nameEngloc ?? '—'} · {m.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td><SizeBadge size={m.size} lang={lang} /></td>
                      <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--gold-pale)' }}>{m.crRating}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="ao-btn ao-btn--ghost ao-btn--sm" disabled={clone.isPending} onClick={() => clone.mutate(m.id, { onSuccess: () => setTab('campaign') })}>
                            <Copy size={13} /> {t('best.cmp.cloneInto')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!systemQ.isLoading && filteredSystem.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{systemQ.isError ? t('best.mon.loadError') : t('best.mon.empty')}</td></tr>
                  )}
                  {systemQ.isLoading && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="ao-table" style={{ minWidth: isGM ? 760 : 520 }}>
                <thead>
                  <tr>
                    <th>{t('best.mon.colMonster')}</th>
                    <th style={{ width: 80, textAlign: 'center' }}>{t('best.mon.colCr')}</th>
                    <th style={{ width: 130 }}>{t('best.mon.colSize')}</th>
                    <th style={{ width: 130, textAlign: 'center' }}>{t('best.cmp.colVisibility')}</th>
                    {isGM && <th style={{ width: 160, textAlign: 'right' }}>{t('best.mon.colActions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {monsters.map((m) => (
                    <tr key={m.id} style={{ cursor: 'pointer' }}>
                      <td onClick={() => navigate(`monsters/${m.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Diamond size={7} color="var(--bronze)" />
                          <div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink-bright)' }}>{m.nameRusloc}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{m.nameEngloc ?? '—'}{m.sourceMonsterId ? ` · ${t('best.cmp.cloneTag')}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--gold-pale)' }}>{m.crRating}</span></td>
                      <td><SizeBadge size={m.size} lang={lang} /></td>
                      <td style={{ textAlign: 'center' }}>
                        {m.isVisibleToPlayers
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--gold-pale)', fontFamily: 'var(--font-mono)', fontSize: 11 }}><Eye size={14} /> {t('best.cmp.open')}</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: 11 }}><EyeOff size={14} /> {t('best.cmp.hidden')}</span>}
                      </td>
                      {isGM && (
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="ao-iconbtn" disabled={toggleVis.isPending} title={m.isVisibleToPlayers ? t('best.cmp.hide') : t('best.cmp.show')} onClick={() => toggleVis.mutate(m.id)} style={{ color: m.isVisibleToPlayers ? 'var(--gold-pale)' : 'var(--ink-faint)', borderColor: m.isVisibleToPlayers ? 'var(--brass)' : 'var(--rule)' }}>
                              {m.isVisibleToPlayers ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button className="ao-iconbtn" title={t('best.com.edit')} onClick={() => navigate(`monsters/${m.id}/edit`)}><Pencil size={14} /></button>
                            <button className="ao-iconbtn" title={t('best.com.delete')} onClick={() => setConfirmDel(m)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!monstersQ.isLoading && monsters.length === 0 && (
                    <tr><td colSpan={isGM ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{isGM ? t('best.cmp.emptyGm') : t('best.cmp.emptyPlayer')}</td></tr>
                  )}
                  {monstersQ.isLoading && <tr><td colSpan={isGM ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</td></tr>}
                </tbody>
              </table>
            </div>

            {!isGM && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <EyeOff size={13} /> {t('best.cmp.note404')}
              </p>
            )}
          </>
        )}
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
          <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 460, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
            <span className="ao-frame-c" />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
              <AlertTriangle size={20} style={{ color: '#d8896a', marginTop: 2 }} />
              <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.cmp.delTitle')}</div>
              <button className="ao-iconbtn" onClick={() => setConfirmDel(null)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>{t('best.cmp.delBody', { name: confirmDel.nameRusloc })}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>{t('best.com.cancel')}</button>
                <button className="ao-btn ao-btn--danger" disabled={del.isPending} onClick={() => del.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> {t('best.com.delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 600px) { .bd-table thead { display: none; } }`}</style>
    </div>
  );
}
