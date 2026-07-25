/* global React, Rune, Panel, PanelHeader, Chip, Divider, Backdrop, TopBar, ModalScene, Field,
   CAMP_MEMBERS, WATCH_SLOTS, SAFETY, SafetyBadge, SafetySegment, GMHint, CampPortrait, CampStatusBadge, StatusTimeline */
// ─────────────────────────────────────────────────────────────
// СОЗДАНИЕ ЛАГЕРЯ (SETTING_UP) + метка безопасности локации
// ─────────────────────────────────────────────────────────────

const { useState: sUseState } = React;

const LOCATIONS = [
  { id: 'l1', name: 'Серая ложбина', region: 'Предгорья Керена', safety: 'RISKY', glyph: 'tri' },
  { id: 'l2', name: 'Постоялый двор «Рыжий бык»', region: 'Тракт на Морнхейм', safety: 'SAFE', glyph: 'book' },
  { id: 'l3', name: 'Пепельные шахты, ярус 2', region: 'Керен', safety: 'DANGEROUS', glyph: 'lock' },
  { id: 'l4', name: 'Роща Тихого камня', region: 'Западный лес', safety: 'SAFE', glyph: 'diamond' },
  { id: 'l5', name: 'Разрушенный форт Вейл', region: 'Пустоши', safety: 'DANGEROUS', glyph: 'shield' },
];

// ═══ Модал старта привала ════════════════════════════════════
function CampSetupModal() {
  const [loc, setLoc] = sUseState('l1');
  const [members, setMembers] = sUseState(CAMP_MEMBERS.map((m) => m.id));
  const [watch, setWatch] = sUseState({ 1: 'c1', 2: 'c3', 3: 'c2', 4: null });
  const location = LOCATIONS.find((l) => l.id === loc);
  const chosen = CAMP_MEMBERS.filter((m) => members.includes(m.id));
  const toggle = (id) => setMembers((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <ModalScene codexId="CAMP-НОВЫЙ" overline="Привал" title="Разбить лагерь"
      sub="Локация, состав и первая расстановка дозора. Статус привала — SETTING_UP до начала."
      width={880} rune="sigil-1"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
          <CampStatusBadge status="SETTING_UP" />
          <Rune kind="arrow-r" size={13} color="var(--ink-faint)" />
          <CampStatusBadge status="ACTIVE" />
          <span style={{ flex: 1 }} />
          <button className="ao-btn ao-btn--ghost">Отмена</button>
          <button className="ao-btn ao-btn--primary ao-btn--lg" disabled={chosen.length === 0} style={{ opacity: chosen.length ? 1 : 0.4 }}>
            <Rune kind="flame" size={13} />Начать привал
          </button>
        </div>
      }>
      <div style={{ display: 'flex', gap: 20 }}>
        {/* локация */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="ao-label">Локация привала</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {LOCATIONS.map((l) => (
              <button key={l.id} onClick={() => setLoc(l.id)} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', textAlign: 'left', minHeight: 46,
                background: loc === l.id ? 'linear-gradient(90deg, rgba(176,141,78,0.12), transparent)' : 'var(--abyss)',
                border: `1px solid ${loc === l.id ? 'var(--brass)' : 'var(--hairline)'}`, cursor: 'pointer',
              }}>
                <Rune kind={l.glyph} size={13} color={loc === l.id ? 'var(--gold-pale)' : 'var(--ink-quiet)'} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-bright)' }}>{l.name}</span>
                  <span className="ao-codex" style={{ fontSize: 10 }}>{l.region}</span>
                </span>
                <SafetyBadge level={l.safety} />
              </button>
            ))}
          </div>
          {SAFETY[location.safety].hint && (
            <GMHint tone={location.safety === 'DANGEROUS' ? 'ember' : 'gold'} glyph={SAFETY[location.safety].glyph}>
              {SAFETY[location.safety].hint}
            </GMHint>
          )}
        </div>

        {/* состав + дозор */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="ao-label">Состав участников · {chosen.length} из {CAMP_MEMBERS.length}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {CAMP_MEMBERS.map((m) => {
                const on = members.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggle(m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '7px 10px', textAlign: 'left', minHeight: 44,
                    background: on ? 'rgba(176,141,78,0.07)' : 'var(--abyss)',
                    border: `1px solid ${on ? 'rgba(176,141,78,0.45)' : 'var(--hairline)'}`, cursor: 'pointer',
                  }}>
                    <span style={{ width: 15, height: 15, flexShrink: 0, border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'rgba(176,141,78,0.18)' : 'transparent' }}>
                      {on && <Rune kind="check" size={10} color="var(--gold-pale)" />}
                    </span>
                    <CampPortrait size={28} glyph={m.glyph} dim={!on} />
                    <span style={{ flex: 1, fontSize: 13, color: on ? 'var(--ink-bright)' : 'var(--ink-faint)' }}>{m.name}</span>
                    <span className="ao-codex" style={{ fontSize: 10 }}>{m.cls}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="ao-label">Первичная расстановка дозора</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WATCH_SLOTS.map((w) => (
                <div key={w.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ao-num" style={{ width: 18, fontSize: 14, color: watch[w.n] ? 'var(--gold-pale)' : 'var(--ink-ghost)' }}>{w.n}</span>
                  <span className="ao-codex" style={{ fontSize: 10, width: 100, flexShrink: 0 }}>{w.time}</span>
                  <select className="ao-input" value={watch[w.n] || ''} onChange={(e) => setWatch((p) => ({ ...p, [w.n]: e.target.value || null }))}
                    style={{ padding: '7px 10px', fontSize: 13, minHeight: 36 }}>
                    <option value="">— слот пуст —</option>
                    {chosen.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8 }}>
              Дозор можно переставить в любой момент — уже в лагере, перетаскиванием.
            </div>
          </div>
        </div>
      </div>
    </ModalScene>
  );
}

// ═══ SETTING_UP как экран (лагерь создан, ещё не начат) ══════
function SettingUpScreen() {
  const { CampHeader, MemberCard, WatchPanel, EventLog } = window;
  const camp = { name: 'Привал у Серой ложбины', location: 'Серая ложбина · Предгорья Керена', day: 12, safety: 'RISKY', status: 'SETTING_UP', visited: ['SETTING_UP'] };
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь" breadcrumb="Кампания «Пепел Керена» · разбивка лагеря" right={<Chip tone="gold" glyph="helm">Мастер Игры</Chip>} />
        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CampHeader camp={camp} view="gm" />
          <GMHint glyph="square-rot">Лагерь ещё разбивают: дозор и активности назначаются, но отдых недоступен до перехода в ACTIVE.</GMHint>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '1.4 1 0', minWidth: 0 }}>
              <Panel padding={0}>
                <PanelHeader title="Участники привала" sub="состав задан при создании" glyph="helm" />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {CAMP_MEMBERS.slice(0, 3).map((m) => <MemberCard key={m.id} m={{ ...m, act: null, note: '' }} view="gm" />)}
                </div>
              </Panel>
            </div>
            <div style={{ flex: '1 1 0', minWidth: 360 }}><WatchPanel members={CAMP_MEMBERS} view="gm" /></div>
            <div style={{ flex: '1 1 0', minWidth: 320, alignSelf: 'stretch' }}><EventLog events={[]} view="gm" empty height="100%" /></div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

// ═══ Метка безопасности в LocationsPage ══════════════════════
function LocationsSafetyScreen() {
  const [data, setData] = sUseState(LOCATIONS);
  const [open, setOpen] = sUseState('l1');
  const set = (id, safety) => setData((p) => p.map((l) => (l.id === id ? { ...l, safety } : l)));
  const cur = data.find((l) => l.id === open);
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Локации" breadcrumb="Кампания «Пепел Керена» · справочник локаций" right={<Chip tone="gold" glyph="helm">Мастер Игры</Chip>} />
        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* список карточек */}
          <div style={{ flex: 1.5, minWidth: 0 }}>
            <Panel padding={0}>
              <PanelHeader title="Локации кампании" sub="новое поле: rest_safety" glyph="diamond-fill"
                right={<span className="ao-codex" style={{ fontSize: 10 }}>{data.length}</span>} />
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                {data.map((l) => (
                  <div key={l.id} className="cp-card" onClick={() => setOpen(l.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 15px', cursor: 'pointer',
                    background: open === l.id ? 'linear-gradient(90deg, rgba(176,141,78,0.08), var(--panel))' : 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
                    border: `1px solid ${open === l.id ? 'var(--brass)' : 'var(--rule)'}`, boxShadow: 'var(--shadow-inset)',
                  }}>
                    <span className="ao-slot" style={{ width: 40, height: 40, aspectRatio: 'auto', flexShrink: 0 }}>
                      <Rune kind={l.glyph} size={17} color="var(--bronze-warm)" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ao-h6" style={{ fontSize: 15 }}>{l.name}</div>
                      <div className="ao-codex" style={{ fontSize: 10, marginTop: 2 }}>{l.region}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className="ao-overline" style={{ fontSize: 8.5 }}>безопасность привала</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <SafetySegment value={l.safety} onChange={(v) => set(l.id, v)} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          {/* редактор локации */}
          <div style={{ flex: 1, minWidth: 380 }}>
            <Panel padding={0}>
              <PanelHeader title="Редактор локации" sub={cur.name} glyph="scroll" />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Название"><input className="ao-input" defaultValue={cur.name} key={cur.id + 'n'} /></Field>
                <Field label="Регион"><input className="ao-input" defaultValue={cur.region} key={cur.id + 'r'} /></Field>
                <Field label="Безопасность привала · rest_safety" hint="Влияет на подсказки ГМ в лагере: на RISKY/DANGEROUS появляется предложение бросить встречу или засаду.">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
                    <SafetySegment value={cur.safety} onChange={(v) => set(cur.id, v)} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.keys(SAFETY).map((k) => (
                        <div key={k} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', opacity: cur.safety === k ? 1 : 0.45 }}>
                          <Rune kind={SAFETY[k].glyph} size={11} color={SAFETY[k].c} />
                          <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
                            <b style={{ color: SAFETY[k].c, fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>{k}</b> — {k === 'SAFE' ? 'привал проходит спокойно, подсказок нет.' : SAFETY[k].hint}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Field>
                <Divider />
                <GMHint glyph="diamond">Это не отдельная сущность, а поле локации. Метка подхватывается экраном лагеря при создании привала.</GMHint>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ao-btn ao-btn--primary" style={{ flex: 1 }}><Rune kind="check" size={12} />Сохранить</button>
                  <button className="ao-btn ao-btn--ghost">Отмена</button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

Object.assign(window, { CampSetupModal, SettingUpScreen, LocationsSafetyScreen, LOCATIONS });
