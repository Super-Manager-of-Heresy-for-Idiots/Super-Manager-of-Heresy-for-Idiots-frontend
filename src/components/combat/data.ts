/**
 * Combat / Loot prototype — demo data, constant maps and pure helpers.
 *
 * Ported from the static "Бой и Трофеи" prototype. These screens are visual
 * previews only (no API wiring), so the demo data below lives in the client.
 * UI chrome is translated through i18n; the demo content (character names,
 * item names, sample log lines) stays as literal data.
 */
import { rarityHue as rarityHueBase } from '@/components/items/RarityBadge';

/* ── Domain types ────────────────────────────────────────────── */

export type ParticipantKind = 'pc' | 'npc' | 'mon';

export interface Participant {
  id: string;
  name: string;
  kind: ParticipantKind;
  init: number;
  cur: number;
  max: number;
  temp: number;
  ac: number;
  conds: string[];
  hidden?: boolean;
}

export interface CombatAttack {
  id: string;
  name: string;
  bonus: number;
  dice: string;
  type: string;
}

export type LogType =
  | 'round'
  | 'turn'
  | 'attack'
  | 'cond'
  | 'down'
  | 'heal'
  | 'note'
  | 'roll';

export interface LogItem {
  type: LogType;
  n?: number;
  text?: string;
  detail?: string;
  time?: string;
}

export type RarityKey =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'VERY_RARE'
  | 'LEGENDARY';

export interface GenResult {
  id: string;
  name: string;
  rarity: RarityKey;
  qty?: number;
  src?: string;
  kind: 'item' | 'cur';
}

export interface LootRow {
  id: string;
  kind: 'item' | 'cur' | 'nest';
  content: string;
  weight: number;
  qmin: number;
  qmax: number;
  rarity: RarityKey;
  cr: string;
}

/* ── Condition map (labels resolved via i18n key) ────────────── */

export interface ConditionMeta {
  labelKey: string;
  glyph: string;
  c: string;
}

export const CONDITIONS: Record<string, ConditionMeta> = {
  POISONED: { labelKey: 'combat.cond.POISONED', glyph: 'flame', c: '#6f9a5e' },
  PRONE: { labelKey: 'combat.cond.PRONE', glyph: 'tri-inv', c: '#9a9078' },
  STUNNED: { labelKey: 'combat.cond.STUNNED', glyph: 'cir-dot', c: '#9a7ec0' },
  FRIGHTENED: { labelKey: 'combat.cond.FRIGHTENED', glyph: 'eye', c: '#c47ea8' },
  RESTRAINED: { labelKey: 'combat.cond.RESTRAINED', glyph: 'cross-pat', c: '#a39378' },
  BLESSED: { labelKey: 'combat.cond.BLESSED', glyph: 'sigil-2', c: '#d4b478' },
  BURNING: { labelKey: 'combat.cond.BURNING', glyph: 'flame', c: '#c06a32' },
  INVISIBLE: { labelKey: 'combat.cond.INVISIBLE', glyph: 'cir', c: '#7fa8c4' },
  BLINDED: { labelKey: 'combat.cond.BLINDED', glyph: 'x', c: '#968c75' },
  CONCENTR: { labelKey: 'combat.cond.CONCENTR', glyph: 'diamond', c: '#86c0c8' },
};

/* ── Encounter status map ────────────────────────────────────── */

export type EncStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED';

export interface EncStatusMeta {
  labelKey: string;
  c: string;
  glyph: string;
}

export const ENC_STATUS: Record<EncStatus, EncStatusMeta> = {
  DRAFT: { labelKey: 'combat.encStatus.DRAFT', c: 'var(--ink-quiet)', glyph: 'scroll' },
  ACTIVE: { labelKey: 'combat.encStatus.ACTIVE', c: '#d8896a', glyph: 'sword' },
  PAUSED: { labelKey: 'combat.encStatus.PAUSED', c: 'var(--gold-pale)', glyph: 'minus' },
  FINISHED: { labelKey: 'combat.encStatus.FINISHED', c: '#7a9866', glyph: 'check' },
};

/* ── Quest status map ────────────────────────────────────────── */

export type QuestStatus = 'ACTIVE' | 'DONE' | 'FAILED' | 'DRAFT';

export const QUEST_STATUS: Record<QuestStatus, { labelKey: string; c: string }> = {
  ACTIVE: { labelKey: 'combat.questStatus.ACTIVE', c: 'var(--gold-pale)' },
  DONE: { labelKey: 'combat.questStatus.DONE', c: '#7a9866' },
  FAILED: { labelKey: 'combat.questStatus.FAILED', c: '#d8896a' },
  DRAFT: { labelKey: 'combat.questStatus.DRAFT', c: 'var(--ink-quiet)' },
};

/* ── NPC attitude map ────────────────────────────────────────── */

export type Attitude = 'friendly' | 'neutral' | 'hostile';

export const ATTITUDE: Record<Attitude, { labelKey: string; c: string; glyph: string }> = {
  friendly: { labelKey: 'combat.attitude.friendly', c: '#7a9866', glyph: 'check' },
  neutral: { labelKey: 'combat.attitude.neutral', c: '#968c75', glyph: 'minus' },
  hostile: { labelKey: 'combat.attitude.hostile', c: '#d8896a', glyph: 'sword' },
};

/* ── Rarity helpers (reuse the project rarity palette) ───────── */

export const RARITY_ORDER: RarityKey[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'VERY_RARE',
  'LEGENDARY',
];

export const RARITY_GLYPH: Record<RarityKey, string> = {
  COMMON: 'square',
  UNCOMMON: 'tri',
  RARE: 'diamond',
  VERY_RARE: 'hex',
  LEGENDARY: 'sigil-2',
};

export const RARITY_LABEL_KEY: Record<RarityKey, string> = {
  COMMON: 'cmp.rarity.COMMON',
  UNCOMMON: 'cmp.rarity.UNCOMMON',
  RARE: 'cmp.rarity.RARE',
  VERY_RARE: 'cmp.rarity.VERY_RARE',
  LEGENDARY: 'cmp.rarity.LEGENDARY',
};

export function rarityHue(rarity: string): string {
  return rarityHueBase(rarity);
}

/* ── Health word (verbal HP status for the player view) ──────── */

export interface HealthWord {
  key: string;
  c: string;
  glyph: string;
}

export function healthWord(cur: number, max: number): HealthWord {
  if (cur <= 0) return { key: 'combat.health.down', c: 'var(--ink-faint)', glyph: 'x' };
  const r = cur / max;
  if (r <= 0.1) return { key: 'combat.health.dying', c: '#d8896a', glyph: 'tri-inv' };
  if (r <= 0.45) return { key: 'combat.health.bloodied', c: '#c06a32', glyph: 'minus' };
  if (r < 1) return { key: 'combat.health.wounded', c: '#b08d4e', glyph: 'minus' };
  return { key: 'combat.health.healthy', c: '#7a9866', glyph: 'check' };
}

/* ── Dice formula range preview (supports «3d6*10», «2d4+2») ─── */

export function diceRange(formula: string): { lo: number; hi: number } | null {
  const m = String(formula)
    .replace(/\s/g, '')
    .match(/^(\d+)[dк](\d+)(?:([+*])(\d+))?$/i);
  if (!m) return null;
  const [, n, d, op, k] = m;
  let lo = +n;
  let hi = +n * +d;
  if (op === '+') {
    lo += +k;
    hi += +k;
  }
  if (op === '*') {
    lo *= +k;
    hi *= +k;
  }
  return { lo, hi };
}

/* ════════════════════════════════════════════════════════════
   Demo data (sample content for the visual previews)
   ════════════════════════════════════════════════════════════ */

export const GM_INITIAL: Participant[] = [
  { id: 'kael', name: 'Каэлен Морн', kind: 'pc', init: 21, cur: 34, max: 42, temp: 0, ac: 18, conds: ['BLESSED'] },
  { id: 'gob1', name: 'Гоблин-разведчик · A', kind: 'mon', init: 18, cur: 7, max: 12, temp: 0, ac: 13, conds: ['POISONED'] },
  { id: 'mira', name: 'Мира Тэн', kind: 'pc', init: 16, cur: 12, max: 20, temp: 3, ac: 15, conds: [] },
  { id: 'ogr', name: 'Огр-крушитель', kind: 'mon', init: 12, cur: 38, max: 59, temp: 0, ac: 11, conds: ['PRONE'] },
  { id: 'tor', name: 'Торвальд Камнерук', kind: 'pc', init: 9, cur: 0, max: 31, temp: 0, ac: 16, conds: [] },
  { id: 'cult', name: 'Культист Полой Луны', kind: 'mon', init: 7, cur: 22, max: 22, temp: 0, ac: 12, conds: [], hidden: true },
  { id: 'aldr', name: 'Брат Алдрик', kind: 'npc', init: 5, cur: 18, max: 18, temp: 0, ac: 12, conds: [] },
];

export const GM_ATTACKS: CombatAttack[] = [
  { id: 'a1', name: 'Длинный меч', bonus: 7, dice: '1d8+4', type: 'рубящий' },
  { id: 'a2', name: 'Ручной арбалет', bonus: 5, dice: '1d10+2', type: 'колющий' },
  { id: 'a3', name: 'Карающая длань', bonus: 7, dice: '2d8', type: 'светлый' },
];

export const GM_INITIAL_LOG: LogItem[] = [
  { type: 'round', n: 1 },
  { type: 'turn', text: 'Бой начался. Первым действует Каэлен Морн.', time: '00:00' },
  { type: 'attack', text: 'Каэлен → Гоблин A: Длинный меч — попадание, 9 рубящего.', detail: 'к20: 14 + 7 = 21 против AC 13 · урон 1d8+4 → [5]+4 = 9', time: '00:24' },
  { type: 'cond', text: 'Мира накладывает «Отравлен» на Гоблина A (яд клинка).', time: '00:58' },
  { type: 'down', text: 'Торвальд Камнерук повержен ударом огра.', time: '01:33' },
  { type: 'round', n: 2 },
  { type: 'heal', text: 'Брат Алдрик лечит Миру на 6 ОЗ.', detail: 'лечение 2d4+2 → [3,1]+2 = 6', time: '02:10' },
];

export const PL_SELF = 'mira';

export const PL_ATTACKS: CombatAttack[] = [
  { id: 'p1', name: 'Парные кинжалы', bonus: 6, dice: '1d4+3', type: 'колющий' },
  { id: 'p2', name: 'Короткий лук', bonus: 6, dice: '1d6+3', type: 'колющий' },
];

export const PL_LOG: LogItem[] = [
  { type: 'round', n: 2 },
  { type: 'turn', text: 'Ход переходит к Каэлену Морну.', time: '02:01' },
  { type: 'attack', text: 'Каэлен → Гоблин A: попадание, цель тяжело ранена.', time: '02:24' },
  { type: 'note', text: 'Огр с рёвом ломает повозку, перегораживая тракт.', time: '02:40' },
  { type: 'heal', text: 'Брат Алдрик лечит вас на 6 ОЗ.', detail: 'лечение 2d4+2 → [3,1]+2 = 6', time: '02:55' },
];

/* ── Encounter builder ───────────────────────────────────────── */

export interface EbPartyMember {
  id: string;
  name: string;
  sub: string;
  hp: number;
  ac: number;
  ib: number;
}

export const EB_PARTY: EbPartyMember[] = [
  { id: 'kael', name: 'Каэлен Морн', sub: 'Паладин · ур. 5', hp: 42, ac: 18, ib: 1 },
  { id: 'mira', name: 'Мира Тэн', sub: 'Плутовка · ур. 5', hp: 20, ac: 15, ib: 4 },
  { id: 'tor', name: 'Торвальд Камнерук', sub: 'Жрец · ур. 4', hp: 31, ac: 16, ib: 0 },
  { id: 'ezra', name: 'Эзра Полынь', sub: 'Волшебница · ур. 5', hp: 24, ac: 12, ib: 2 },
];

export interface EbNpc {
  id: string;
  name: string;
  sub: string;
  ok: boolean;
}

export const EB_NPCS: EbNpc[] = [
  { id: 'aldr', name: 'Брат Алдрик', sub: 'фракция: Орден Пепла', ok: true },
  { id: 'vesna', name: 'Весна-травница', sub: 'без боевого статблока', ok: false },
  { id: 'grim', name: 'Грим Одноглазый', sub: 'фракция: Гильдия', ok: true },
];

export interface RosterRow {
  id: string;
  name: string;
  kind: ParticipantKind;
  hp: number;
  ac: number;
  ib: number;
  init: number | null;
  vis: boolean;
}

export const EB_ROSTER: RosterRow[] = [
  { id: 'r1', name: 'Каэлен Морн', kind: 'pc', hp: 42, ac: 18, ib: 1, init: 21, vis: true },
  { id: 'r2', name: 'Мира Тэн', kind: 'pc', hp: 20, ac: 15, ib: 4, init: null, vis: true },
  { id: 'r3', name: 'Эзра Полынь', kind: 'pc', hp: 24, ac: 12, ib: 2, init: 14, vis: true },
  { id: 'r4', name: 'Гоблин-разведчик ×3', kind: 'mon', hp: 12, ac: 13, ib: 2, init: null, vis: true },
  { id: 'r5', name: 'Культист Полой Луны', kind: 'mon', hp: 22, ac: 12, ib: 1, init: 7, vis: false },
];

/* ── Encounter list ──────────────────────────────────────────── */

export interface EncListItem {
  id: number;
  name: string;
  status: EncStatus;
  round?: number;
  kinds: ParticipantKind[];
  extra: number;
  meta: string;
}

export const ENC_LIST: EncListItem[] = [
  { id: 1, name: 'Засада на тракте', status: 'ACTIVE', round: 3, kinds: ['pc', 'pc', 'pc', 'mon', 'mon'], extra: 2, meta: 'идёт 14 минут · локация: Старый тракт' },
  { id: 2, name: 'Логово культистов', status: 'DRAFT', kinds: ['pc', 'pc', 'mon'], extra: 4, meta: 'изменён вчера · 7 участников' },
  { id: 3, name: 'Стычка у моста', status: 'PAUSED', round: 5, kinds: ['pc', 'pc', 'npc', 'mon'], extra: 0, meta: 'на паузе с 21:40 · раунд 5' },
  { id: 4, name: 'Волки Пустоши', status: 'FINISHED', kinds: ['pc', 'pc', 'pc', 'mon'], extra: 3, meta: 'завершён 2 дня назад · 6 раундов · победа' },
];

/* ── Loot table editor ───────────────────────────────────────── */

export const LOOT_INITIAL: LootRow[] = [
  { id: 'l1', kind: 'item', content: 'Зелье лечения', weight: 30, qmin: 1, qmax: 3, rarity: 'COMMON', cr: '0–4' },
  { id: 'l2', kind: 'cur', content: '3d6*10', weight: 25, qmin: 1, qmax: 1, rarity: 'COMMON', cr: '0–20' },
  { id: 'l3', kind: 'item', content: 'Меч из звёздной стали', weight: 8, qmin: 1, qmax: 1, rarity: 'RARE', cr: '5–10' },
  { id: 'l4', kind: 'nest', content: 'Таблица: Реликвии Ордена', weight: 12, qmin: 1, qmax: 2, rarity: 'VERY_RARE', cr: '8–15' },
  { id: 'l5', kind: 'item', content: 'Корона Полой Луны', weight: 2, qmin: 1, qmax: 1, rarity: 'LEGENDARY', cr: '15–20' },
  { id: 'l6', kind: 'item', content: 'Свиток огненного шара', weight: 14, qmin: 1, qmax: 2, rarity: 'UNCOMMON', cr: '3–8' },
];

/* ── Loot generator ──────────────────────────────────────────── */

export const GEN_RESULTS: GenResult[] = [
  { id: 'g1', name: 'Зелье лечения', rarity: 'COMMON', qty: 2, src: 'Сокровища тракта', kind: 'item' },
  { id: 'g2', name: '140 золотых монет', rarity: 'COMMON', kind: 'cur', src: '3d6*10 → [4,6,4]' },
  { id: 'g3', name: 'Свиток огненного шара', rarity: 'UNCOMMON', qty: 1, src: 'Сокровища тракта', kind: 'item' },
  { id: 'g4', name: 'Меч из звёздной стали', rarity: 'RARE', qty: 1, src: 'Реликвии Ордена', kind: 'item' },
  { id: 'g5', name: 'Корона Полой Луны', rarity: 'LEGENDARY', qty: 1, src: 'Реликвии Ордена', kind: 'item' },
];

/* ── Quest list / NPC list ───────────────────────────────────── */

export interface QuestRow {
  id: number;
  name: string;
  s: QuestStatus;
  vis: boolean;
  obj: string;
  upd: string;
  menu?: boolean;
}

export const QUESTS: QuestRow[] = [
  { id: 1, name: 'Пропавший караван', s: 'ACTIVE', vis: true, obj: '2/4', upd: 'сегодня', menu: true },
  { id: 2, name: 'Тени Ордена', s: 'ACTIVE', vis: false, obj: '0/3', upd: 'вчера' },
  { id: 3, name: 'Долг травницы', s: 'DONE', vis: true, obj: '3/3', upd: '12 мая' },
  { id: 4, name: 'Шёпот под складом', s: 'DRAFT', vis: false, obj: '—', upd: '10 мая' },
  { id: 5, name: 'Гонец не доехал', s: 'FAILED', vis: true, obj: '1/2', upd: '2 мая' },
];

export interface NpcGroup {
  faction: string;
  npcs: { n: string; a: Attitude; vis: boolean; stat: boolean }[];
}

export const NPC_GROUPS: NpcGroup[] = [
  {
    faction: 'Орден Пепла',
    npcs: [
      { n: 'Брат Алдрик', a: 'friendly', vis: true, stat: true },
      { n: 'Сестра Ивонна', a: 'neutral', vis: true, stat: false },
    ],
  },
  {
    faction: 'Гильдия',
    npcs: [
      { n: 'Грим Одноглазый', a: 'neutral', vis: true, stat: true },
      { n: 'Мастер весов Орен', a: 'friendly', vis: false, stat: false },
    ],
  },
  {
    faction: 'Культ Полой Луны',
    npcs: [{ n: 'Голос-под-полом', a: 'hostile', vis: false, stat: true }],
  },
];

export const LOOT_KIND_KEY: Record<'item' | 'cur' | 'nest', string> = {
  item: 'combat.lootKind.item',
  cur: 'combat.lootKind.cur',
  nest: 'combat.lootKind.nest',
};
