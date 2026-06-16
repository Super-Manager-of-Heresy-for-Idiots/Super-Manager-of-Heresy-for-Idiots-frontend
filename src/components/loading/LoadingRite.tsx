import { useEffect, useReducer, useRef, type CSSProperties } from 'react';
import s from './LoadingRite.module.css';

/* ============================================================
   LoadingRite — готический экран загрузки с тремя фазами,
   нарастающими по времени ожидания ответа бэкенда:
     • calm     — быстрая загрузка (спокойный обряд)
     • anomaly  — средняя загрузка (помехи, аномалия)
     • collapse — долгая загрузка (обвал системы, финал)
   Порт утверждённого прототипа (Loading Rite.dc.html) на React.
   Статика — в LoadingRite.module.css; здесь только реально
   вычисляемые значения (позиции/тайминги частиц, ширина бара).
   ============================================================ */

type Phase = 'calm' | 'anomaly' | 'collapse';
type Scenario = 'auto' | Phase;

interface Slice {
  top: number;
  bottom: number;
  anim: 'A' | 'B' | 'C' | 'D';
  dur: number;
  delay: number;
  hue: number;
  op: number;
}

interface Rune {
  id: number;
  kind: 'cursed' | 'sys';
  glyph: string;
  text: string;
  sub: string;
  x: number;
  y: number;
  depth: number;
  rot: number;
  o: number;
  color: string;
  glow: string;
  italic: boolean;
  weight: number;
  spacing: string;
  shadow: string;
  fdur: string;
  flick: string;
  base: number;
  spin: boolean;
  deadline: number;
}

interface BgSigil {
  id: number;
  glyph: string;
  x: number;
  y: number;
  size: number;
  rot: number;
  bo: string;
  color: string;
  life: number;
  spin: boolean;
  deadline: number;
}

interface Sim {
  dead: boolean;
  start: number;
  sc: Scenario;
  eid: number;
  nextScare: number;
  scareHideAt: number;
  collapseStart: number;
  shakeSeed: number;
  burnBlob: string;
  htPhase: 'del' | 'type' | null;
  htStr: string;
  htAt: number;
  htSrc: string;
  htIdx: number;
  openAt: number;
  progress: number;
  phase: Phase;
  corr: number;
  scareOn: boolean;
  scareSrc: string;
  scareKey: number;
  slices: Slice[];
  runes: Rune[];
  bgSigils: BgSigil[];
  headline: string;
  finaleOn: boolean;
  redirectOn: boolean;
  redirAt: number;
  redirected: boolean;
  openedOn: boolean;
}

const HEADLINE = 'Врата Архива';
const SUBTITLE = 'Не вглядывайся слишком долго в то, что глядит в ответ.';
const PATH_TEXT = '/rite/awakening';

const IMGS = Array.from({ length: 9 }, (_, i) => `/loading-rite/scare-${i + 1}.png`);

const LOAD_MSGS = [
  'ИНИЦИАЛИЗАЦИЯ ORDO.OS…',
  'МОНТИРОВАНИЕ АРХИВА…',
  'ПРОВЕРКА САНКТ-ПРОТОКОЛА…',
  'СВЯЗЫВАНИЕ ДОКТРИН…',
  'КАЛИБРОВКА СИГИЛ…',
  'ЗАГРУЗКА ЯДРА АРКАНУМ…',
  'СВЕРКА ПРИНЕСЁННЫХ КЛЯТВ…',
  'ПЕЧАТЬ КРОВИ…',
];

const BREACH_MSGS = [
  '// ПОТЕРЯ КОНТРОЛЯ',
  '// НЕСАНКЦ. ДОСТУП',
  '// РЕАЛЬНОСТЬ РАССИНХР.',
  '// ЯДРО ПАНИКА',
  '// ВТОРЖЕНИЕ В САНКТУМ',
  '// СИГИЛ ПОВРЕЖДЁН',
];

const RUNE_CHARS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞᛯᛦᛥ';

const BG_GLYPHS = ['☉', '☿', '♄', '♃', '♆', '⛤', '⛧', '⸸', '✶', '❉', '⍟', '𖤐', '⌖', '⟁', '♅', '☽', '⚸', '✠', '☩', '♇'];

const SYS_GLYPHS = ['⊗', '⌖', '⟁', '✠', '☩', '⏃', '⫛', '✜', '◈', '⎔', '⌬', '⊟', '⊞', '◇'];

const SYS_TEXT = [
  'SIGILLVM·FRACTVM', 'ANIMA·NON·INVENTA', 'PORTA·VIOLATA', 'VERBVM·INTERDICTVM', 'NOMEN·IGNOTVM',
  'SANCTVM·∅', 'HEX·OVERFLOW·0x', 'ORATIO·NVLLA', 'REALITAS·DESYNC', 'DAEMON·LIBER', 'MANVS·ALIENA',
  'CVSTOS·MORTVVS', 'PROTOCOL·DAMNATVM', 'FIDES·CORRVPTA', 'BVFFER·SANCTVS·FVLL', 'LIMEN·APERTVM',
  'TRACE·0xDEAD·∅', 'SOVL·POINTER·NVLL',
];

const CURSED_GLYPHS = ['𖤐', '⸸', '⛧', '☉', '⟁', '♅', '⍟', '𓂀', '☿', '⏃', '†', '‡', '⫩', '☥'];

const CURSED_TEXT = [
  'THE KEY AND THE GATE', 'IÄ IÄ', 'IT SEES YOU', 'THAT IS NOT DEAD', 'THE GATE IS OPEN',
  'YOUR SOVL IS INDEXED', 'HE COMES', 'NON·EVCLIDEAN ACCESS', 'THE WATCHER WAKES',
  'FLESH INTERFACE READY', 'NO NAME REMAINS', 'YOG·SOTHOTH KNOWS', 'WE ARE INSIDE NOW',
  'THE OLD CODE WAKES', 'I WEAR YOUR LOGIN',
];

const EMBERS = [
  { left: '24%', bottom: '12%', color: '#c79a55', glow: '6px', dur: '8s', delay: '0s' },
  { left: '48%', bottom: '9%', color: '#b8732f', glow: '5px', dur: '10s', delay: '2.4s' },
  { left: '70%', bottom: '13%', color: '#c79a55', glow: '5px', dur: '9s', delay: '4.1s' },
  { left: '84%', bottom: '10%', color: '#a85f2a', glow: '5px', dur: '11s', delay: '1.2s' },
];

const r = (a: number, b: number) => a + Math.random() * (b - a);
const ri = (a: number, b: number) => Math.floor(r(a, b));
const pick = <T,>(a: T[]): T => a[ri(0, a.length)];
const hex = (n: number) => {
  let out = '';
  for (let i = 0; i < n; i++) out += '0123456789ABCDEF'[ri(0, 16)];
  return out;
};
const runeSeq = (n: number) => {
  let out = '';
  for (let i = 0; i < n; i++) out += RUNE_CHARS[ri(0, RUNE_CHARS.length)];
  return out;
};
const zalgo = (str: string, n: number) => {
  const up = '̀́̂̃̄̆̈̊̋̒̓̔̽͐͗';
  const dn = '̖̗̘̙̜̝̞̠̤̥̦̩̮̱̲';
  let out = '';
  for (const ch of str) {
    out += ch;
    if (ch === ' ' || ch === '·') continue;
    const k = ri(0, n + 1);
    for (let i = 0; i < k; i++) out += (Math.random() < 0.5 ? up : dn)[ri(0, 15)];
  }
  return out;
};

const makeSlices = (): Slice[] => {
  const vary: Slice['anim'][] = ['A', 'B', 'C', 'D'];
  const out: Slice[] = [];
  for (let i = 0; i < 4; i++) {
    const top = ri(0, 78);
    const h = ri(9, 26);
    const bottom = Math.max(0, 100 - top - h);
    out.push({ top, bottom, anim: vary[i % 4], dur: ri(70, 190), delay: ri(0, 140), hue: ri(-45, 45), op: r(0.5, 0.9) });
  }
  return out;
};

function makeInitialSim(): Sim {
  return {
    dead: false, start: 0, sc: 'auto', eid: 0,
    nextScare: 0, scareHideAt: 0, collapseStart: 0, shakeSeed: 0, burnBlob: '',
    htPhase: null, htStr: '', htAt: 0, htSrc: '', htIdx: 0, openAt: 0,
    progress: 0, phase: 'calm', corr: 0,
    scareOn: false, scareSrc: '', scareKey: 0, slices: [],
    runes: [], bgSigils: [], headline: HEADLINE,
    finaleOn: false, redirectOn: false, redirAt: 0, redirected: false, openedOn: false,
  };
}

function resetSim(R: Sim, now: number) {
  R.start = now;
  R.collapseStart = 0;
  R.nextScare = 0;
  R.scareHideAt = 0;
  R.htPhase = null;
  R.progress = 0;
  R.phase = 'calm';
  R.corr = 0;
  R.scareOn = false;
  R.runes = [];
  R.bgSigils = [];
  R.headline = HEADLINE;
  R.finaleOn = false;
  R.redirectOn = false;
  R.redirAt = 0;
  R.openedOn = false;
}

function phaseInfo(sc: Scenario, anomalyAt: number, collapseAt: number, el: number): { phase: Phase; corr: number } {
  const a = typeof anomalyAt === 'number' ? anomalyAt : 4;
  let c = typeof collapseAt === 'number' ? collapseAt : 13;
  if (c <= a) c = a + 6;
  if (sc === 'calm') return { phase: 'calm', corr: 0 };
  if (sc === 'anomaly') return { phase: 'anomaly', corr: 0.62 };
  if (sc === 'collapse') return { phase: 'collapse', corr: 1 };
  if (el < a) return { phase: 'calm', corr: 0 };
  if (el < c) return { phase: 'anomaly', corr: Math.min(1, (el - a) / (c - a)) };
  return { phase: 'collapse', corr: 1 };
}

function spawnRune(R: Sim, now: number, phase: Phase, corr: number, cap: number) {
  R.eid++;
  const cursed = phase === 'collapse';
  const depth = ri(-280, 260);
  const front = depth > 40;
  let glyph: string;
  let text: string;
  let color: string;
  let glow: string;
  let rot: number;
  let italic: boolean;
  let weight: number;
  let spacing: string;
  let sub: string;
  let shadow: string;
  if (cursed) {
    glyph = pick(CURSED_GLYPHS);
    text = zalgo(pick(CURSED_TEXT), ri(1, 3));
    color = Math.random() < 0.5 ? '#c8584e' : '#b48ad8';
    glow = color === '#c8584e' ? 'rgba(255,60,45,.55)' : 'rgba(170,100,255,.55)';
    rot = r(-16, 16);
    italic = true;
    weight = 600;
    spacing = '.05em';
    sub = zalgo('0x' + hex(4), 2);
    shadow = '-1px 0 rgba(255,0,80,.6), 1px 0 rgba(0,220,255,.5)';
  } else {
    glyph = pick(SYS_GLYPHS);
    text = pick(SYS_TEXT);
    color = Math.random() < 0.5 ? '#d8c8a4' : '#9fb6c4';
    glow = 'rgba(170,190,210,.4)';
    rot = 0;
    italic = false;
    weight = 500;
    spacing = '.2em';
    sub = '0x' + hex(4) + '·' + runeSeq(ri(3, 6));
    shadow = 'none';
  }
  const o = (front ? r(0.34, 0.6) : r(0.12, 0.32)) * (0.62 + corr * 0.55);
  const rune: Rune = {
    id: R.eid, kind: cursed ? 'cursed' : 'sys', glyph, text, sub,
    x: r(6, 94), y: r(8, 90), depth, rot,
    o: Math.min(0.68, o), color, glow, italic, weight, spacing, shadow,
    fdur: r(4, 8).toFixed(2), flick: r(2.4, 4.8).toFixed(2),
    base: r(13, 21) * (0.82 + ((depth + 280) / 540) * 0.78),
    spin: cursed ? Math.random() < 0.55 : Math.random() < 0.25,
    deadline: now + (cursed ? ri(900, 2200) : ri(1700, 4400)),
  };
  let arr = R.runes.concat(rune);
  if (arr.length > cap) arr = arr.slice(arr.length - cap);
  R.runes = arr;
}

function spawnBgSigil(R: Sim, now: number, phase: Phase) {
  R.eid++;
  const cursed = phase === 'collapse';
  const sig: BgSigil = {
    id: R.eid, glyph: pick(BG_GLYPHS),
    x: r(8, 92), y: r(12, 86),
    size: ri(90, 260), rot: ri(-30, 30),
    bo: (cursed ? r(0.1, 0.22) : r(0.05, 0.13)).toFixed(3),
    color: cursed ? (Math.random() < 0.5 ? '#7d2f2a' : '#5e3f86') : 'rgba(150,124,72,1)',
    life: r(2.6, 5.2),
    spin: Math.random() < 0.5,
    deadline: now + ri(2600, 5200),
  };
  let arr = R.bgSigils.concat(sig);
  if (arr.length > 6) arr = arr.slice(arr.length - 6);
  R.bgSigils = arr;
}

const vstyle = (o: Record<string, string | number>): CSSProperties => o as CSSProperties;

export interface LoadingRiteProps {
  /** auto — фаза растёт со временем ожидания; остальные — принудительно */
  scenario?: Scenario;
  /** секунда, на которой calm переходит в anomaly */
  anomalyAt?: number;
  /** секунда, на которой anomaly переходит в collapse */
  collapseAt?: number;
  title?: string;
  accentColor?: string;
  subtitle?: string;
  /** fixed — полноэкранный оверлей; inline — заполняет область контента */
  variant?: 'inline' | 'fixed';
  /** запустить анимацию исчезновения */
  fadingOut?: boolean;
  /** вызывается после финала обвала — принудительный редирект */
  onRedirect?: () => void;
  /** куда уводит редирект (для подписи на экране) */
  redirectUrl?: string;
}

export function LoadingRite({
  scenario = 'auto',
  anomalyAt = 4,
  collapseAt = 13,
  title = 'ORDO ARCANUM',
  accentColor = '#b89968',
  subtitle = SUBTITLE,
  variant = 'inline',
  fadingOut = false,
  onRedirect,
  redirectUrl = '/campaigns',
}: LoadingRiteProps) {
  const ref = useRef<Sim>();
  if (!ref.current) ref.current = makeInitialSim();
  const [, bump] = useReducer((c: number) => c + 1, 0);
  const frameRef = useRef<() => void>(() => {});

  frameRef.current = () => {
    const R = ref.current!;
    if (R.dead) return;
    const now = performance.now();
    const sc: Scenario = scenario || 'auto';
    if (sc !== R.sc) {
      R.sc = sc;
      resetSim(R, now);
      bump();
      return;
    }
    const el = (now - R.start) / 1000;
    const { phase, corr } = phaseInfo(sc, anomalyAt, collapseAt, el);

    // ---- progress ----
    let p = R.progress;
    if (phase === 'calm') {
      if (Math.random() > 0.08) p = Math.min(100, p + r(0.9, 2.4));
      if (p >= 100 && sc === 'calm' && !R.openedOn) {
        R.openedOn = true;
        R.openAt = now;
      }
    } else if (phase === 'anomaly') {
      const cap = 92 - corr * 26;
      if (Math.random() > 0.34) p = Math.min(cap, p + r(0.2, 1.1));
      if (Math.random() < 0.05 * corr) p = Math.max(0, p - r(1, 5));
    } else {
      p = Math.random() < 0.5 ? r(8, 96) : p;
    }
    R.progress = p;
    R.phase = phase;
    R.corr = corr;

    // ---- calm success loop (only when scenario forced to calm) ----
    if (R.openedOn) {
      if (now - R.openAt > 2100) resetSim(R, now);
      bump();
      return;
    }

    // ---- cull expired particles ----
    if (R.runes.length) {
      const live = R.runes.filter((x) => x.deadline > now);
      if (live.length !== R.runes.length) R.runes = live;
    }
    if (R.bgSigils.length) {
      const live = R.bgSigils.filter((x) => x.deadline > now);
      if (live.length !== R.bgSigils.length) R.bgSigils = live;
    }

    if (phase === 'calm') {
      if (R.scareOn) R.scareOn = false;
      bump();
      return;
    }

    // ---- ambient background sigils ----
    if (Math.random() < (phase === 'collapse' ? 0.1 : 0.045)) spawnBgSigil(R, now, phase);

    // ---- ambient runes ----
    const cap = phase === 'collapse' ? 20 : Math.round(4 + corr * 9);
    if (Math.random() < (phase === 'collapse' ? 0.55 : 0.03 + corr * 0.1)) spawnRune(R, now, phase, corr, cap);

    // ---- corrupted-signal scheduling (nervous strobe) ----
    if (R.scareOn && now >= R.scareHideAt) {
      R.scareOn = false;
      R.nextScare = now + (phase === 'collapse' ? ri(40, 150) : ri(420, 1500) * (1 - corr * 0.55));
    }
    if (!R.scareOn && now >= R.nextScare) {
      const beat = phase === 'collapse' && now - R.collapseStart < 1800;
      const show = beat ? false : phase === 'collapse' ? Math.random() < 0.93 : Math.random() < 0.34 + corr * 0.5;
      if (show) {
        const dur = phase === 'collapse' ? ri(70, 190) : ri(150, 560);
        R.scareOn = true;
        R.scareSrc = pick(IMGS);
        R.scareKey += 1;
        R.slices = makeSlices();
        R.scareHideAt = now + dur;
        const burst = phase === 'collapse' ? ri(2, 4) : Math.random() < 0.7 ? ri(1, 3) : 0;
        for (let i = 0; i < burst; i++) spawnRune(R, now, phase, corr, cap);
        R.shakeSeed = (R.shakeSeed + 1) % 2;
      } else {
        R.nextScare = now + ri(120, 420);
      }
    }

    // ---- collapse sequence (+ possessed headline rewrite) ----
    if (phase === 'collapse') {
      if (!R.collapseStart) R.collapseStart = now;
      if (!R.htPhase) {
        R.htPhase = 'del';
        R.htStr = HEADLINE;
        R.htAt = now;
        R.htSrc = 'Ключ Врата ';
        R.htIdx = 0;
        R.headline = R.htStr;
      }
      const step = R.htPhase === 'del' ? 55 : 90;
      if (now - R.htAt > step) {
        R.htAt = now;
        if (R.htPhase === 'del') {
          if (R.htStr.length > 6) R.htStr = R.htStr.slice(0, -1);
          else R.htPhase = 'type';
        } else {
          R.htStr += R.htSrc[R.htIdx % R.htSrc.length];
          R.htIdx++;
          if (R.htStr.length > 24) R.htStr = R.htStr.slice(R.htStr.length - 24);
        }
        R.headline = R.htStr;
      }
      const t = now - R.collapseStart;
      if (t > 3700 && !R.finaleOn) R.finaleOn = true;
      // принудительный редирект после финала (только при заданном onRedirect)
      if (onRedirect && !R.redirected) {
        if (t > 5500 && !R.redirectOn) {
          R.redirectOn = true;
          R.redirAt = now;
        }
        if (R.redirectOn && now - R.redirAt > 1800) {
          R.redirected = true;
          onRedirect();
          resetSim(R, now);
        }
      }
    } else if (R.collapseStart) {
      R.collapseStart = 0;
      R.htPhase = null;
    }

    bump();
  };

  useEffect(() => {
    const R = ref.current!;
    R.dead = false;
    R.start = performance.now();
    R.burnBlob = runeSeq(420);
    IMGS.forEach((src) => {
      const im = new Image();
      im.src = src;
    });
    const id = window.setInterval(() => frameRef.current(), 55);
    return () => {
      R.dead = true;
      window.clearInterval(id);
    };
  }, []);

  const R = ref.current;
  const p = R.progress;
  const phase = R.phase;
  const corr = R.corr;
  const breach = phase !== 'calm' && (R.scareOn || phase === 'collapse');
  const sceneOn = phase !== 'calm';

  // ---- center UI dim under corruption ----
  const uiStyle = vstyle({
    opacity: phase === 'collapse' ? 0.94 : 1 - corr * 0.34,
    filter: phase !== 'collapse' && corr > 0.1 ? `saturate(${1 - corr * 0.4}) brightness(${1 - corr * 0.18})` : 'none',
  });
  const darkStyle = vstyle({ background: `rgba(2,0,0,${corr * 0.5})` });

  // ---- progress bar / status ----
  const barFillStyle = vstyle({
    width: `${p}%`,
    background: `linear-gradient(90deg, rgba(184,153,104,.2), ${breach ? '#ff4438' : accentColor})`,
    boxShadow: `0 0 12px ${breach ? 'rgba(255,60,50,.7)' : accentColor + 'aa'}, 0 0 3px ${breach ? '#ff4438' : accentColor}`,
  });
  const idx = Math.min(LOAD_MSGS.length - 1, Math.floor(p / (100 / LOAD_MSGS.length)));
  const statusText =
    phase === 'collapse' ? 'ОБВАЛ СИСТЕМЫ // ABORT' : breach ? pick(BREACH_MSGS) : LOAD_MSGS[idx];
  const statusStyle = vstyle({
    color: breach ? '#ff4438' : '#8a7a60',
    textShadow: breach ? '0 0 8px rgba(255,60,50,.6)' : 'none',
  });
  const pctStyle = vstyle({ color: breach ? '#ff4438' : '#c9a868' });
  const percentText = breach && Math.random() < 0.4 ? '0x' + hex(2) : `${Math.floor(p)}%`;

  const headline = phase === 'collapse' ? R.headline + '▍' : HEADLINE;

  // ---- corrupted signal frame ----
  const redGlow = 0.25 + corr * 0.5;
  const frameStyle = vstyle({
    boxShadow: `0 0 0 1px rgba(201,168,104,.16), 0 0 80px 12px rgba(255,40,30,${redGlow}), inset 0 0 90px 18px rgba(0,0,0,.5)`,
  });
  const imgUrl = R.scareSrc ? `url("${R.scareSrc}")` : 'none';

  const finaleSub = 'ERROR 666 · ' + runeSeq(6) + ' · SANCTIFIED PROTOCOL FAILED';
  const redirectText = 'ВОЗВРАТ В САНКТУМ · REDIRECTING → ' + redirectUrl;
  const redirectPct = R.redirAt ? Math.min(1, (performance.now() - R.redirAt) / 1800) : 0;

  const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ');

  const inner = (
    <div className={cx(s.root, variant === 'fixed' && s.fixed, fadingOut && s.fadeOut)}>
      {/* candle glow */}
      <div className={s.candle} />

      {/* embers */}
      <div className={s.embers}>
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className={s.ember}
            style={vstyle({
              left: e.left,
              bottom: e.bottom,
              background: e.color,
              boxShadow: `0 0 ${e.glow} ${e.color}`,
              '--dur': e.dur,
              '--delay': e.delay,
            })}
          />
        ))}
      </div>

      {/* ambient background sigils */}
      {R.bgSigils.map((b) => (
        <div
          key={b.id}
          className={s.sigOuter}
          style={vstyle({ left: `${b.x}%`, top: `${b.y}%`, transform: `translate(-50%,-50%) rotate(${b.rot}deg)` })}
        >
          <div
            className={cx(s.sigInner, b.spin && s.spin)}
            style={vstyle({
              fontSize: `${b.size}px`,
              color: b.color,
              textShadow: phase === 'collapse' ? '0 0 26px rgba(255,40,30,.4)' : '0 0 24px rgba(201,168,104,.35)',
              '--bo': b.bo,
              '--br': `${b.rot}deg`,
              '--life': `${b.life}s`,
              '--spindur': `${(b.life * 4).toFixed(0)}s`,
            })}
          >
            {b.glyph}
          </div>
        </div>
      ))}

      {/* center content */}
      <div className={s.uiWrap} style={uiStyle}>
        <div className={s.crest}>
          <div className={s.crestGlow} />
          <svg viewBox="0 0 100 100" className={cx(s.crestSvg, s.crestSpin)}>
            <circle cx="50" cy="50" r="47" fill="none" stroke="#b8985d" strokeWidth="0.6" opacity="0.8" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="#7a5f33" strokeWidth="0.4" opacity="0.6" />
            <g stroke="#b8985d" strokeWidth="0.7" opacity="0.7">
              <line x1="50" y1="3" x2="50" y2="9" />
              <line x1="50" y1="91" x2="50" y2="97" />
              <line x1="3" y1="50" x2="9" y2="50" />
              <line x1="91" y1="50" x2="97" y2="50" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="84" y1="16" x2="80" y2="20" />
              <line x1="16" y1="84" x2="20" y2="80" />
              <line x1="84" y1="84" x2="80" y2="80" />
            </g>
          </svg>
          <svg viewBox="0 0 100 100" className={s.crestSpinR2}>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#9c7c45" strokeWidth="0.5" strokeDasharray="1.5 4" opacity="0.65" />
          </svg>
          <svg viewBox="0 0 100 100" className={s.crestSvg}>
            <g stroke="#c9a868" strokeWidth="0.9" opacity="0.92">
              <line x1="50" y1="20" x2="50" y2="80" />
              <line x1="20" y1="50" x2="80" y2="50" />
              <line x1="29" y1="29" x2="71" y2="71" />
              <line x1="71" y1="29" x2="29" y2="71" />
            </g>
            <circle cx="50" cy="50" r="13" fill="#0c0805" stroke="#c9a868" strokeWidth="1" />
            <circle cx="50" cy="50" r="3.4" fill="#c9a868" />
            <circle cx="50" cy="50" r="6.6" fill="none" stroke="#c9a868" strokeWidth="0.6" opacity="0.7" />
          </svg>
        </div>

        <div className={s.title}>{title}</div>
        <h1 className={s.headline}>{headline}</h1>
        <p className={s.subtitle}>{subtitle}</p>

        <div className={s.barWrap}>
          <div className={s.barTrack}>
            <div className={s.barFill} style={barFillStyle} />
            <div className={s.barGlint} />
          </div>
          <div className={s.statusRow}>
            <span className={s.status} style={statusStyle}>{statusText}</span>
            <span className={s.pct} style={pctStyle}>{percentText}</span>
          </div>
        </div>
      </div>

      {/* bottom path */}
      <div className={s.path}>{PATH_TEXT}</div>

      {/* base scanlines + vignette */}
      <div className={s.scan} />
      <div className={s.vignette} />

      {/* corruption darkening */}
      <div className={s.dark} style={darkStyle} />

      {/* SCENE: 3D corrupted space */}
      {sceneOn && (
        <div className={cx(s.scene, breach && (R.shakeSeed % 2 === 0 ? s.shake0 : s.shake1))}>
          {R.scareOn && (
            <div className={s.frame} style={frameStyle}>
              <div className={cx(s.cover, s.imgBase)} style={{ backgroundImage: imgUrl }} />
              <div className={cx(s.cover, s.imgRgbL)} style={{ backgroundImage: imgUrl }} />
              <div className={cx(s.cover, s.imgRgbR)} style={{ backgroundImage: imgUrl }} />
              {R.slices.map((sl, i) => (
                <div
                  key={i}
                  className={cx(s.cover, s.slice, s[`slice${sl.anim}`])}
                  style={vstyle({
                    backgroundImage: imgUrl,
                    clipPath: `inset(${sl.top}% 0 ${sl.bottom}% 0)`,
                    filter: `contrast(1.5) brightness(1.15) saturate(.8) hue-rotate(${sl.hue}deg)`,
                    opacity: sl.op,
                    '--dur': `${sl.dur}ms`,
                    '--delay': `${sl.delay}ms`,
                  })}
                />
              ))}
              <div className={s.sigBurnWrap}>
                <div className={s.sigBurnText}>{R.burnBlob}</div>
              </div>
              <div className={s.vScan} />
              <div className={s.tear} />
              <div className={s.frameVignette} />
              <div className={s.frameEdge} />
              <div className={s.frameEdge2} />
              <div className={cx(s.corner, s.cornerTL)}>✠</div>
              <div className={cx(s.corner, s.cornerBR)}>✠</div>
            </div>
          )}

          {R.runes.map((rune) => (
            <div
              key={rune.id}
              className={s.runeOuter}
              style={vstyle({
                left: `${rune.x}%`,
                top: `${rune.y}%`,
                transform: `translate(-50%,-50%) translateZ(${rune.depth}px) rotate(${rune.rot}deg)`,
                zIndex: rune.depth > 40 ? 60 : 48,
              })}
            >
              <div
                className={cx(s.runeInner, rune.kind === 'cursed' && s.cursed)}
                style={vstyle({
                  opacity: rune.o,
                  color: rune.color,
                  filter: `drop-shadow(0 0 7px ${rune.glow})`,
                  '--o': rune.o,
                  '--fdur': `${rune.fdur}s`,
                  '--flick': `${rune.flick}s`,
                })}
              >
                <div
                  className={cx(
                    s.runeGlyph,
                    rune.spin && (rune.kind === 'cursed' ? s.runeGlyphSpinR : s.runeGlyphSpin),
                  )}
                  style={{ fontSize: `${(rune.base * 1.9).toFixed(0)}px` }}
                >
                  {rune.glyph}
                </div>
                <div
                  className={s.runeText}
                  style={{
                    fontFamily: rune.kind === 'cursed' ? 'var(--font-serif)' : 'var(--font-mono)',
                    fontStyle: rune.italic ? 'italic' : 'normal',
                    fontWeight: rune.weight,
                    fontSize: `${rune.base.toFixed(0)}px`,
                    letterSpacing: rune.spacing,
                    textShadow: rune.shadow,
                  }}
                >
                  {rune.text}
                </div>
                <div className={s.runeSub} style={{ fontSize: `${(rune.base * 0.52).toFixed(0)}px` }}>
                  {rune.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALM SUCCESS (fast load, only when scenario forced to calm) */}
      {R.openedOn && (
        <div className={s.success}>
          <div className={s.successMark}>✶</div>
          <div className={s.successTitle}>Врата открыты</div>
          <div className={s.successSub}>GATE OPENED · ENTERING ARCANVM</div>
        </div>
      )}

      {/* FINAL COLLAPSE */}
      {R.finaleOn && (
        <div className={s.finale}>
          <div className={s.finaleRing1} />
          <div className={s.finaleRing2} />
          <div className={s.finaleTag}>ORDO.OS // SANCTVM·FRACTVM</div>
          <div className={s.finaleRow}>
            <div className={s.finaleGlyphL}>⛧</div>
            <div className={s.finaleText}>THE APPLICATION IS NOT YOURS ANYMORE</div>
            <div className={s.finaleGlyphR}>⛧</div>
          </div>
          <div className={s.finaleSub}>{finaleSub}</div>
          {R.redirectOn && (
            <div className={s.redirectWrap}>
              <div className={s.redirectText}>{redirectText}</div>
              <div className={s.redirectTrack}>
                <div className={s.redirectBar} style={{ width: `${redirectPct * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return variant === 'fixed' ? inner : <div className={s.host}>{inner}</div>;
}

export default LoadingRite;
