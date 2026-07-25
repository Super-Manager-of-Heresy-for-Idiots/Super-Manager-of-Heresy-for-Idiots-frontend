/* global React, Rune, Panel, PanelHeader, Chip, Sigil, Divider, EmptyVault, Field */
// ─────────────────────────────────────────────────────────────
// ORDO ARCANUM · Лагерь и Привал — общий кит
// Статусы лагеря, таймлайн переходов, метка безопасности,
// карточка участника, дозор, склад, активности, журнал.
// ─────────────────────────────────────────────────────────────

const { useState: cUseState, useMemo: cUseMemo, useEffect: cUseEffect } = React;

// ─── Статусы лагеря ──────────────────────────────────────────
const CAMP_STATUS = {
  SETTING_UP:  { ru: 'Разбивают лагерь', short: 'Разбивка', c: 'var(--ink-quiet)', glyph: 'square-rot' },
  ACTIVE:      { ru: 'Лагерь стоит',     short: 'Активен',  c: '#b08d4e',          glyph: 'flame' },
  RESTING:     { ru: 'Отдых',            short: 'Отдых',    c: '#5a8e94',          glyph: 'cir-dot' },
  INTERRUPTED: { ru: 'Прервано',         short: 'Прервано', c: '#b3461a',          glyph: 'sword' },
  COMPLETED:   { ru: 'Завершён',         short: 'Завершён', c: '#7a9866',          glyph: 'check' },
};

// валидные переходы (для кнопок ГМ)
const CAMP_TRANSITIONS = {
  SETTING_UP:  [['ACTIVE', 'Начать привал', 'primary'], ['COMPLETED', 'Свернуть лагерь', 'ghost']],
  ACTIVE:      [['RESTING', 'Начать отдых', 'primary'], ['INTERRUPTED', 'Прервать', 'danger'], ['COMPLETED', 'Завершить привал', 'ghost']],
  RESTING:     [['COMPLETED', 'Завершить отдых', 'primary'], ['INTERRUPTED', 'Прервать отдых', 'danger']],
  INTERRUPTED: [['ACTIVE', 'Вернуться в лагерь', 'primary'], ['COMPLETED', 'Завершить привал', 'ghost']],
  COMPLETED:   [],
};

function CampStatusBadge({ status = 'ACTIVE', size = 'md', pulse = false }) {
  const m = CAMP_STATUS[status];
  const lg = size === 'lg';
  return (
    <span className={pulse ? 'cp-pulse' : ''} style={{
      display: 'inline-flex', alignItems: 'center', gap: lg ? 10 : 7,
      padding: lg ? '8px 16px' : '4px 10px',
      background: 'rgba(0,0,0,0.45)', border: `1px solid ${m.c}`,
      fontFamily: 'var(--font-display)', fontSize: lg ? 14 : 10,
      letterSpacing: '0.2em', textTransform: 'uppercase', color: m.c, whiteSpace: 'nowrap',
    }}>
      <Rune kind={m.glyph} size={lg ? 16 : 11} color={m.c} />
      {lg ? m.ru : m.short}
    </span>
  );
}

// ─── Таймлайн переходов статусов ─────────────────────────────
const CAMP_CHAIN = ['SETTING_UP', 'ACTIVE', 'RESTING', 'COMPLETED'];

function StatusTimeline({ status = 'ACTIVE', visited = [] }) {
  const idx = CAMP_CHAIN.indexOf(status);
  const interrupted = status === 'INTERRUPTED';
  // при прерывании считаем, что дошли до RESTING/ACTIVE
  const reached = interrupted ? Math.max(1, CAMP_CHAIN.indexOf(visited[visited.length - 1] || 'ACTIVE')) : idx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {CAMP_CHAIN.map((k, i) => {
          const done = i < reached;
          const cur = !interrupted && i === idx;
          const c = cur ? CAMP_STATUS[k].c : done ? 'var(--bronze-warm)' : 'var(--ink-ghost)';
          return (
            <React.Fragment key={k}>
              {i > 0 && (
                <span style={{ flex: 1, height: 1, margin: '0 8px', background: i <= reached ? 'linear-gradient(90deg, var(--bronze), var(--brass))' : 'var(--rule)' }} />
              )}
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
                  <Rune kind={cur ? 'diamond-fill' : done ? 'diamond-fill' : 'diamond'} size={cur ? 16 : 11} color={c} />
                  {cur && <span className="cp-halo" style={{ position: 'absolute', width: 26, height: 26, border: `1px solid ${c}`, transform: 'rotate(45deg)' }} />}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: cur ? 'var(--ink-bright)' : done ? 'var(--ink-quiet)' : 'var(--ink-ghost)', whiteSpace: 'nowrap',
                }}>{CAMP_STATUS[k].short}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {/* ветка INTERRUPTED */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: '32%', marginTop: 14 }}>
        <span style={{ width: 1, height: 14, background: interrupted ? 'var(--ember)' : 'var(--rule)', marginBottom: 0 }} />
        <span style={{ width: 26, height: 1, borderTop: `1px dashed ${interrupted ? 'var(--ember)' : 'var(--rule)'}` }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: interrupted ? 1 : 0.45 }}>
          <Rune kind="diamond" size={10} color={interrupted ? 'var(--ember)' : 'var(--ink-ghost)'} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: interrupted ? '#d8896a' : 'var(--ink-ghost)' }}>
            Прервано
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── Безопасность локации ────────────────────────────────────
const SAFETY = {
  SAFE:      { ru: 'Безопасно',  c: '#7a9866', glyph: 'shield', hint: null },
  RISKY:     { ru: 'Риск',       c: '#b08d4e', glyph: 'eye',    hint: 'Локация с риском — бросьте случайную встречу перед отдыхом.' },
  DANGEROUS: { ru: 'Опасно',     c: '#b3461a', glyph: 'sword',  hint: 'Опасная локация — рекомендуется бросок засады. Прерывание вероятно.' },
};

function SafetyBadge({ level = 'SAFE', size = 'md' }) {
  const m = SAFETY[level];
  const lg = size === 'lg';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: lg ? '6px 12px' : '3px 9px',
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${m.c}88`,
      fontFamily: 'var(--font-mono)', fontSize: lg ? 11 : 10, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: m.c, whiteSpace: 'nowrap',
    }}>
      <Rune kind={m.glyph} size={lg ? 13 : 11} color={m.c} />
      {m.ru}
    </span>
  );
}

// сегментированный контрол rest_safety (для карточки/редактора локации)
function SafetySegment({ value = 'SAFE', onChange, size = 'md', labels = true }) {
  const sm = size === 'sm';
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--rule)', background: 'var(--abyss)', boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.5)' }}>
      {Object.keys(SAFETY).map((k) => {
        const m = SAFETY[k];
        const on = value === k;
        return (
          <button key={k} onClick={() => onChange && onChange(k)} title={m.ru} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: sm ? '5px 9px' : '7px 13px', minHeight: sm ? 28 : 34,
            background: on ? `linear-gradient(180deg, ${m.c}30, ${m.c}12)` : 'transparent',
            border: 'none', borderRight: '1px solid var(--hairline)',
            fontFamily: 'var(--font-display)', fontSize: sm ? 9 : 10, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: on ? m.c : 'var(--ink-faint)',
            cursor: 'pointer', transition: 'all 150ms',
          }}>
            <Rune kind={m.glyph} size={sm ? 10 : 12} color={on ? m.c : 'var(--ink-ghost)'} />
            {labels && m.ru}
          </button>
        );
      })}
    </div>
  );
}

// ─── Подсказка ГМ (не действие системы, а совет) ──────────────
function GMHint({ children, tone = 'gold', action, glyph = 'eye' }) {
  const c = tone === 'ember' ? '#d8896a' : tone === 'arcane' ? 'var(--arcane)' : 'var(--gold-pale)';
  const bg = tone === 'ember' ? 'rgba(179,70,26,0.08)' : tone === 'arcane' ? 'rgba(90,142,148,0.07)' : 'rgba(176,141,78,0.06)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: bg, border: `1px solid ${c}44`, borderLeft: `2px solid ${c}` }}>
      <Rune kind={glyph} size={14} color={c} />
      <span className="ao-italic" style={{ flex: 1, fontSize: 13, color: 'var(--ink)', textWrap: 'pretty' }}>{children}</span>
      {action}
    </div>
  );
}

// ─── Живой индикатор (WebSocket) ─────────────────────────────
function LiveDot({ label = 'синхронизировано', stale = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: stale ? 'var(--ink-faint)' : 'var(--ink-quiet)' }}>
      <span className={stale ? '' : 'cp-breathe'} style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: stale ? 'var(--ink-ghost)' : '#7a9866', boxShadow: stale ? 'none' : '0 0 6px rgba(122,152,102,0.6)' }} />
      {label}
    </span>
  );
}

// ─── Скелетон ────────────────────────────────────────────────
function Sk({ w = '100%', h = 12, style }) {
  return <span className="cp-sk" style={{ width: w, height: h, ...style }} />;
}

// ─── Портрет участника ───────────────────────────────────────
function CampPortrait({ size = 48, dim = false, glyph = 'helm' }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, background: 'var(--abyss)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)', opacity: dim ? 0.5 : 1 }}>
      <Rune kind={glyph} size={size * 0.48} color={dim ? 'var(--ink-ghost)' : 'var(--ink-quiet)'} />
    </div>
  );
}

// ─── Мини-бар ресурса ────────────────────────────────────────
function MiniBar({ cur, max, tone = 'ember', w = 74 }) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  const fill = tone === 'arcane' ? 'linear-gradient(90deg, var(--arcane-deep), var(--arcane))'
    : tone === 'gold' ? 'linear-gradient(90deg, var(--gold-deep), var(--gold-pale))'
    : pct <= 25 ? 'linear-gradient(90deg, #7d2f10, #b3461a)'
    : pct <= 60 ? 'linear-gradient(90deg, #836a3a, #b08d4e)'
    : 'linear-gradient(90deg, #3d5a44, #7a9866)';
  return (
    <div className="ao-bar" style={{ width: w, height: 5 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: fill, transition: 'width 500ms ease-out' }} />
    </div>
  );
}

// ─── Статус отдыха участника ─────────────────────────────────
const REST_STATE = {
  NOT_RESTED: { ru: 'не отдохнул', c: 'var(--ink-faint)', glyph: 'minus' },
  RESTING:    { ru: 'отдыхает',    c: 'var(--arcane)',    glyph: 'cir-dot' },
  RESTED:     { ru: 'отдохнул',    c: '#7a9866',          glyph: 'check' },
  PARTIAL:    { ru: 'частичный',   c: 'var(--gold-pale)', glyph: 'tri-inv' },
  FAILED:     { ru: 'ошибка',      c: '#d8896a',          glyph: 'x' },
  ON_WATCH:   { ru: 'в дозоре',    c: '#b08d4e',          glyph: 'eye' },
};

function RestStateTag({ state = 'NOT_RESTED' }) {
  const m = REST_STATE[state];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: m.c }}>
      <Rune kind={m.glyph} size={10} color={m.c} />{m.ru}
    </span>
  );
}

// ─── Данные-заготовки ────────────────────────────────────────
const CAMP_MEMBERS = [
  { id: 'c1', name: 'Кассиан Вейл', cls: 'Паладин 6', glyph: 'shield', hp: [41, 58], res: { label: 'ячейки 2 ур.', cur: 1, max: 3, tone: 'arcane' }, hd: [3, 6], rest: 'NOT_RESTED', watch: 1, act: 'Ковка', note: 'Правит зазубрину на щите — просил «первый дозор не давать».' },
  { id: 'c2', name: 'Мирелла Тень', cls: 'Плут 6',  glyph: 'sigil-3', hp: [30, 44], res: { label: 'вдохновение', cur: 0, max: 1, tone: 'gold' }, hd: [5, 6], rest: 'NOT_RESTED', watch: 3, act: 'Разведка окрестностей', note: 'Ищет второй выход из ложбины.' },
  { id: 'c3', name: 'Бренн Камнерук', cls: 'Варвар 5', glyph: 'helm', hp: [12, 62], res: { label: 'ярость', cur: 1, max: 3, tone: 'ember' }, hd: [1, 5], rest: 'NOT_RESTED', watch: 2, act: 'Готовка', note: 'Тушёнка из вчерашнего кабана. +1 к морали, говорит он.' },
  { id: 'c4', name: 'Аэлис Свет', cls: 'Жрица 6', glyph: 'sigil-2', hp: [36, 40], res: { label: 'ячейки 3 ур.', cur: 2, max: 3, tone: 'arcane' }, hd: [6, 6], rest: 'NOT_RESTED', watch: null, act: 'Молитва', note: '' },
  { id: 'c5', name: 'Тоск', cls: 'Волшебник 5', glyph: 'scroll', hp: [22, 33], res: { label: 'ячейки 2 ур.', cur: 0, max: 3, tone: 'arcane' }, hd: [2, 5], rest: 'NOT_RESTED', watch: 4, act: 'Переписывание свитка', note: 'Просил не трогать чернила.' },
];

const WATCH_SLOTS = [
  { n: 1, time: '20:00 — 22:30' },
  { n: 2, time: '22:30 — 01:00' },
  { n: 3, time: '01:00 — 03:30' },
  { n: 4, time: '03:30 — 06:00' },
];

const CAMP_ACTIVITIES = [
  { id: 'a1', name: 'Готовка', kind: 'SYSTEM', glyph: 'flame', desc: 'Горячая еда для отряда.' },
  { id: 'a2', name: 'Ковка / починка', kind: 'SYSTEM', glyph: 'sword', desc: 'Ремонт снаряжения.' },
  { id: 'a3', name: 'Разведка окрестностей', kind: 'SYSTEM', glyph: 'eye', desc: 'Осмотр местности вокруг привала.' },
  { id: 'a4', name: 'Переписывание свитка', kind: 'SYSTEM', glyph: 'scroll', desc: 'Работа с текстами и заклинаниями.' },
  { id: 'a5', name: 'Молитва', kind: 'SYSTEM', glyph: 'sigil-2', desc: 'Обращение к покровителю.' },
  { id: 'a6', name: 'Травничество', kind: 'SYSTEM', glyph: 'diamond', desc: 'Сбор трав и приготовление отваров.' },
  { id: 'a7', name: 'Допрос пленника', kind: 'CUSTOM', glyph: 'lock', desc: 'Кастомная активность кампании «Пепел Керена».' },
  { id: 'a8', name: 'Пение баллады', kind: 'CUSTOM', glyph: 'book', desc: 'Кастомная: поднимает духом, решает ГМ.' },
];

const STORAGE_ITEMS = [
  { id: 's1', name: 'Зелье лечения', qty: 4, rarity: 'COMMON', w: 0.5, glyph: 'diamond' },
  { id: 's2', name: 'Верёвка, 15 м', qty: 1, rarity: 'COMMON', w: 5, glyph: 'cir' },
  { id: 's3', name: 'Свиток «Опознание»', qty: 2, rarity: 'UNCOMMON', w: 0, glyph: 'scroll' },
  { id: 's4', name: 'Рацион, дневной', qty: 11, rarity: 'COMMON', w: 1, glyph: 'square' },
  { id: 's5', name: 'Ключ из чёрной бронзы', qty: 1, rarity: 'RARE', w: 0.1, glyph: 'lock' },
  { id: 's6', name: 'Масло для факелов', qty: 3, rarity: 'COMMON', w: 0.5, glyph: 'flame' },
];

const EVENT_TYPES = {
  AMBUSH:    { ru: 'Засада',   c: '#b3461a', glyph: 'sword' },
  ENCOUNTER: { ru: 'Встреча',  c: '#b08d4e', glyph: 'helm' },
  STORY:     { ru: 'Сюжет',    c: '#5a8e94', glyph: 'scroll' },
  WEATHER:   { ru: 'Погода',   c: '#7fa8c4', glyph: 'tri' },
  CUSTOM:    { ru: 'Своё',     c: 'var(--ink-quiet)', glyph: 'diamond' },
};

const CAMP_EVENTS = [
  { id: 'e1', type: 'STORY', t: '19:40', text: 'Отряд разбил лагерь под нависшей скалой. Мирелла нашла старое кострище — кто-то стоял здесь до вас.' },
  { id: 'e2', type: 'WEATHER', t: '20:15', text: 'Мелкий дождь. Видимость дозорного снижена, ГМ даёт помеху на Внимательность.' },
  { id: 'e3', type: 'ENCOUNTER', t: '22:05', text: 'Бренн заметил огни в ложбине — двое разведчиков культа прошли мимо, не заметив лагерь.' },
];

const AMBUSH_EVENT = { id: 'e4', type: 'AMBUSH', t: '01:20', text: 'Из-под корней вылезли трое гарпунщиков-гноллов. Дозорный (Мирелла) провалила Внимательность 11 против скрытности 17.', combat: { id: 'enc-118', name: 'Засада гноллов у Серой ложбины' } };

Object.assign(window, {
  CAMP_STATUS, CAMP_TRANSITIONS, CAMP_CHAIN, CampStatusBadge, StatusTimeline,
  SAFETY, SafetyBadge, SafetySegment, GMHint, LiveDot, Sk,
  CampPortrait, MiniBar, REST_STATE, RestStateTag,
  CAMP_MEMBERS, WATCH_SLOTS, CAMP_ACTIVITIES, STORAGE_ITEMS,
  EVENT_TYPES, CAMP_EVENTS, AMBUSH_EVENT,
});
