import type { Lang } from '@/i18n/translations';
import type { AppReleaseConfig } from '@/types';

const ROMAN_VALUES = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
] as const;

export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value <= 0) return String(value);

  let remaining = value;
  let result = '';
  for (const [arabic, roman] of ROMAN_VALUES) {
    while (remaining >= arabic) {
      result += roman;
      remaining -= arabic;
    }
  }
  return result;
}

export function cohortNumberFromVersion(version: string): string {
  const firstPart = version.split('.')[0] ?? '';
  const major = Number.parseInt(firstPart, 10);
  if (!Number.isFinite(major) || String(major) !== firstPart) return firstPart || '0';
  return toRomanNumeral(major);
}

export function currentYearRoman(now = new Date()): string {
  return toRomanNumeral(now.getFullYear());
}

export function releaseNameForLang(config: AppReleaseConfig, lang: Lang): string {
  return config.releaseName[lang] || config.releaseName.ru || config.releaseName.en;
}

export function formatCount(value: number | undefined, lang: Lang): string {
  if (typeof value !== 'number') return '...';
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(value);
}
