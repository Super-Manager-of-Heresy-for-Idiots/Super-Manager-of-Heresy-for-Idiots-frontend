/**
 * Дайс-нотация: нормализация и проверка пользовательского ввода.
 * Игроки и мастера пишут кости и по-латински («8d6»), и по-русски («8к6», «8д6») —
 * бэкенд-движок формул принимает канонический вид NdM, поэтому перед отправкой ввод
 * приводится к нему. Валидация здесь дублирует серверную, чтобы ошибка показывалась
 * сразу у поля, а не после запроса.
 */

/** Приводит дайс-токены строки к канонической записи: «8к6» / «8 Д 6» → «8d6». Не трогает остальной текст формулы. */
export function normalizeDiceNotation(input: string): string {
  return input.replace(/(\d)\s*[dдк]\s*(?=\d)/gi, '$1d');
}

/**
 * Чистая дайс-формула NdM или dM (без бонусов и модификаторов) — именно такой формат
 * принимают поля «Кости урона» заклинания и умения предмета.
 */
export function isPureDiceFormula(input: string): boolean {
  return /^\d{0,4}d\d{1,4}$/i.test(normalizeDiceNotation(input.trim()).replace(/\s+/g, ''));
}

/** Реальные игровые кости для дайс-билдера (совпадает с серверными sanity-cap'ами). */
export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;

/** Собирает каноническую строку костей «NdM» из количества и граней (для дайс-билдера). */
export function buildDiceFormula(count: number, sides: number): string {
  return `${Math.max(1, Math.round(count))}d${sides}`;
}

/** Разбирает чистую строку «NdM» в {count, sides} для префилла билдера; null — если не разобрать. */
export function parsePureDice(input: string): { count: number; sides: number } | null {
  const m = normalizeDiceNotation(input.trim()).replace(/\s+/g, '').match(/^(\d{0,4})d(\d{1,4})$/i);
  if (!m) return null;
  return { count: m[1] === '' ? 1 : Number(m[1]), sides: Number(m[2]) };
}

/** Среднее значение броска NdM (для превью «среднее …»). */
export function diceAverage(count: number, sides: number): number {
  return Math.round(count * (sides + 1) / 2);
}

/** Максимум броска NdM (для превью «максимум …»). */
export function diceMax(count: number, sides: number): number {
  return count * sides;
}
