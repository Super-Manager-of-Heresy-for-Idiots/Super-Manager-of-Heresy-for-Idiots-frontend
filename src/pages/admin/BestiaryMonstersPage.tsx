import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, SlidersHorizontal, X, AlertTriangle } from 'lucide-react';
import { useAdminMonsters, useDeleteAdminMonster, useSetAdminMonsterActive } from '@/hooks/useBestiary';
import { SIZE_RU } from '@/components/bestiary/constants';
import type { CreatureSize, MonsterSummaryResponse } from '@/types';

const SIZE_OPTIONS: { v: CreatureSize | 'ALL'; label: string }[] = [
  { v: 'ALL', label: 'Все размеры' },
  { v: 'TINY', label: 'Крошечный' }, { v: 'SMALL', label: 'Маленький' }, { v: 'MEDIUM', label: 'Средний' },
  { v: 'LARGE', label: 'Большой' }, { v: 'HUGE', label: 'Огромный' }, { v: 'GARGANTUAN', label: 'Громадный' },
];
const CR_RANGES = [
  { v: 'ALL', label: 'Любая ПО', min: -1, max: 99 },
  { v: 'low', label: 'ПО 0–4', min: 0, max: 4 },
  { v: 'mid', label: 'ПО 5–10', min: 5, max: 10 },
  { v: 'high', label: 'ПО 11–16', min: 11, max: 16 },
  { v: 'epic', label: 'ПО 17+', min: 17, max: 99 },
];

function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled} style={{ width: 40, height: 22, flexShrink: 0, background: on ? 'linear-gradient(180deg, #6a522d, #4a3a20)' : 'var(--abyss)', border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, position: 'relative', cursor: disabled ? 'wait' : 'pointer', padding: 0, transition: 'all 180ms', opacity: disabled ? 0.6 : 1 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16, background: on ? 'var(--gold-pale)' : 'var(--ink-faint)', transition: 'all 180ms' }} />
    </button>
  );
}
function SizeBadge({ size }: { size: CreatureSize }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-quiet)' }}>
      <Diamond size={6} color="var(--bronze)" />{SIZE_RU[size]}
    </span>
  );
}
function StatusDot({ active }: { active: boolean }) {
  const c = active ? '#7a9866' : 'var(--ink-faint)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: c }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: active ? '0 0 8px #7a986688' : 'none' }} />
      {active ? 'активен' : 'выключен'}
    </span>
  );
}
function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <select className="ao-input" value={value} onChange={(e) => onChange(e.target.value as T)}
      style={{ width: 'auto', minWidth: 150, padding: '8px 30px 8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', appearance: 'none', cursor: 'pointer', backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23968c75' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
      {options.map((o) => <option key={o.v} value={o.v} style={{ background: 'var(--abyss)' }}>{o.label}</option>)}
    </select>
  );
}

export default function BestiaryMonstersPage() {
  const navigate = useNavigate();
  const { data: rows = [], isLoading, isError } = useAdminMonsters();
  const setActive = useSetAdminMonsterActive();
  const del = useDeleteAdminMonster();

  const [query, setQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<CreatureSize | 'ALL'>('ALL');
  const [crFilter, setCrFilter] = useState('ALL');
  const [confirmDel, setConfirmDel] = useState<MonsterSummaryResponse | null>(null);

  const filtered = useMemo(() => {
    const cr = CR_RANGES.find((r) => r.v === crFilter)!;
    return rows.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || m.nameRusloc.toLowerCase().includes(q) || (m.nameEngloc ?? '').toLowerCase().includes(q);
      const matchSize = sizeFilter === 'ALL' || m.size === sizeFilter;
      const matchCr = m.crValue >= cr.min && m.crValue <= cr.max;
      return matchQ && matchSize && matchCr;
    });
  }, [rows, query, sizeFilter, crFilter]);

  return (
    <div style={{ minHeight: '100%', background: 'var(--stone)' }}>
      <header style={{ minHeight: 64, borderBottom: '1px solid var(--rule)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '12px clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
          <Diamond size={9} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>Системный бестиарий</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>Администрирование · /api/admin/bestiary/monsters</div>
          </div>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('new')}><Plus size={13} /> Создать монстра</button>
      </header>

      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}><Search size={15} /></span>
            <input className="ao-input" placeholder="Поиск по имени (RU / EN)…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <Select value={sizeFilter} onChange={setSizeFilter} options={SIZE_OPTIONS} />
          <Select value={crFilter} onChange={setCrFilter} options={CR_RANGES.map((r) => ({ v: r.v, label: r.label }))} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            <SlidersHorizontal size={13} /> {filtered.length} из {rows.length}
          </span>
        </div>

        <div className="ao-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="ao-table bd-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Монстр</th>
                <th style={{ width: 130 }}>Размер</th>
                <th style={{ width: 80, textAlign: 'center' }}>ПО</th>
                <th style={{ width: 130 }}>Статус</th>
                <th style={{ width: 110, textAlign: 'center' }}>Активность</th>
                <th style={{ width: 96, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} style={{ opacity: m.isActive ? 1 : 0.6, cursor: 'pointer' }}>
                  <td onClick={() => navigate(m.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Diamond size={7} color="var(--bronze)" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink-bright)' }}>{m.nameRusloc}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>{m.nameEngloc ?? '—'} · {m.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td><SizeBadge size={m.size} /></td>
                  <td style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--gold-pale)' }}>{m.crRating}</span></td>
                  <td><StatusDot active={m.isActive} /></td>
                  <td style={{ textAlign: 'center' }}><Toggle on={m.isActive} disabled={setActive.isPending} onChange={() => setActive.mutate({ id: m.id, active: !m.isActive })} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="ao-iconbtn" title="Редактировать" onClick={() => navigate(`${m.id}/edit`)}><Pencil size={14} /></button>
                      <button className="ao-iconbtn" title="Удалить" onClick={() => setConfirmDel(m)} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{isError ? 'Не удалось загрузить бестиарий.' : 'Ничего не найдено по заданным фильтрам.'}</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>Загрузка…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(60% 50% at 50% 45%, rgba(0,0,0,0.7), rgba(0,0,0,0.88))' }}>
          <div onClick={(e) => e.stopPropagation()} className="ao-panel ao-frame ao-rise" style={{ width: 460, maxWidth: '100%', padding: 0, boxShadow: 'var(--shadow-high)' }}>
            <span className="ao-frame-c" />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 24px', borderBottom: '1px solid var(--rule)' }}>
              <AlertTriangle size={20} style={{ color: '#d8896a', marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>Удалить монстра?</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>Действие необратимо</div>
              </div>
              <button className="ao-iconbtn" onClick={() => setConfirmDel(null)} title="Закрыть"><X size={14} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                Монстр <span style={{ color: 'var(--ink-bright)' }}>«{confirmDel.nameRusloc}»</span> будет удалён из системного бестиария.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button className="ao-btn ao-btn--ghost" onClick={() => setConfirmDel(null)}>Отмена</button>
                <button className="ao-btn ao-btn--danger" disabled={del.isPending} onClick={() => del.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) })}><Trash2 size={13} /> Удалить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 600px) { .bd-table thead { display: none; } }`}</style>
    </div>
  );
}
