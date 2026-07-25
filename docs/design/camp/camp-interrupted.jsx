/* global React, Rune, Panel, PanelHeader, Chip, Divider, Backdrop, TopBar,
   CampHeader, MemberCard, WatchPanel, EventLog, CAMP_MEMBERS, CAMP_EVENTS, AMBUSH_EVENT,
   GMHint, LiveDot, CAMP_BASE, CampPortrait, RestStateTag */
// ─────────────────────────────────────────────────────────────
// СОСТОЯНИЕ INTERRUPTED — прерывание привала.
// Баннер причины, ссылка на созданный бой, флаг ГМ applyPartialRest.
// ─────────────────────────────────────────────────────────────

const { useState: iUseState } = React;

function CampToggle({ on, onChange, label, hint, tone = 'gold' }) {
  const c = tone === 'ember' ? '#d8896a' : 'var(--gold-pale)';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <button onClick={() => onChange(!on)} role="switch" aria-checked={on} style={{
        width: 52, height: 26, flexShrink: 0, marginTop: 2, padding: 2, cursor: 'pointer',
        background: on ? `linear-gradient(180deg, ${c}33, rgba(0,0,0,0.5))` : 'var(--abyss)',
        border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, position: 'relative', transition: 'all 180ms',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 28 : 3, width: 18, height: 18, transition: 'left 180ms',
          background: on ? 'linear-gradient(180deg, var(--gold-pale), var(--gold-deep))' : 'var(--ash)',
          border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, transform: 'rotate(45deg)',
        }} />
      </button>
      <div style={{ minWidth: 0 }}>
        <div className="ao-engraved" style={{ fontSize: 12, color: on ? c : 'var(--ink)' }}>{label}</div>
        {hint && <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)', marginTop: 5, textWrap: 'pretty' }}>{hint}</div>}
      </div>
    </div>
  );
}

function InterruptedScreen({ view = 'gm', reason = 'AMBUSH' }) {
  const [partial, setPartial] = iUseState(false);
  const members = CAMP_MEMBERS;
  const camp = { ...CAMP_BASE, status: 'INTERRUPTED', safety: 'DANGEROUS', visited: ['SETTING_UP', 'ACTIVE', 'RESTING'] };
  const events = [...CAMP_EVENTS, AMBUSH_EVENT];

  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь · Прервано" breadcrumb="Кампания «Пепел Керена» · Привал у Серой ложбины"
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><LiveDot label="прерывание получено" /><Chip tone={view === 'gm' ? 'gold' : undefined} glyph={view === 'gm' ? 'helm' : 'shield'}>{view === 'gm' ? 'Мастер Игры' : 'Игрок · Кассиан'}</Chip></div>} />

        {/* баннер прерывания */}
        <div className="cp-alarm" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 22px', background: 'linear-gradient(90deg, rgba(179,70,26,0.18), rgba(179,70,26,0.05))', borderBottom: '1px solid rgba(179,70,26,0.55)', position: 'relative', zIndex: 3 }}>
          <Rune kind="sword" size={22} color="#d8896a" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e0a88a' }}>
              Привал прерван — {reason === 'AMBUSH' ? 'засада' : 'внешнее событие'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 4, textWrap: 'pretty' }}>
              {reason === 'AMBUSH'
                ? 'Гнолли вышли на лагерь в 01:20, во время третьего дозора. Отдых остановлен на всех участниках.'
                : 'Отдых остановлен Мастером. Восстановление не применено.'}
            </div>
          </div>
          {reason === 'AMBUSH' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="ao-codex" style={{ fontSize: 10 }}>бой №{AMBUSH_EVENT.combat.id}</span>
              <button className="ao-btn ao-btn--danger"><Rune kind="sword" size={12} />Перейти к бою</button>
            </div>
          )}
        </div>

        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CampHeader camp={camp} view={view} />

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '1.4 1 0', minWidth: 0 }}>
              <Panel padding={0}>
                <PanelHeader title="Участники" sub={partial ? 'частичный отдых засчитан ГМ' : 'длинный отдых прерван — восстановления нет'} glyph="helm"
                  right={<span className="ao-codex" style={{ fontSize: 10, color: partial ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>{partial ? 'PARTIAL ×5' : '0/5 отдохнули'}</span>} />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {members.map((m) => (
                    <MemberCard key={m.id} m={m} view={view} restState={partial ? 'PARTIAL' : 'NOT_RESTED'} />
                  ))}
                </div>
              </Panel>
            </div>

            <div style={{ flex: '1 1 0', minWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* флаг ГМ */}
              <Panel padding={0} style={{ borderColor: partial ? 'var(--brass)' : 'var(--rule)' }}>
                <PanelHeader title="Решение Мастера" sub="applyPartialRest" glyph="scroll" />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {view === 'gm' ? (
                    <CampToggle on={partial} onChange={setPartial} label="Засчитать частичный отдых"
                      hint="По умолчанию прерванный длинный отдых не даёт восстановления. Включите, если считаете, что отряд успел выспаться достаточно — участникам применится частичный результат (кости хитов и хиты, без полного сброса ресурсов)." />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Rune kind={partial ? 'check' : 'minus'} size={14} color={partial ? 'var(--gold-pale)' : 'var(--ink-faint)'} />
                      <span className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)' }}>
                        Мастер {partial ? 'засчитал частичный отдых' : 'пока не засчитал частичный отдых'}.
                      </span>
                    </div>
                  )}
                  {view === 'gm' && (
                    <>
                      <Divider />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ao-btn ao-btn--primary" style={{ flex: 1 }} disabled={!partial} onClick={() => {}}>
                          <Rune kind="check" size={12} />Применить к 5 персонажам
                        </button>
                        <button className="ao-btn ao-btn--ghost"><Rune kind="x" size={12} />Отмена</button>
                      </div>
                      <GMHint tone="ember" glyph="tri-inv">
                        Применение необратимо: RestResult запишется в листы персонажей и в журнал привала.
                      </GMHint>
                    </>
                  )}
                </div>
              </Panel>

              {/* что дальше */}
              <Panel padding={0}>
                <PanelHeader title="Что дальше" glyph="arrow-r" />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['sword', 'Разрешить бой', 'Бой №enc-118 уже создан из события засады.', view === 'gm'],
                    ['flame', 'Вернуться в лагерь', 'После боя лагерь можно вернуть в ACTIVE и начать отдых заново.', view === 'gm'],
                    ['check', 'Завершить привал', 'Свернуть лагерь и продолжить путь.', view === 'gm'],
                  ].map(([g, t, d, can]) => (
                    <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', border: '1px solid var(--hairline)', background: 'rgba(0,0,0,0.25)', opacity: can ? 1 : 0.6 }}>
                      <Rune kind={g} size={13} color="var(--bronze-warm)" />
                      <div style={{ minWidth: 0 }}>
                        <div className="ao-engraved" style={{ fontSize: 11 }}>{t}</div>
                        <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 3 }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <EventLog events={events} view={view} height="auto" />
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

Object.assign(window, { InterruptedScreen, CampToggle });
