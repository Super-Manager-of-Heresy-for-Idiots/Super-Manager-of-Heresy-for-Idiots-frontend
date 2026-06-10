import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy, X, Search, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useCampaignMonsters,
  useCloneCampaignMonster,
  useDeleteCampaignMonster,
  usePublicMonsters,
  useToggleCampaignMonsterVisibility,
} from '@/hooks/useBestiary';
import { sizeKey, type TFunc } from '@/components/bestiary/constants';
import { useT } from '@/i18n/I18nContext';
import type { CreatureSize, MonsterSummaryResponse } from '@/types';

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function SizeBadge({ size, t }: { size: CreatureSize; t: TFunc }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-quiet)' }}><Diamond size={6} color="var(--bronze)" />{t(sizeKey(size))}</span>;
}

export default function CampaignBestiaryPage() {
  const navigate = useNavigate();
  const t = useT();
  const { campaignId = '' } = useParams();
  const role = useAuthStore((s) => s.user?.role);
  const isGM = role === 'GAME_MASTER' || role === 'ADMIN';

  const monstersQ = useCampaignMonsters(campaignId);
  const clone = useCloneCampaignMonster(campaignId);
  const toggleVis = useToggleCampaignMonsterVisibility(campaignId);
  const del = useDeleteCampaignMonster(campaignId);

  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneFilter, setCloneFilter] = useState('');
  const [confirmDel, setConfirmDel] = useState<MonsterSummaryResponse | null>(null);

  const cloneSourcesQ = usePublicMonsters(cloneOpen);
  const monsters = monstersQ.data ?? [];
  const visible = monsters.filter((m) => m.isVisibleToPlayers);
  const cloneList = (cloneSourcesQ.data ?? []).filter((s) => !cloneFilter.trim() || s.nameRusloc.toLowerCase().includes(cloneFilter.trim().toLowerCase()));

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
        {isGM && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => { setCloneFilter(''); setCloneOpen(true); }}><Copy size={13} /> {t('best.cmp.clone')}</button>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> {t('best.cmp.create')}</button>
          </div>
        )}
      </header>

      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
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
                  <td><SizeBadge size={m.size} t={t} /></td>
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
      </div>

      {cloneOpen && (
        <div onClick={() => setCloneOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
          <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 520, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
            <span className="ao-frame-c" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
              <Copy size={18} style={{ color: 'var(--gold)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.cmp.cloneTitle')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{t('best.cmp.cloneSub')}</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setCloneOpen(false)} title={t('best.com.close')}><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={14} /></span>
                <input className="ao-input" placeholder={t('best.cmp.cloneSearchPh')} value={cloneFilter} onChange={(e) => setCloneFilter(e.target.value)} style={{ paddingLeft: 34 }} autoFocus />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }} className="ao-scroll">
                {cloneSourcesQ.isLoading && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.com.loading')}</div>}
                {cloneList.map((s) => (
                  <button key={s.id} className="ao-panel--inset" disabled={clone.isPending} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--rule)' }} onClick={() => clone.mutate(s.id, { onSuccess: () => setCloneOpen(false) })}>
                    <Diamond size={7} color="var(--bronze)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink-bright)' }}>{s.nameRusloc}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{t('best.com.cr')} {s.crRating}</div>
                    </div>
                    <span className="ao-chip ao-chip--gold">{t('best.cmp.system')}</span>
                  </button>
                ))}
                {!cloneSourcesQ.isLoading && cloneList.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.mon.empty')}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
