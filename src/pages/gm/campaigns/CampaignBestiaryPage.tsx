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
import { SIZE_RU } from '@/components/bestiary/constants';
import type { CreatureSize, MonsterSummaryResponse } from '@/types';

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function SizeBadge({ size }: { size: CreatureSize }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-quiet)' }}><Diamond size={6} color="var(--bronze)" />{SIZE_RU[size]}</span>;
}

export default function CampaignBestiaryPage() {
  const navigate = useNavigate();
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
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>Монстры кампании</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{isGM ? 'Вид мастера' : 'Вид игрока'} · доступно {isGM ? monsters.length : visible.length}</div>
          </div>
        </div>
        {isGM && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ao-btn ao-btn--ghost" onClick={() => { setCloneFilter(''); setCloneOpen(true); }}><Copy size={13} /> Клонировать</button>
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('monsters/new')}><Plus size={13} /> Создать монстра</button>
          </div>
        )}
      </header>

      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="ao-table" style={{ minWidth: isGM ? 760 : 520 }}>
            <thead>
              <tr>
                <th>Монстр</th>
                <th style={{ width: 80, textAlign: 'center' }}>ПО</th>
                <th style={{ width: 130 }}>Размер</th>
                <th style={{ width: 130, textAlign: 'center' }}>Видимость</th>
                {isGM && <th style={{ width: 160, textAlign: 'right' }}>Действия</th>}
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{m.nameEngloc ?? '—'}{m.sourceMonsterId ? ' · клон' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--gold-pale)' }}>{m.crRating}</span></td>
                  <td><SizeBadge size={m.size} /></td>
                  <td style={{ textAlign: 'center' }}>
                    {m.isVisibleToPlayers
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--gold-pale)', fontFamily: 'var(--font-mono)', fontSize: 11 }}><Eye size={14} /> открыт</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: 11 }}><EyeOff size={14} /> скрыт</span>}
                  </td>
                  {isGM && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="ao-iconbtn" disabled={toggleVis.isPending} title={m.isVisibleToPlayers ? 'Скрыть от игроков' : 'Показать игрокам'} onClick={() => toggleVis.mutate(m.id)} style={{ color: m.isVisibleToPlayers ? 'var(--gold-pale)' : 'var(--ink-faint)', borderColor: m.isVisibleToPlayers ? 'var(--brass)' : 'var(--rule)' }}>
                          {m.isVisibleToPlayers ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button className="ao-iconbtn" title="Редактировать" onClick={() => navigate(`monsters/${m.id}/edit`)}><Pencil size={14} /></button>
                        <button className="ao-iconbtn" title="Удалить" onClick={() => setConfirmDel(m)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!monstersQ.isLoading && monsters.length === 0 && (
                <tr><td colSpan={isGM ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{isGM ? 'В кампании пока нет монстров.' : 'Мастер ещё не открыл ни одного существа.'}</td></tr>
              )}
              {monstersQ.isLoading && <tr><td colSpan={isGM ? 5 : 4} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>Загрузка…</td></tr>}
            </tbody>
          </table>
        </div>

        {!isGM && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOff size={13} /> Скрытые монстры для игрока неотличимы от отсутствующих (сервер отдаёт 404).
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
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>Клонировать монстра</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>Выберите источник · клон создаётся скрытым</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setCloneOpen(false)} title="Закрыть"><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={14} /></span>
                <input className="ao-input" placeholder="Поиск системного монстра…" value={cloneFilter} onChange={(e) => setCloneFilter(e.target.value)} style={{ paddingLeft: 34 }} autoFocus />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }} className="ao-scroll">
                {cloneSourcesQ.isLoading && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>Загрузка…</div>}
                {cloneList.map((s) => (
                  <button key={s.id} className="ao-panel--inset" disabled={clone.isPending} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--rule)' }} onClick={() => clone.mutate(s.id, { onSuccess: () => setCloneOpen(false) })}>
                    <Diamond size={7} color="var(--bronze)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink-bright)' }}>{s.nameRusloc}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>ПО {s.crRating}</div>
                    </div>
                    <span className="ao-chip ao-chip--gold">система</span>
                  </button>
                ))}
                {!cloneSourcesQ.isLoading && cloneList.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>Ничего не найдено.</div>}
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
              <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>Удалить монстра?</div>
              <button className="ao-iconbtn" onClick={() => setConfirmDel(null)} title="Закрыть"><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>Монстр <span style={{ color: 'var(--ink-bright)' }}>«{confirmDel.nameRusloc}»</span> будет удалён из кампании.</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>Отмена</button>
                <button className="ao-btn ao-btn--danger" disabled={del.isPending} onClick={() => del.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> Удалить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
