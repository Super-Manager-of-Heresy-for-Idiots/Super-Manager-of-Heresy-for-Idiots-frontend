/* global React, Rune, Panel, PanelHeader, Chip, Divider, EmptyVault, RarityBadge, rarityHue */
// ─────────────────────────────────────────────────────────────
// ORDO ARCANUM · Лагерь — секции экрана
// Шапка, карточка участника, панель дозора, склад,
// активности, журнал событий. Переиспользуются всеми состояниями.
// ─────────────────────────────────────────────────────────────

const {
  CAMP_STATUS, CAMP_TRANSITIONS, CampStatusBadge, StatusTimeline,
  SAFETY, SafetyBadge, GMHint, LiveDot, Sk, CampPortrait, MiniBar,
  REST_STATE, RestStateTag, WATCH_SLOTS, CAMP_ACTIVITIES, STORAGE_ITEMS, EVENT_TYPES,
} = window;

const { useState: pUseState } = React;

// ═══ Шапка лагеря ════════════════════════════════════════════
function CampHeader({ camp, view = 'gm', onStatus, onRollEncounter, right }) {
  const st = camp.status;
  const trans = CAMP_TRANSITIONS[st] || [];
  const safety = SAFETY[camp.safety];
  return (
    <div className="ao-panel" style={{ padding: 0, borderTop: `2px solid ${CAMP_STATUS[st].c}66` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: '18px 22px 16px' }}>
        {/* название + локация */}
        <div style={{ minWidth: 300, flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Rune kind="flame" size={15} color="var(--gold)" />
            <span className="ao-overline" style={{ fontSize: 10 }}>Привал · день {camp.day}</span>
          </div>
          <div className="ao-h4" style={{ fontSize: 25, lineHeight: 1.15 }}>{camp.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-quiet)' }}>
              <Rune kind="diamond" size={9} color="var(--bronze-warm)" />{camp.location}
            </span>
            <SafetyBadge level={camp.safety} />
          </div>
        </div>
        {/* таймлайн */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
          <StatusTimeline status={st} visited={camp.visited} />
        </div>
        {/* статус + управление */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {right}
            <CampStatusBadge status={st} size="lg" pulse={st === 'RESTING' || st === 'INTERRUPTED'} />
          </div>
          {view === 'gm' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {trans.length === 0
                ? <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>привал закрыт — переходов нет</span>
                : trans.map(([to, label, kind]) => (
                  <button key={to} className={`ao-btn ao-btn--${kind}`} onClick={() => onStatus && onStatus(to)}>
                    {label}
                  </button>
                ))}
            </div>
          ) : (
            <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>управлением привалом распоряжается Мастер</span>
          )}
        </div>
      </div>
      {/* подсказка ГМ по опасности */}
      {view === 'gm' && safety.hint && (
        <div style={{ padding: '0 22px 18px' }}>
          <GMHint tone={camp.safety === 'DANGEROUS' ? 'ember' : 'gold'} glyph={safety.glyph}
            action={<button className="ao-btn ao-btn--sm" onClick={onRollEncounter}><Rune kind="hex" size={11} />Бросить встречу</button>}>
            {safety.hint}
          </GMHint>
        </div>
      )}
    </div>
  );
}

// ═══ Карточка участника ══════════════════════════════════════
function MemberCard({ m, view = 'gm', onWatch, onActivity, onRoll, restState, progress, error, dense = false }) {
  const rs = restState || m.rest;
  const onWatchSlot = m.watch != null;
  return (
    <div className="cp-card" style={{
      position: 'relative', display: 'flex', gap: 14, padding: dense ? '12px 14px' : '14px 16px',
      background: error ? 'linear-gradient(180deg, rgba(179,70,26,0.08), var(--panel))' : 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
      border: `1px solid ${error ? 'rgba(179,70,26,0.55)' : rs === 'RESTED' ? 'rgba(122,152,102,0.4)' : 'var(--rule)'}`,
      boxShadow: 'var(--shadow-inset)',
    }}>
      <CampPortrait size={dense ? 42 : 50} glyph={m.glyph} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* имя + класс */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="ao-h6" style={{ fontSize: 15 }}>{m.name}</span>
          <span className="ao-codex" style={{ fontSize: 11 }}>{m.cls}</span>
          <span style={{ flex: 1 }} />
          <RestStateTag state={onWatchSlot && rs === 'NOT_RESTED' ? 'ON_WATCH' : rs} />
        </div>
        {/* ресурсы */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 9, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ao-overline" style={{ fontSize: 9 }}>хиты</span>
            <span className="ao-num" style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{m.hp[0]}<span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>/{m.hp[1]}</span></span>
            <MiniBar cur={m.hp[0]} max={m.hp[1]} />
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ao-overline" style={{ fontSize: 9 }}>кости хитов</span>
            <span className="ao-num" style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{m.hd[0]}<span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>/{m.hd[1]}</span></span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ao-overline" style={{ fontSize: 9 }}>{m.res.label}</span>
            <span className="ao-num" style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{m.res.cur}<span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>/{m.res.max}</span></span>
            <MiniBar cur={m.res.cur} max={m.res.max} tone={m.res.tone} w={52} />
          </span>
        </div>
        {/* прогресс отдыха */}
        {progress != null && (
          <div style={{ marginTop: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="ao-overline" style={{ fontSize: 9, color: error ? '#d8896a' : 'var(--ink-quiet)' }}>
                {error ? 'транзакция отклонена' : progress >= 100 ? 'отдых применён' : 'применение отдыха'}
              </span>
              <span className="ao-codex" style={{ fontSize: 10 }}>{error ? 'ошибка' : `${progress}%`}</span>
            </div>
            <div className="ao-bar" style={{ height: 5 }}>
              <div style={{ width: `${error ? 100 : progress}%`, height: '100%', transition: 'width 600ms ease-out',
                background: error ? 'repeating-linear-gradient(45deg, #7d2f10 0 4px, #b3461a 4px 8px)' : progress >= 100 ? 'linear-gradient(90deg, #3d5a44, #7a9866)' : 'linear-gradient(90deg, var(--arcane-deep), var(--arcane))' }} />
            </div>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(179,70,26,0.4)' }}>
            <span className="ao-codex" style={{ fontSize: 10, color: '#d8896a' }}>{error.code}</span>
            <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 3 }}>{error.msg}</div>
          </div>
        )}
        {/* дозор + активность */}
        <div style={{ display: 'flex', gap: 10, marginTop: 11, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 9px', background: 'rgba(0,0,0,0.35)', border: `1px solid ${onWatchSlot ? 'rgba(176,141,78,0.45)' : 'var(--hairline)'}` }}>
            <Rune kind="eye" size={11} color={onWatchSlot ? 'var(--gold-pale)' : 'var(--ink-ghost)'} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: onWatchSlot ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>
              {onWatchSlot ? `дозор ${m.watch} · ${WATCH_SLOTS[m.watch - 1].time}` : 'без дозора'}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 9px', background: 'rgba(0,0,0,0.35)', border: `1px solid ${m.act ? 'rgba(90,142,148,0.4)' : 'var(--hairline)'}` }}>
            <Rune kind="book" size={11} color={m.act ? 'var(--arcane)' : 'var(--ink-ghost)'} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: m.act ? 'var(--arcane)' : 'var(--ink-faint)' }}>
              {m.act || 'нет активности'}
            </span>
          </span>
        </div>
        {m.note && (
          <div className="ao-italic" style={{ fontSize: 12.5, marginTop: 8, color: 'var(--ink-quiet)', textWrap: 'pretty', borderLeft: '1px solid var(--rule)', paddingLeft: 10 }}>
            {m.note}
          </div>
        )}
      </div>
      {/* быстрые действия ГМ */}
      {view === 'gm' && (
        <div className="cp-quick" style={{ position: 'absolute', right: 10, top: -13, display: 'flex', gap: 4, background: 'var(--abyss)', border: '1px solid var(--brass)', padding: 3, boxShadow: 'var(--shadow-mid)', zIndex: 4 }}>
          <button className="ao-iconbtn" title="Назначить дозор" onClick={onWatch} style={{ width: 28, height: 26, borderColor: 'transparent' }}><Rune kind="eye" size={13} /></button>
          <button className="ao-iconbtn" title="Назначить активность" onClick={onActivity} style={{ width: 28, height: 26, borderColor: 'transparent' }}><Rune kind="book" size={13} /></button>
          <button className="ao-iconbtn" title="Бросок Внимательности дозорному" onClick={onRoll} disabled={!onWatchSlot} style={{ width: 28, height: 26, borderColor: 'transparent', opacity: onWatchSlot ? 1 : 0.35 }}><Rune kind="hex" size={13} /></button>
        </div>
      )}
    </div>
  );
}

// ═══ Панель дозора ═══════════════════════════════════════════
function WatchPanel({ members, view = 'gm', onRoll, rolls = {} }) {
  const [drag, setDrag] = pUseState(null);
  const [slots, setSlots] = pUseState(() => {
    const s = {};
    WATCH_SLOTS.forEach((w) => { s[w.n] = members.find((m) => m.watch === w.n)?.id || null; });
    return s;
  });
  const byId = (id) => members.find((m) => m.id === id);
  const unassigned = members.filter((m) => !Object.values(slots).includes(m.id));

  const drop = (n) => {
    if (!drag) return;
    setSlots((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (next[k] === drag) next[k] = null; });
      next[n] = drag;
      return next;
    });
    setDrag(null);
  };

  return (
    <Panel padding={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader title="Порядок дозора" sub="4 слота · ночь" glyph="eye"
        right={<span className="ao-codex" style={{ fontSize: 10 }}>{Object.values(slots).filter(Boolean).length}/4</span>} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {WATCH_SLOTS.map((w) => {
          const m = byId(slots[w.n]);
          const roll = rolls[w.n];
          return (
            <div key={w.n} onDragOver={(e) => { e.preventDefault(); }} onDrop={() => drop(w.n)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px',
                background: m ? 'linear-gradient(90deg, rgba(176,141,78,0.07), var(--panel))' : 'var(--abyss)',
                border: `1px ${m ? 'solid' : 'dashed'} ${drag && !m ? 'var(--brass)' : m ? 'var(--rule)' : 'var(--rule)'}`,
                minHeight: 56, transition: 'all 150ms',
              }}>
              <div style={{ width: 26, textAlign: 'center', flexShrink: 0 }}>
                <div className="ao-num" style={{ fontSize: 17, color: m ? 'var(--gold-pale)' : 'var(--ink-ghost)' }}>{w.n}</div>
              </div>
              {m ? (
                <>
                  <div draggable={view === 'gm'} onDragStart={() => setDrag(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: view === 'gm' ? 'grab' : 'default' }}>
                    <CampPortrait size={32} glyph={m.glyph} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--ink-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                      <div className="ao-codex" style={{ fontSize: 10 }}>{w.time}</div>
                    </div>
                  </div>
                  {roll && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', border: `1px solid ${roll.ok ? 'rgba(122,152,102,0.5)' : 'rgba(179,70,26,0.5)'}`, background: 'rgba(0,0,0,0.4)' }}>
                      <Rune kind={roll.ok ? 'check' : 'x'} size={10} color={roll.ok ? '#7a9866' : '#d8896a'} />
                      <span className="ao-num" style={{ fontSize: 12, color: roll.ok ? '#7a9866' : '#d8896a' }}>{roll.val}</span>
                    </span>
                  )}
                  {view === 'gm' && (
                    <button className="ao-btn ao-btn--sm" title="Создать ROLL_PROMPT: Внимательность" onClick={() => onRoll && onRoll(w.n, m)}>
                      <Rune kind="hex" size={11} />Внимательность
                    </button>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>слот пуст · {w.time}</span>
                  {view === 'gm' && <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-ghost)' }}>перетащите сюда</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {view === 'gm' && (
        <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid var(--rule)' }}>
          <div className="ao-overline" style={{ fontSize: 9, marginBottom: 8 }}>Не в дозоре — перетащите в слот</div>
          {unassigned.length === 0
            ? <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>все участники расставлены</span>
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unassigned.map((m) => (
                  <span key={m.id} draggable onDragStart={() => setDrag(m.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: 'var(--abyss)', border: `1px solid ${drag === m.id ? 'var(--brass)' : 'var(--rule)'}`, cursor: 'grab', minHeight: 30 }}>
                    <Rune kind={m.glyph} size={11} color="var(--ink-quiet)" />
                    <span style={{ fontSize: 12, color: 'var(--ink)' }}>{m.name}</span>
                  </span>
                ))}
              </div>
            )}
        </div>
      )}
    </Panel>
  );
}

// ═══ Общий склад ═════════════════════════════════════════════
function SharedStoragePanel({ view = 'gm', compact = false }) {
  const [items, setItems] = pUseState(STORAGE_ITEMS);
  const [who, setWho] = pUseState('c1');
  const [sel, setSel] = pUseState(null);
  const members = window.CAMP_MEMBERS;
  const total = items.reduce((a, i) => a + i.qty * i.w, 0);

  const take = (id) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i)).filter((i) => i.qty > 0));

  return (
    <Panel padding={0}>
      <PanelHeader title="Общий склад лагеря" sub="переиспользуемый компонент SharedStorage" glyph="square-rot"
        right={<span className="ao-codex" style={{ fontSize: 10 }}>{items.length} поз. · {total.toFixed(1)} фнт</span>} />
      <div style={{ display: 'flex', gap: 0, minHeight: 240 }}>
        {/* список склада */}
        <div style={{ flex: 1.4, padding: 14, borderRight: '1px solid var(--rule)' }}>
          <div className="ao-overline" style={{ fontSize: 9, marginBottom: 10 }}>На складе</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((it) => (
              <div key={it.id} className="cp-row" onClick={() => setSel(it.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', background: sel === it.id ? 'rgba(176,141,78,0.08)' : 'transparent', border: `1px solid ${sel === it.id ? 'var(--brass)' : 'var(--hairline)'}`, cursor: 'pointer' }}>
                <span className="ao-slot" style={{ width: 30, height: 30, aspectRatio: 'auto', flexShrink: 0 }}>
                  <Rune kind={it.glyph} size={14} color={window.rarityHue ? window.rarityHue(it.rarity) : 'var(--ink-quiet)'} />
                </span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-bright)' }}>{it.name}</span>
                <span className="ao-num" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>×{it.qty}</span>
                {view === 'gm' || true ? (
                  <button className="ao-btn ao-btn--sm cp-quickrow" onClick={(e) => { e.stopPropagation(); take(it.id); }} title="Взять себе">
                    <Rune kind="arrow-r" size={11} />взять
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {/* перенос */}
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ao-overline" style={{ fontSize: 9 }}>Перенос: персонаж ↔ склад</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select className="ao-input" value={who} onChange={(e) => setWho(e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="ao-panel--inset" style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="ao-overline" style={{ fontSize: 9, marginBottom: 2 }}>Инвентарь персонажа</div>
            {['Длинный меч +1', 'Зелье лечения ×1', 'Отмычки', 'Дневник культиста'].map((n) => (
              <div key={n} className="cp-row" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', border: '1px solid var(--hairline)' }}>
                <Rune kind="diamond" size={10} color="var(--bronze-warm)" />
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>{n}</span>
                <button className="ao-iconbtn cp-quickrow" title="Положить на склад" style={{ width: 26, height: 24 }}><Rune kind="arrow-l" size={11} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ao-btn ao-btn--sm" style={{ flex: 1 }}><Rune kind="arrow-l" size={11} />На склад</button>
            <button className="ao-btn ao-btn--sm ao-btn--primary" style={{ flex: 1 }}><Rune kind="arrow-r" size={11} />Себе</button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ═══ Даунтайм-активности ═════════════════════════════════════
function ActivitiesPanel({ view = 'gm', members }) {
  const [sel, setSel] = pUseState('a1');
  const [target, setTarget] = pUseState(members[0].id);
  const [note, setNote] = pUseState('');
  const [tab, setTab] = pUseState('ALL');
  const list = CAMP_ACTIVITIES.filter((a) => tab === 'ALL' || a.kind === tab);
  return (
    <Panel padding={0}>
      <PanelHeader title="Даунтайм-активности" sub="справочник кампании" glyph="book"
        right={view === 'gm' ? <button className="ao-btn ao-btn--sm"><Rune kind="plus-sm" size={11} />Своя</button> : null} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['ALL', 'Все'], ['SYSTEM', 'Системные'], ['CUSTOM', 'Кастомные ГМ']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '5px 11px', background: tab === k ? 'rgba(176,141,78,0.1)' : 'transparent',
              border: `1px solid ${tab === k ? 'var(--brass)' : 'var(--rule)'}`, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: tab === k ? 'var(--gold-pale)' : 'var(--ink-faint)',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
          {list.map((a) => (
            <button key={a.id} onClick={() => setSel(a.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', textAlign: 'left',
              background: sel === a.id ? 'linear-gradient(180deg, rgba(176,141,78,0.12), transparent)' : 'var(--abyss)',
              border: `1px solid ${sel === a.id ? 'var(--brass)' : 'var(--hairline)'}`, cursor: 'pointer', minHeight: 44,
            }}>
              <Rune kind={a.glyph} size={13} color={sel === a.id ? 'var(--gold-pale)' : 'var(--ink-quiet)'} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-bright)' }}>{a.name}</span>
                {a.kind === 'CUSTOM' && <span className="ao-codex" style={{ fontSize: 9 }}>кастом ГМ</span>}
              </span>
            </button>
          ))}
        </div>
        {view === 'gm' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Divider />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="ao-label">Кому назначить</label>
                <select className="ao-input" value={target} onChange={(e) => setTarget(e.target.value)} style={{ padding: '8px 10px', fontSize: 13 }}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1.4 }}>
                <label className="ao-label">Заметка к активности</label>
                <input className="ao-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="что именно делает персонаж" style={{ padding: '8px 10px', fontSize: 13 }} />
              </div>
            </div>
            <GMHint tone="arcane" glyph="scroll">
              Механических автоэффектов нет: награды — предметы, опыт, эффекты — выдавайте вручную обычными инструментами (инвентарь, XP, состояния).
            </GMHint>
            <button className="ao-btn ao-btn--primary ao-btn--block"><Rune kind="check" size={12} />Назначить активность</button>
          </div>
        ) : (
          <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-faint)', paddingTop: 4 }}>
            Активность вам назначает Мастер. Ваша текущая — «{members[0].act || '—'}».
          </div>
        )}
      </div>
    </Panel>
  );
}

// ═══ Журнал событий ══════════════════════════════════════════
function EventLog({ events, view = 'gm', onAdd, onGoCombat, empty = false, height }) {
  return (
    <Panel padding={0} style={{ display: 'flex', flexDirection: 'column', height: height || '100%' }}>
      <PanelHeader title="Журнал привала" sub={`${events.length} событий`} glyph="scroll"
        right={view === 'gm' ? <button className="ao-btn ao-btn--sm" onClick={onAdd}><Rune kind="plus-sm" size={11} />Событие</button> : null} />
      {empty || events.length === 0 ? (
        <EmptyVault glyph="scroll" overline="Журнал" title="Пока тихо"
          body="Ночь идёт без происшествий. События появятся здесь, когда ГМ добавит их или сработает бросок."
          action={view === 'gm' ? <button className="ao-btn ao-btn--sm"><Rune kind="plus-sm" size={11} />Добавить первое</button> : null} />
      ) : (
        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {events.map((e) => {
            const t = EVENT_TYPES[e.type];
            return (
              <div key={e.id} className="cp-log" style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--hairline)' }}>
                <span style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.c}66`, background: 'rgba(0,0,0,0.4)' }}>
                  <Rune kind={t.glyph} size={13} color={t.c} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.c }}>{t.ru}</span>
                    <span className="ao-codex" style={{ fontSize: 10 }}>{e.t}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 4, textWrap: 'pretty' }}>{e.text}</div>
                  {e.combat && (
                    <button className="ao-btn ao-btn--sm ao-btn--danger" style={{ marginTop: 9 }} onClick={onGoCombat}>
                      <Rune kind="sword" size={11} />Перейти к бою
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

Object.assign(window, { CampHeader, MemberCard, WatchPanel, SharedStoragePanel, ActivitiesPanel, EventLog });
