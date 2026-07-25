/* global React, Rune, Panel, PanelHeader, Chip, Divider, Sigil, Backdrop, TopBar, EmptyVault,
   CampHeader, MemberCard, WatchPanel, SharedStoragePanel, ActivitiesPanel, EventLog,
   CAMP_MEMBERS, CAMP_EVENTS, AMBUSH_EVENT, GMHint, LiveDot, Sk, CampStatusBadge, SafetyBadge, CampPortrait */
// ─────────────────────────────────────────────────────────────
// ЭКРАН ЛАГЕРЯ — флагман. Состояние ACTIVE, вид ГМ и вид игрока.
// Интерактив: переходы статусов, дозор drag-and-drop, бросок
// Внимательности → запись в журнал, добавление события.
// ─────────────────────────────────────────────────────────────

const { useState: mUseState, useRef: mUseRef } = React;

const CAMP_BASE = {
  name: 'Привал у Серой ложбины',
  location: 'Серая ложбина · Предгорья Керена',
  day: 12,
  safety: 'RISKY',
  status: 'ACTIVE',
  visited: ['SETTING_UP', 'ACTIVE'],
};

function CampScreen({ view = 'gm', initialStatus = 'ACTIVE', safety = 'RISKY' }) {
  const [status, setStatus] = mUseState(initialStatus);
  const [events, setEvents] = mUseState(CAMP_EVENTS);
  const [rolls, setRolls] = mUseState({});
  const [flash, setFlash] = mUseState(null);
  const camp = { ...CAMP_BASE, status, safety };
  const members = CAMP_MEMBERS;

  const pushEvent = (e) => setEvents((prev) => [...prev, e]);

  const roll = (slot, m) => {
    const val = 2 + Math.floor(Math.random() * 19) + 3;
    const ok = val >= 15;
    setRolls((p) => ({ ...p, [slot]: { val, ok } }));
    setFlash(`ROLL_PROMPT отправлен: ${m.name} · Внимательность`);
    setTimeout(() => setFlash(null), 2600);
    pushEvent({
      id: 'r' + Date.now(), type: ok ? 'STORY' : 'ENCOUNTER',
      t: ['22:40', '23:15', '00:05', '02:30'][slot - 1],
      text: ok
        ? `${m.name} (дозор ${slot}) — Внимательность ${val}: заметил движение в кустах и разбудил отряд заранее.`
        : `${m.name} (дозор ${slot}) — Внимательность ${val}: провал. Что-то подобралось к лагерю незамеченным.`,
    });
  };

  const encounterRoll = () => {
    setFlash('Бросок случайной встречи: 17 — патруль культа поблизости');
    setTimeout(() => setFlash(null), 2600);
    pushEvent({ id: 'x' + Date.now(), type: 'ENCOUNTER', t: '21:50', text: 'Бросок встречи (к20 = 17): в полумиле от лагеря прошёл патруль культа. Пока не заметил огонь.' });
  };

  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь" breadcrumb="Кампания «Пепел Керена» · Привал у Серой ложбины"
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LiveDot />
            <Chip tone={view === 'gm' ? 'gold' : undefined} glyph={view === 'gm' ? 'helm' : 'shield'}>
              {view === 'gm' ? 'Мастер Игры' : 'Игрок · Кассиан'}
            </Chip>
          </div>} />

        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CampHeader camp={camp} view={view} onStatus={setStatus} onRollEncounter={encounterRoll} />

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* участники */}
              <div style={{ flex: '1.35 1 0', minWidth: 0 }}>
                <Panel padding={0}>
                  <PanelHeader title="Участники привала" sub={`${members.length} персонажа · отдых не начат`} glyph="helm"
                    right={<span className="ao-codex" style={{ fontSize: 10 }}>0/{members.length} отдохнули</span>} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {members.map((m) => (
                      <MemberCard key={m.id} m={m} view={view} onRoll={() => m.watch && roll(m.watch, m)} />
                    ))}
                  </div>
                </Panel>
              </div>

              {/* дозор */}
              <div style={{ flex: '1 1 0', minWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <WatchPanel members={members} view={view} onRoll={roll} rolls={rolls} />
                {view === 'gm' && (
                  <GMHint glyph="hex">Кнопка «Внимательность» создаёт ROLL_PROMPT дозорному — результат прилетит в журнал по вебсокету.</GMHint>
                )}
              </div>

              {/* журнал */}
              <div style={{ flex: '1 1 0', minWidth: 320, alignSelf: 'stretch' }}>
                <EventLog events={events} view={view} height={'100%'} />
              </div>
            </div>

            {/* склад + активности */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: '1.35 1 0', minWidth: 0 }}><SharedStoragePanel view={view} /></div>
              <div style={{ flex: '1 1 0', minWidth: 380 }}><ActivitiesPanel view={view} members={members} /></div>
            </div>
          </div>
        </div>

        {/* тост-подтверждение действия */}
        {flash && (
          <div className="ao-toast ao-rise" style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 30 }}>
            <Rune kind="hex" size={16} color="var(--gold-pale)" />
            <span>{flash}</span>
          </div>
        )}
      </div>
    </Backdrop>
  );
}

// ─── Вид игрока: те же данные, без управления ────────────────
function CampScreenPlayer() {
  return <CampScreen view="player" />;
}

// ─── Состояния: загрузка / пусто / ошибка ────────────────────
function CampLoading() {
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь" breadcrumb="Кампания «Пепел Керена»" right={<LiveDot label="подключение" stale />} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 2 }}>
          <div className="ao-panel" style={{ padding: '18px 22px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: 300 }}>
              <Sk w={110} h={10} /><Sk w={250} h={24} /><Sk w={190} h={12} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Sk w={'100%'} h={1} style={{ margin: '0 6px' }} />}
                  <Sk w={12} h={12} style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <Sk w={150} h={30} /><Sk w={220} h={34} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="ao-panel" style={{ flex: 1.35, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: 14, border: '1px solid var(--hairline)' }}>
                  <Sk w={50} h={50} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Sk w={'45%'} h={13} /><Sk w={'80%'} h={9} /><Sk w={'60%'} h={9} />
                  </div>
                </div>
              ))}
            </div>
            <div className="ao-panel" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3].map((i) => <Sk key={i} w={'100%'} h={54} />)}
            </div>
            <div className="ao-panel" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <Sk w={28} h={28} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><Sk w={'40%'} h={9} /><Sk w={'95%'} h={10} /><Sk w={'70%'} h={10} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', paddingTop: 6 }}>
            <span className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-faint)' }}>получаем состояние привала…</span>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function CampEmpty({ kind = 'no-camp' }) {
  const conf = {
    'no-camp': {
      glyph: 'flame', overline: 'Лагеря нет', title: 'Отряд в пути',
      body: 'Сейчас привал не разбит. Мастер может начать привал, выбрав локацию, состав и первый дозор.',
      action: <button className="ao-btn ao-btn--primary ao-btn--lg"><Rune kind="plus-sm" size={13} />Разбить лагерь</button>,
    },
    'no-members': {
      glyph: 'helm', overline: 'Участники', title: 'В лагере никого',
      body: 'Привал создан, но состав пуст. Добавьте персонажей отряда — дозор и активности назначаются только участникам.',
      action: <button className="ao-btn ao-btn--primary"><Rune kind="plus-sm" size={13} />Добавить участников</button>,
    },
    'no-events': {
      glyph: 'scroll', overline: 'Журнал', title: 'Ночь без происшествий',
      body: 'События привала — засады, встречи, погода, сюжет — появятся здесь. ГМ может добавить событие вручную.',
      action: <button className="ao-btn ao-btn--sm"><Rune kind="plus-sm" size={11} />Добавить событие</button>,
    },
  }[kind];
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь" breadcrumb="Кампания «Пепел Керена»" right={<Chip tone="gold" glyph="helm">Мастер Игры</Chip>} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: 40 }}>
          <Panel frame style={{ maxWidth: 560 }} padding={0}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 34 }}>
              <Sigil size={64} glyph={kind === 'no-camp' ? 'sigil-1' : 'sigil-3'} />
            </div>
            <EmptyVault {...conf} />
            <span className="ao-frame-c" />
          </Panel>
        </div>
      </div>
    </Backdrop>
  );
}

function CampError() {
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь" breadcrumb="Кампания «Пепел Керена»" right={<LiveDot label="соединение потеряно" stale />} />
        <div style={{ padding: 20, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: 'rgba(179,70,26,0.1)', border: '1px solid rgba(179,70,26,0.5)', borderLeft: '2px solid var(--ember)' }}>
            <Rune kind="tri-inv" size={16} color="#d8896a" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d8896a' }}>Не удалось загрузить лагерь</div>
              <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)', marginTop: 3 }}>CAMP_FETCH_FAILED · сервер ответил 503. Показаны последние известные данные, синхронизация приостановлена.</div>
            </div>
            <button className="ao-btn ao-btn--sm"><Rune kind="arrow-r" size={11} />Повторить</button>
          </div>
          <div style={{ opacity: 0.4, filter: 'saturate(0.5)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ao-panel" style={{ padding: '18px 22px' }}>
              <div className="ao-h4" style={{ fontSize: 25 }}>{CAMP_BASE.name}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><SafetyBadge level="RISKY" /><CampStatusBadge status="ACTIVE" /></div>
            </div>
            <div className="ao-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CAMP_MEMBERS.slice(0, 3).map((m) => <MemberCard key={m.id} m={m} view="player" dense />)}
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

Object.assign(window, { CampScreen, CampScreenPlayer, CampLoading, CampEmpty, CampError, CAMP_BASE });
