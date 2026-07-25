/* global React, Rune, Panel, PanelHeader, Chip, Divider, Backdrop, TopBar, EmptyVault,
   CampHeader, MemberCard, WatchPanel, EventLog, CAMP_MEMBERS, CAMP_EVENTS, AMBUSH_EVENT,
   GMHint, LiveDot, CampPortrait, MiniBar, RestStateTag, CAMP_BASE, CampStatusBadge */
// ─────────────────────────────────────────────────────────────
// СОСТОЯНИЕ RESTING — групповой отдых. Отдых идёт per-character:
// отдельная транзакция на каждого. Ошибка одного не откатывает
// остальных — отдельный список ошибок и повтор.
// ─────────────────────────────────────────────────────────────

const { useState: rUseState, useEffect: rUseEffect } = React;

const REST_PLAN = [
  { id: 'c1', p: 100, state: 'RESTED', result: { hp: '+17 → 58/58', hd: 'кости хитов 3 → 6', res: 'ячейки заклинаний восстановлены', cond: 'снято: Истощение 1' } },
  { id: 'c2', p: 100, state: 'RESTED', result: { hp: '+14 → 44/44', hd: 'кости хитов 5 → 6', res: 'вдохновение 0 → 1', cond: null } },
  { id: 'c3', p: 62, state: 'RESTING', result: null },
  { id: 'c4', p: 100, state: 'RESTED', result: { hp: '+4 → 40/40', hd: 'кости хитов 6 → 6', res: 'ячейки заклинаний восстановлены', cond: null } },
  { id: 'c5', p: 0, state: 'FAILED', result: null, error: { code: 'REST_TX_CONFLICT', msg: 'Лист персонажа изменён другим клиентом во время транзакции. Остальные участники отдохнули — откат не выполнялся.' } },
];

function RestResultCard({ m, r }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '11px 13px', background: 'rgba(122,152,102,0.05)', border: '1px solid rgba(122,152,102,0.32)' }}>
      <CampPortrait size={34} glyph={m.glyph} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{m.name}</span>
          <RestStateTag state="RESTED" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {[r.hp, r.hd, r.res, r.cond].filter(Boolean).map((line, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-quiet)' }}>
              <Rune kind="check" size={9} color="#7a9866" />{line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RestingScreen({ view = 'gm', phase = 'running' }) {
  const [prog, setProg] = rUseState(() => (phase === 'done' ? REST_PLAN.map((r) => (r.state === 'FAILED' ? 0 : 100)) : REST_PLAN.map((r) => r.p)));
  const [retried, setRetried] = rUseState(false);
  const members = CAMP_MEMBERS;
  const plan = REST_PLAN.map((r, i) => ({ ...r, p: prog[i], state: retried && r.state === 'FAILED' ? 'RESTED' : prog[i] >= 100 ? 'RESTED' : r.state }));

  rUseEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      setProg((prev) => prev.map((v, i) => (REST_PLAN[i].state === 'RESTING' && v < 100 ? Math.min(100, v + 6) : v)));
    }, 700);
    return () => clearInterval(t);
  }, [phase]);

  const done = plan.filter((r) => r.state === 'RESTED');
  const failed = plan.filter((r) => r.state === 'FAILED');
  const running = plan.filter((r) => r.state === 'RESTING');
  const camp = { ...CAMP_BASE, status: running.length ? 'RESTING' : 'RESTING', safety: 'RISKY' };

  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь · Отдых" breadcrumb="Кампания «Пепел Керена» · Привал у Серой ложбины"
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><LiveDot label="отдых идёт" /><Chip tone="gold" glyph="helm">Мастер Игры</Chip></div>} />
        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CampHeader camp={camp} view={view} />

          {/* полоса общего прогресса */}
          <div className="ao-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Rune kind="cir-dot" size={15} color="var(--arcane)" />
              <span className="ao-engraved" style={{ fontSize: 13 }}>Длинный отдых · 8 часов</span>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span className="ao-overline" style={{ fontSize: 9 }}>транзакция на каждого персонажа</span>
                <span className="ao-codex" style={{ fontSize: 10 }}>{done.length} готово · {running.length} в процессе · {failed.length} с ошибкой</span>
              </div>
              <div className="ao-bar" style={{ height: 7 }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ width: `${(done.length / members.length) * 100}%`, background: 'linear-gradient(90deg, #3d5a44, #7a9866)', transition: 'width 500ms' }} />
                  <div style={{ width: `${(running.length / members.length) * 100}%`, background: 'repeating-linear-gradient(45deg, var(--arcane-deep) 0 5px, var(--arcane) 5px 10px)', opacity: 0.8, transition: 'width 500ms' }} />
                  <div style={{ width: `${(failed.length / members.length) * 100}%`, background: 'linear-gradient(90deg, #7d2f10, #b3461a)', transition: 'width 500ms' }} />
                </div>
              </div>
            </div>
            {view === 'gm' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {failed.length > 0 && <button className="ao-btn ao-btn--sm" onClick={() => setRetried(true)}><Rune kind="arrow-r" size={11} />Повторить {failed.length}</button>}
                <button className="ao-btn ao-btn--sm ao-btn--primary" disabled={running.length > 0} style={{ opacity: running.length > 0 ? 0.4 : 1 }}>
                  <Rune kind="check" size={11} />Завершить отдых
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* участники с прогрессом */}
            <div style={{ flex: '1.4 1 0', minWidth: 0 }}>
              <Panel padding={0}>
                <PanelHeader title="Отдых по участникам" sub="per-character · ошибка одного не откатывает остальных" glyph="helm"
                  right={<span className="ao-codex" style={{ fontSize: 10 }}>{done.length}/{members.length}</span>} />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {members.map((m, i) => {
                    const r = plan[i];
                    const restedM = r.state === 'RESTED' && r.result
                      ? { ...m, hp: [m.hp[1], m.hp[1]], hd: [m.hd[1], m.hd[1]], res: { ...m.res, cur: m.res.max } }
                      : m;
                    return (
                      <MemberCard key={m.id} m={restedM} view={view}
                        restState={r.state} progress={r.p} error={r.state === 'FAILED' ? r.error : null} />
                    );
                  })}
                </div>
              </Panel>
            </div>

            {/* итоговая сводка */}
            <div style={{ flex: '1 1 0', minWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Panel padding={0}>
                <PanelHeader title="Итоги отдыха" sub="RestResult" glyph="check"
                  right={<span className="ao-codex" style={{ fontSize: 10, color: '#7a9866' }}>{done.length} успешно</span>} />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {done.length === 0
                    ? <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>пока никто не завершил отдых</span>
                    : done.map((r) => <RestResultCard key={r.id} m={members.find((m) => m.id === r.id)} r={REST_PLAN.find((x) => x.id === r.id).result || { hp: 'хиты восстановлены', hd: 'кости хитов восстановлены', res: 'ресурсы восстановлены' }} />)}
                  {running.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px dashed var(--rule)' }}>
                      <span className="cp-breathe" style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: 'var(--arcane)' }} />
                      <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)' }}>
                        {running.map((r) => members.find((m) => m.id === r.id).name).join(', ')} — транзакция выполняется
                      </span>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel padding={0} style={{ borderColor: failed.length ? 'rgba(179,70,26,0.45)' : 'var(--rule)' }}>
                <PanelHeader title="Ошибки" sub="отдельным списком, без откатов" glyph="tri-inv"
                  right={<span className="ao-codex" style={{ fontSize: 10, color: failed.length ? '#d8896a' : 'var(--ink-faint)' }}>{failed.length}</span>} />
                <div style={{ padding: 14 }}>
                  {failed.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Rune kind="check" size={13} color="#7a9866" />
                      <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)' }}>ошибок нет — все транзакции прошли</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {failed.map((r) => {
                        const m = members.find((x) => x.id === r.id);
                        return (
                          <div key={r.id} style={{ padding: '11px 13px', background: 'rgba(179,70,26,0.07)', border: '1px solid rgba(179,70,26,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <Rune kind="x" size={12} color="#d8896a" />
                              <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{m.name}</span>
                              <span className="ao-codex" style={{ fontSize: 10, color: '#d8896a' }}>{r.error.code}</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 6, textWrap: 'pretty' }}>{r.error.msg}</div>
                            {view === 'gm' && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button className="ao-btn ao-btn--sm" onClick={() => setRetried(true)}><Rune kind="arrow-r" size={11} />Повторить для {m.name.split(' ')[0]}</button>
                                <button className="ao-btn ao-btn--sm ao-btn--ghost"><Rune kind="minus" size={11} />Пропустить</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {view === 'gm' && <GMHint tone="ember" glyph="scroll">Остальные участники уже применили отдых. Повтор затрагивает только персонажей из этого списка.</GMHint>}
                    </div>
                  )}
                </div>
              </Panel>

              {view === 'gm' && <GMHint glyph="eye">Локация с риском: пока отряд спит, можно бросить встречу — прерывание переведёт лагерь в INTERRUPTED.</GMHint>}
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

Object.assign(window, { RestingScreen, RestResultCard, REST_PLAN });
