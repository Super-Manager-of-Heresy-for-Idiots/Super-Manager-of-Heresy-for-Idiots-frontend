/* global React, Rune, Panel, PanelHeader, Chip, Divider, Backdrop, TopBar, ModalScene, Field, EmptyVault,
   CAMP_STATUS, CAMP_CHAIN, CampStatusBadge, StatusTimeline, SAFETY, SafetyBadge, SafetySegment,
   REST_STATE, RestStateTag, EVENT_TYPES, GMHint, LiveDot, Sk, CampPortrait, MiniBar,
   CAMP_MEMBERS, CAMP_EVENTS, AMBUSH_EVENT, CampHeader, MemberCard, EventLog, CAMP_BASE, CampToggle */
// ─────────────────────────────────────────────────────────────
// КИТ ЛАГЕРЯ · модал добавления события · состояние COMPLETED
// ─────────────────────────────────────────────────────────────

const { useState: kUseState } = React;

function KitRow({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 18, borderBottom: '1px solid var(--hairline)' }}>
      <div>
        <div className="ao-engraved" style={{ fontSize: 12 }}>{title}</div>
        {sub && <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)', marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function CampKitBoard() {
  const [safety, setSafety] = kUseState('RISKY');
  return (
    <Backdrop>
      <div className="ao-scroll" style={{ height: '100%', overflow: 'auto', padding: 24, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <span className="ao-overline">Кит · Лагерь и привал</span>
              <div className="ao-h3" style={{ fontSize: 30, marginTop: 4 }}>Новые компоненты</div>
            </div>
            <KitRow title="Бейдж статуса лагеря" sub="state-machine: SETTING_UP → ACTIVE → RESTING → COMPLETED, ветка INTERRUPTED.">
              {Object.keys(CAMP_STATUS).map((k) => <CampStatusBadge key={k} status={k} />)}
            </KitRow>
            <KitRow title="Крупный бейдж (шапка лагеря)">
              <CampStatusBadge status="ACTIVE" size="lg" />
              <CampStatusBadge status="RESTING" size="lg" pulse />
              <CampStatusBadge status="INTERRUPTED" size="lg" pulse />
            </KitRow>
            <KitRow title="Таймлайн переходов" sub="Пройденные — залитые ромбы, текущий — с ореолом; прерывание уходит в ветку.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
                <StatusTimeline status="SETTING_UP" />
                <StatusTimeline status="RESTING" />
                <StatusTimeline status="INTERRUPTED" visited={['SETTING_UP', 'ACTIVE', 'RESTING']} />
              </div>
            </KitRow>
            <KitRow title="Метка безопасности локации" sub="rest_safety — поле локации, а не отдельная сущность.">
              <SafetyBadge level="SAFE" /><SafetyBadge level="RISKY" /><SafetyBadge level="DANGEROUS" />
              <span style={{ width: 20 }} />
              <SafetySegment value={safety} onChange={setSafety} />
              <SafetySegment value={safety} onChange={setSafety} size="sm" />
            </KitRow>
            <KitRow title="Статус отдыха участника">
              {Object.keys(REST_STATE).map((k) => <RestStateTag key={k} state={k} />)}
            </KitRow>
            <KitRow title="Типы событий журнала">
              {Object.keys(EVENT_TYPES).map((k) => {
                const t = EVENT_TYPES[k];
                return (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', border: `1px solid ${t.c}66`, background: 'rgba(0,0,0,0.4)' }}>
                    <Rune kind={t.glyph} size={12} color={t.c} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.c }}>{t.ru}</span>
                  </span>
                );
              })}
            </KitRow>
            <KitRow title="Подсказки ГМ" sub="Механику система не применяет — только советует.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <GMHint glyph="eye" action={<button className="ao-btn ao-btn--sm">Бросить</button>}>Локация с риском — бросьте случайную встречу.</GMHint>
                <GMHint tone="ember" glyph="sword">Опасная локация — рекомендуется бросок засады.</GMHint>
                <GMHint tone="arcane" glyph="scroll">Награды за активности выдаются вручную обычными инструментами.</GMHint>
              </div>
            </KitRow>
            <KitRow title="Реалтайм и загрузка" sub="Вебсокет-сигналы без навязчивых спиннеров: тихий индикатор и скелетоны.">
              <LiveDot /><LiveDot label="соединение потеряно" stale />
              <span style={{ width: 20 }} />
              <Sk w={120} h={12} /><Sk w={70} h={26} />
            </KitRow>
            <KitRow title="Тумблер ГМ">
              <div style={{ maxWidth: 420 }}><CampToggle on onChange={() => {}} label="Засчитать частичный отдых" hint="Прерванный длинный отдых по умолчанию не даёт восстановления." /></div>
            </KitRow>
          </div>
          <div style={{ width: 470, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="ao-overline">Карточка участника</div>
            <MemberCard m={CAMP_MEMBERS[0]} view="gm" />
            <MemberCard m={CAMP_MEMBERS[2]} view="player" restState="RESTING" progress={64} />
            <MemberCard m={CAMP_MEMBERS[4]} view="gm" restState="FAILED" progress={0} error={{ code: 'REST_TX_CONFLICT', msg: 'Лист изменён другим клиентом. Остальные не откатывались.' }} />
            <div className="ao-overline" style={{ marginTop: 6 }}>Решения дизайна</div>
            <Panel padding={16}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Статус — один источник правды', 'Кнопки ГМ строятся из карты валидных переходов, поэтому невозможных действий на экране просто нет.'],
                  ['Отдых — per-character', 'Прогресс, результат и ошибка живут на карточке участника; ошибки дополнительно собраны отдельным списком с повтором.'],
                  ['Роли — вычитанием', 'Вид игрока — та же вёрстка без управляющих элементов, а не отдельный экран.'],
                  ['Никаких автоэффектов', 'Активности и события ничего не начисляют: система пишет факт, награды выдаёт ГМ вручную.'],
                ].map(([t, d]) => (
                  <div key={t} style={{ display: 'flex', gap: 11 }}>
                    <Rune kind="diamond-fill" size={9} color="var(--bronze)" style={{ marginTop: 5 }} />
                    <div>
                      <div className="ao-engraved" style={{ fontSize: 11 }}>{t}</div>
                      <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-quiet)', marginTop: 3, textWrap: 'pretty' }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

// ═══ Модал «Добавить событие» ════════════════════════════════
function AddEventModal() {
  const [type, setType] = kUseState('AMBUSH');
  const [combat, setCombat] = kUseState(true);
  return (
    <ModalScene codexId="CAMP-EVENT" overline="Журнал привала" title="Добавить событие"
      sub="Событие пишется в ленту привала. Засада дополнительно создаёт бой и переводит лагерь в INTERRUPTED."
      width={620} rune="sigil-2" danger={type === 'AMBUSH'}
      footer={
        <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
          <button className="ao-btn ao-btn--ghost">Отмена</button>
          <button className={`ao-btn ${type === 'AMBUSH' ? 'ao-btn--danger' : 'ao-btn--primary'}`}>
            <Rune kind={EVENT_TYPES[type].glyph} size={12} />{type === 'AMBUSH' && combat ? 'Записать и начать бой' : 'Записать событие'}
          </button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Тип события">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(EVENT_TYPES).map((k) => {
              const t = EVENT_TYPES[k];
              const on = type === k;
              return (
                <button key={k} onClick={() => setType(k)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px', minHeight: 38,
                  background: on ? `linear-gradient(180deg, ${t.c}26, transparent)` : 'var(--abyss)',
                  border: `1px solid ${on ? t.c : 'var(--hairline)'}`, cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: on ? t.c : 'var(--ink-faint)',
                }}>
                  <Rune kind={t.glyph} size={12} color={on ? t.c : 'var(--ink-ghost)'} />{t.ru}
                </button>
              );
            })}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 130 }}><Field label="Время"><input className="ao-input" defaultValue="01:20" /></Field></div>
          <div style={{ flex: 1 }}><Field label="Заголовок"><input className="ao-input" defaultValue="Засада гноллов" /></Field></div>
        </div>
        <Field label="Описание" hint="Видно игрокам в журнале привала.">
          <textarea className="ao-input" rows={3} defaultValue="Из-под корней вылезли трое гарпунщиков-гноллов. Дозорный провалил Внимательность." style={{ resize: 'vertical', fontFamily: 'var(--font-serif)', fontSize: 15 }} />
        </Field>
        {type === 'AMBUSH' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, border: '1px solid rgba(179,70,26,0.4)', background: 'rgba(179,70,26,0.06)' }}>
            <CampToggle on={combat} onChange={setCombat} tone="ember" label="Создать бой из засады"
              hint="Будет создан энкаунтер с участниками привала, а лагерь перейдёт в INTERRUPTED. В журнале появится ссылка «Перейти к бою»." />
            {combat && (
              <Field label="Противники (черновик энкаунтера)">
                <input className="ao-input" defaultValue="Гнолл-гарпунщик ×3" />
              </Field>
            )}
          </div>
        )}
      </div>
    </ModalScene>
  );
}

// ═══ COMPLETED ═══════════════════════════════════════════════
function CompletedScreen({ view = 'gm' }) {
  const camp = { ...CAMP_BASE, status: 'COMPLETED', safety: 'RISKY', visited: ['SETTING_UP', 'ACTIVE', 'RESTING', 'COMPLETED'] };
  const members = CAMP_MEMBERS.map((m) => ({ ...m, hp: [m.hp[1], m.hp[1]], hd: [m.hd[1], m.hd[1]], res: { ...m.res, cur: m.res.max }, rest: 'RESTED' }));
  return (
    <Backdrop>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Лагерь · Завершён" breadcrumb="Кампания «Пепел Керена» · архив привалов" right={<Chip tone={view === 'gm' ? 'gold' : undefined} glyph={view === 'gm' ? 'helm' : 'shield'}>{view === 'gm' ? 'Мастер Игры' : 'Игрок · Кассиан'}</Chip>} />
        <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CampHeader camp={camp} view={view} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '1.4 1 0', minWidth: 0 }}>
              <Panel padding={0}>
                <PanelHeader title="Итог привала" sub="все участники отдохнули · лагерь свёрнут" glyph="check"
                  right={<span className="ao-codex" style={{ fontSize: 10, color: '#7a9866' }}>5/5</span>} />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {members.map((m) => <MemberCard key={m.id} m={{ ...m, note: '' }} view="player" restState="RESTED" dense />)}
                </div>
              </Panel>
            </div>
            <div style={{ flex: '1 1 0', minWidth: 340, alignSelf: 'stretch' }}>
              <EventLog events={[...CAMP_EVENTS, { id: 'z', type: 'STORY', t: '06:10', text: 'Отряд свернул лагерь и вышел к шахтам. Привал завершён.' }]} view={view} height="100%" />
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

Object.assign(window, { CampKitBoard, AddEventModal, CompletedScreen, KitRow });
