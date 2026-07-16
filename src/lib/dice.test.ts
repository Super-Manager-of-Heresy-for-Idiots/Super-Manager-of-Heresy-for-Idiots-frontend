import { describe, expect, it } from 'vitest';
import { isPureDiceFormula, normalizeDiceNotation } from './dice';

describe('normalizeDiceNotation', () => {
  it('переводит русскую нотацию в каноническую', () => {
    expect(normalizeDiceNotation('8к6')).toBe('8d6');
    expect(normalizeDiceNotation('8Д6')).toBe('8d6');
    expect(normalizeDiceNotation('8 д 6')).toBe('8d6');
  });

  it('не трогает переменные и остальной текст формулы', () => {
    expect(normalizeDiceNotation('2к8 + wis_mod')).toBe('2d8 + wis_mod');
    expect(normalizeDiceNotation('dex_mod + 1')).toBe('dex_mod + 1');
  });
});

describe('isPureDiceFormula', () => {
  it('принимает NdM в обеих нотациях и dM без количества', () => {
    expect(isPureDiceFormula('8d6')).toBe(true);
    expect(isPureDiceFormula('8к6')).toBe(true);
    expect(isPureDiceFormula('d20')).toBe(true);
    expect(isPureDiceFormula(' 2 д 8 ')).toBe(true);
  });

  it('отклоняет опечатки, бонусы и мусор', () => {
    expect(isPureDiceFormula('1000т1000')).toBe(false);
    expect(isPureDiceFormula('8d6+3')).toBe(false);
    expect(isPureDiceFormula('говно')).toBe(false);
    expect(isPureDiceFormula('8d')).toBe(false);
  });
});
