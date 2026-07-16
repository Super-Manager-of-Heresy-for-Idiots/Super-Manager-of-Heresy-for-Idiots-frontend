/**
 * Генерация отображаемых строк заклинания из СТРУКТУРНЫХ полей — зеркало серверного
 * SpellDisplayStrings.java. Живое превью карточки в конструкторе показывает ровно ту строку,
 * которую бэкенд запишет в casting_time_raw / duration_raw, поэтому «что видит игрок» и «что
 * исполняет движок» совпадают по построению (принцип плана HB_UX). Строки — всегда по-русски
 * (как и хранимые в БД), независимо от языка интерфейса.
 */
import type { HomebrewSpellRequest } from '@/types';

/** Слаги-опции пикеров (совпадают со словарём ванильного импорта и серверными наборами). */
export const CASTING_ACTIONS = ['action', 'bonus-action', 'reaction', 'time'] as const;
export const CASTING_TIME_UNITS = ['minute', 'hour'] as const;
export const RANGE_TYPES = ['self', 'touch', 'distance', 'sight', 'unlimited'] as const;
export const DURATION_TYPES = ['instantaneous', 'timed', 'until-dispelled', 'special'] as const;
export const DURATION_UNITS = ['round', 'minute', 'hour', 'day'] as const;
export const AREA_SHAPES = ['SPHERE', 'CUBE', 'CONE', 'CYLINDER', 'LINE'] as const;
export const ZONE_TERRAINS = ['DIFFICULT'] as const;
export const ZONE_OBSCUREMENTS = ['LIGHT', 'HEAVY'] as const;

/** Русское склонение по числу: form1 (1), form2 (2–4), form5 (0, 5–20). */
function ruPlural(n: number, form1: string, form2: string, form5: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return form5;
  if (mod10 === 1) return form1;
  if (mod10 >= 2 && mod10 <= 4) return form2;
  return form5;
}

/** «10 минут», «1 час» — число + единица с правильным склонением. */
export function ruAmount(amount: number | undefined, unit: string | undefined): string {
  if (amount == null || !unit) return '';
  let word: string;
  switch (unit) {
    case 'round': word = ruPlural(amount, 'раунд', 'раунда', 'раундов'); break;
    case 'minute': word = ruPlural(amount, 'минута', 'минуты', 'минут'); break;
    case 'hour': word = ruPlural(amount, 'час', 'часа', 'часов'); break;
    case 'day': word = ruPlural(amount, 'день', 'дня', 'дней'); break;
    default: word = unit;
  }
  return `${amount} ${word}`;
}

/** Строка «Время сотворения» из casting_action_slug (+ amount/unit для долгого каста). */
export function castingTimeText(r: Pick<HomebrewSpellRequest,
  'castingActionSlug' | 'castingTimeAmount' | 'castingTimeUnit'>): string {
  switch (r.castingActionSlug) {
    case 'action': return '1 действие';
    case 'bonus-action': return '1 бонусное действие';
    case 'reaction': return '1 реакция';
    case 'time': return ruAmount(r.castingTimeAmount, r.castingTimeUnit) || '—';
    default: return '—';
  }
}

/** Строка «Дистанция» из range_type (+ distance для distance). */
export function rangeText(r: Pick<HomebrewSpellRequest, 'rangeType' | 'rangeDistance'>): string {
  switch (r.rangeType) {
    case 'self': return 'На себя';
    case 'touch': return 'Касание';
    case 'distance': return r.rangeDistance != null ? `${r.rangeDistance} футов` : '—';
    case 'sight': return 'В пределах видимости';
    case 'unlimited': return 'Не ограничено';
    default: return '—';
  }
}

/** Строка «Длительность» из duration_type (+ amount/unit + концентрация). */
export function durationText(r: Pick<HomebrewSpellRequest,
  'durationType' | 'durationAmount' | 'durationUnit' | 'concentration'>): string {
  const conc = r.concentration === true;
  switch (r.durationType) {
    case 'instantaneous': return 'Мгновенная';
    case 'until-dispelled': return 'Пока не рассеется';
    case 'special': return 'Особая';
    case 'timed': {
      const amount = ruAmount(r.durationAmount, r.durationUnit) || '—';
      return conc ? `Концентрация, до ${amount}` : amount;
    }
    default: return conc ? 'Концентрация' : '—';
  }
}

/** Строка «Область действия» из area_shape + size (+ признак зоны). */
export function areaText(r: Pick<HomebrewSpellRequest,
  'areaShape' | 'areaSizeFt' | 'zonePersists'>): string {
  if (!r.areaShape) return '';
  const shape: Record<string, string> = {
    SPHERE: 'Сфера', CUBE: 'Куб', CONE: 'Конус', CYLINDER: 'Цилиндр', LINE: 'Линия',
  };
  const dim: Record<string, string> = {
    SPHERE: 'радиус', CYLINDER: 'радиус', CUBE: 'ребро', CONE: 'длина', LINE: 'длина',
  };
  const size = r.areaSizeFt != null ? `, ${dim[r.areaShape] ?? 'размер'} ${r.areaSizeFt} футов` : '';
  const zone = r.zonePersists ? ' · зона остаётся' : '';
  return `${shape[r.areaShape] ?? r.areaShape}${size}${zone}`;
}
