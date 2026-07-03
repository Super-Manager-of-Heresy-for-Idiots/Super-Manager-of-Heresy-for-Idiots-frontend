import { describe, expect, it } from 'vitest';
import {
  cohortNumberFromVersion,
  currentYearRoman,
  releaseNameForLang,
  toRomanNumeral,
} from './loginPageMeta';

describe('login page metadata formatting', () => {
  it('formats current calendar years as Roman numerals', () => {
    expect(currentYearRoman(new Date('2026-07-03T00:00:00Z'))).toBe('MMXXVI');
    expect(currentYearRoman(new Date('2027-01-01T00:00:00Z'))).toBe('MMXXVII');
  });

  it('keeps zero as a string when Roman numerals do not support it', () => {
    expect(toRomanNumeral(0)).toBe('0');
    expect(cohortNumberFromVersion('0.0.1')).toBe('0');
  });

  it('formats the first version number as a cohort number', () => {
    expect(cohortNumberFromVersion('1.0.0')).toBe('I');
    expect(cohortNumberFromVersion('7.12.3')).toBe('VII');
  });

  it('selects localized release names from config', () => {
    const config = {
      version: '0.0.1',
      releaseName: {
        ru: 'Хранилище Пепла и Латуни',
        en: 'Vault of Ash and Brass',
      },
    };

    expect(releaseNameForLang(config, 'ru')).toBe('Хранилище Пепла и Латуни');
    expect(releaseNameForLang(config, 'en')).toBe('Vault of Ash and Brass');
  });
});
