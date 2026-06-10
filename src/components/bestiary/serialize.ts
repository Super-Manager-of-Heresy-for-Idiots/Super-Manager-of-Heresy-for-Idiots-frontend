import type {
  AbilityEnum,
  CreatureSize,
  DamageType,
  MonsterRequest,
  MonsterResponse,
} from '@/types';

// ============================================================
// Form state <-> MonsterRequest / MonsterResponse converters.
// Numeric inputs are kept as strings while editing; coerced on submit.
// ============================================================

let UID = 1;
export const rowUid = () => ++UID;

export interface SpeedFormRow { _id: number; movementTypeId: string; ft: string; hover: boolean; }
export interface SenseFormRow { _id: number; senseTypeId: string; ft: string; }
export interface SaveFormRow { _id: number; ability: AbilityEnum; bonus: string; }
export interface SkillFormRow { _id: number; proficiencySkillId: string; bonus: string; }
export interface DamageNoteFormRow { _id: number; damageType: string; note: string; }
export interface GearFormRow { _id: number; itemId: string; qty: string; }
export interface FeatureDamageFormRow { _id: number; sortOrder: string; average: string; dice: string; damageType: string; note: string; }
export interface FeatureFormRow {
  _id: number;
  section: string;
  sortOrder: string;
  nameRusloc: string;
  nameEngloc: string;
  kind: string;
  rechargeMin: string;
  rechargeMax: string;
  descriptionRusloc: string;
  descriptionEngloc: string;
  attackType: string;
  attackBonus: string;
  reachFt: string;
  rangeFt: string;
  rangeLongFt: string;
  saveAbility: string;
  saveDc: string;
  damages: FeatureDamageFormRow[];
}

export interface MonsterFormState {
  nameRusloc: string;
  nameEngloc: string;
  slug: string;
  alignmentId: string;
  size: CreatureSize | '';
  sizeSecondary: string;
  isSwarm: boolean;
  swarmSize: string;
  crRating: string;
  crValue: string;
  xpBase: string;
  xpLair: string;
  proficiencyBonus: string;
  isActive: boolean;
  isVisibleToPlayers: boolean;
  armorClass: string;
  armorClassText: string;
  initiativeBonus: string;
  initiativeScore: string;
  hpAverage: string;
  hpDiceCount: string;
  hpDiceSides: string;
  hpDiceModifier: string;
  hpFormula: string;
  strScore: string;
  dexScore: string;
  conScore: string;
  intScore: string;
  wisScore: string;
  chaScore: string;
  passivePerception: string;
  telepathyFt: string;
  creatureTypeIds: string[];
  languageIds: string[];
  conditionImmunityIds: string[];
  habitatIds: string[];
  treasureTagIds: string[];
  sourceIds: string[];
  speeds: SpeedFormRow[];
  senses: SenseFormRow[];
  savingThrows: SaveFormRow[];
  skillProficiencies: SkillFormRow[];
  damageResistances: DamageNoteFormRow[];
  damageImmunities: DamageNoteFormRow[];
  damageVulnerabilities: DamageNoteFormRow[];
  gear: GearFormRow[];
  features: FeatureFormRow[];
  loreText: string;
  legendaryText: string;
  legendaryUsesBase: string;
  legendaryUsesLair: string;
}

export function emptyMonsterForm(): MonsterFormState {
  return {
    nameRusloc: '', nameEngloc: '', slug: '', alignmentId: '',
    size: '', sizeSecondary: '', isSwarm: false, swarmSize: '',
    crRating: '', crValue: '', xpBase: '', xpLair: '', proficiencyBonus: '',
    isActive: true, isVisibleToPlayers: false,
    armorClass: '', armorClassText: '', initiativeBonus: '', initiativeScore: '',
    hpAverage: '', hpDiceCount: '', hpDiceSides: '', hpDiceModifier: '', hpFormula: '',
    strScore: '', dexScore: '', conScore: '', intScore: '', wisScore: '', chaScore: '',
    passivePerception: '', telepathyFt: '',
    creatureTypeIds: [], languageIds: [], conditionImmunityIds: [],
    habitatIds: [], treasureTagIds: [], sourceIds: [],
    speeds: [], senses: [], savingThrows: [], skillProficiencies: [],
    damageResistances: [], damageImmunities: [], damageVulnerabilities: [],
    gear: [], features: [],
    loreText: '', legendaryText: '', legendaryUsesBase: '', legendaryUsesLair: '',
  };
}

const s = (v: string | number | null | undefined): string => (v == null ? '' : String(v));

export function monsterToForm(m: MonsterResponse): MonsterFormState {
  return {
    nameRusloc: m.nameRusloc,
    nameEngloc: s(m.nameEngloc),
    slug: m.slug ?? '',
    alignmentId: m.alignment?.id ?? '',
    size: m.size,
    sizeSecondary: s(m.sizeSecondary),
    isSwarm: m.isSwarm,
    swarmSize: s(m.swarmSize),
    crRating: m.crRating,
    crValue: s(m.crValue),
    xpBase: s(m.xpBase),
    xpLair: s(m.xpLair),
    proficiencyBonus: s(m.proficiencyBonus),
    isActive: m.isActive,
    isVisibleToPlayers: m.isVisibleToPlayers,
    armorClass: s(m.armorClass),
    armorClassText: s(m.armorClassText),
    initiativeBonus: s(m.initiativeBonus),
    initiativeScore: s(m.initiativeScore),
    hpAverage: s(m.hpAverage),
    hpDiceCount: s(m.hpDiceCount),
    hpDiceSides: s(m.hpDiceSides),
    hpDiceModifier: s(m.hpDiceModifier),
    hpFormula: s(m.hpFormula),
    strScore: s(m.strScore),
    dexScore: s(m.dexScore),
    conScore: s(m.conScore),
    intScore: s(m.intScore),
    wisScore: s(m.wisScore),
    chaScore: s(m.chaScore),
    passivePerception: s(m.passivePerception),
    telepathyFt: s(m.telepathyFt),
    creatureTypeIds: m.creatureTypes.map((x) => x.id),
    languageIds: m.languages.map((x) => x.id),
    conditionImmunityIds: m.conditionImmunities.map((x) => x.id),
    habitatIds: m.habitats.map((x) => x.id),
    treasureTagIds: m.treasureTags.map((x) => x.id),
    sourceIds: m.sources.map((x) => x.id),
    speeds: m.speeds.map((r) => ({ _id: rowUid(), movementTypeId: r.movementType.id, ft: s(r.ft), hover: r.hover })),
    senses: m.senses.map((r) => ({ _id: rowUid(), senseTypeId: r.senseType.id, ft: s(r.ft) })),
    savingThrows: m.savingThrows.map((r) => ({ _id: rowUid(), ability: r.ability, bonus: s(r.bonus) })),
    skillProficiencies: m.skillProficiencies.map((r) => ({ _id: rowUid(), proficiencySkillId: r.proficiencySkillId, bonus: s(r.bonus) })),
    damageResistances: m.damageResistances.map((r) => ({ _id: rowUid(), damageType: s(r.damageType), note: s(r.note) })),
    damageImmunities: m.damageImmunities.map((r) => ({ _id: rowUid(), damageType: s(r.damageType), note: s(r.note) })),
    damageVulnerabilities: m.damageVulnerabilities.map((r) => ({ _id: rowUid(), damageType: s(r.damageType), note: s(r.note) })),
    gear: m.gear.map((r) => ({ _id: rowUid(), itemId: r.item.id, qty: s(r.qty) })),
    features: m.features.map((f) => ({
      _id: rowUid(),
      section: f.section,
      sortOrder: s(f.sortOrder),
      nameRusloc: f.nameRusloc,
      nameEngloc: s(f.nameEngloc),
      kind: f.kind,
      rechargeMin: s(f.rechargeMin),
      rechargeMax: s(f.rechargeMax),
      descriptionRusloc: f.descriptionRusloc,
      descriptionEngloc: s(f.descriptionEngloc),
      attackType: s(f.attackType),
      attackBonus: s(f.attackBonus),
      reachFt: s(f.reachFt),
      rangeFt: s(f.rangeFt),
      rangeLongFt: s(f.rangeLongFt),
      saveAbility: s(f.saveAbility),
      saveDc: s(f.saveDc),
      damages: f.damages.map((d) => ({
        _id: rowUid(),
        sortOrder: s(d.sortOrder),
        average: s(d.average),
        dice: s(d.dice),
        damageType: s(d.damageType),
        note: s(d.note),
      })),
    })),
    loreText: s(m.loreText),
    legendaryText: s(m.legendaryText),
    legendaryUsesBase: s(m.legendaryUsesBase),
    legendaryUsesLair: s(m.legendaryUsesLair),
  };
}

const toInt = (v: string): number | undefined => {
  const t = v.trim();
  if (t === '') return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
};
const toFloat = (v: string): number | undefined => {
  const t = v.trim();
  if (t === '') return undefined;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
};
const reqInt = (v: string): number => toInt(v) ?? 0;
const reqFloat = (v: string): number => toFloat(v) ?? 0;
const orUndef = (v: string): string | undefined => (v.trim() === '' ? undefined : v.trim());

/** Build a complete MonsterRequest (PUT replaces nested lists wholesale). */
export function buildMonsterRequest(f: MonsterFormState): MonsterRequest {
  return {
    slug: orUndef(f.slug),
    nameRusloc: f.nameRusloc.trim(),
    nameEngloc: orUndef(f.nameEngloc),
    alignmentId: f.alignmentId || null,
    size: (f.size || 'MEDIUM') as CreatureSize,
    sizeSecondary: (f.sizeSecondary || null) as CreatureSize | null,
    isSwarm: f.isSwarm,
    swarmSize: f.isSwarm ? ((f.swarmSize || null) as CreatureSize | null) : null,
    armorClass: reqInt(f.armorClass),
    armorClassText: orUndef(f.armorClassText),
    initiativeBonus: toInt(f.initiativeBonus) ?? null,
    initiativeScore: toInt(f.initiativeScore) ?? null,
    hpAverage: toInt(f.hpAverage) ?? null,
    hpDiceCount: toInt(f.hpDiceCount) ?? null,
    hpDiceSides: toInt(f.hpDiceSides) ?? null,
    hpDiceModifier: toInt(f.hpDiceModifier) ?? null,
    hpFormula: orUndef(f.hpFormula),
    strScore: reqInt(f.strScore),
    dexScore: reqInt(f.dexScore),
    conScore: reqInt(f.conScore),
    intScore: reqInt(f.intScore),
    wisScore: reqInt(f.wisScore),
    chaScore: reqInt(f.chaScore),
    passivePerception: toInt(f.passivePerception) ?? null,
    telepathyFt: toInt(f.telepathyFt) ?? null,
    crRating: f.crRating.trim(),
    crValue: reqFloat(f.crValue),
    xpBase: toInt(f.xpBase) ?? null,
    xpLair: toInt(f.xpLair) ?? null,
    proficiencyBonus: toInt(f.proficiencyBonus) ?? null,
    legendaryUsesBase: toInt(f.legendaryUsesBase) ?? null,
    legendaryUsesLair: toInt(f.legendaryUsesLair) ?? null,
    legendaryText: orUndef(f.legendaryText),
    loreText: orUndef(f.loreText),
    isActive: f.isActive,
    isVisibleToPlayers: f.isVisibleToPlayers,
    creatureTypeIds: f.creatureTypeIds,
    languageIds: f.languageIds,
    conditionImmunityIds: f.conditionImmunityIds,
    habitatIds: f.habitatIds,
    treasureTagIds: f.treasureTagIds,
    sourceIds: f.sourceIds,
    speeds: f.speeds
      .filter((r) => r.movementTypeId)
      .map((r) => ({ movementTypeId: r.movementTypeId, ft: reqInt(r.ft), hover: r.hover })),
    senses: f.senses
      .filter((r) => r.senseTypeId)
      .map((r) => ({ senseTypeId: r.senseTypeId, ft: reqInt(r.ft) })),
    savingThrows: f.savingThrows.map((r) => ({ ability: r.ability, bonus: reqInt(r.bonus) })),
    skillProficiencies: f.skillProficiencies
      .filter((r) => r.proficiencySkillId)
      .map((r) => ({ proficiencySkillId: r.proficiencySkillId, bonus: reqInt(r.bonus) })),
    damageResistances: f.damageResistances.map((r) => ({ damageType: (r.damageType || null) as DamageType | null, note: orUndef(r.note) ?? null })),
    damageImmunities: f.damageImmunities.map((r) => ({ damageType: (r.damageType || null) as DamageType | null, note: orUndef(r.note) ?? null })),
    damageVulnerabilities: f.damageVulnerabilities.map((r) => ({ damageType: (r.damageType || null) as DamageType | null, note: orUndef(r.note) ?? null })),
    gear: f.gear.filter((r) => r.itemId).map((r) => ({ itemId: r.itemId, qty: toInt(r.qty) ?? 1 })),
    features: f.features.map((ft, i) => ({
      section: ft.section || 'actions',
      sortOrder: toInt(ft.sortOrder) ?? i,
      nameRusloc: orUndef(ft.nameRusloc),
      nameEngloc: orUndef(ft.nameEngloc),
      kind: ft.kind || 'trait',
      rechargeMin: toInt(ft.rechargeMin) ?? null,
      rechargeMax: toInt(ft.rechargeMax) ?? null,
      descriptionRusloc: ft.descriptionRusloc,
      descriptionEngloc: orUndef(ft.descriptionEngloc),
      attackType: orUndef(ft.attackType) ?? null,
      attackBonus: toInt(ft.attackBonus) ?? null,
      reachFt: toInt(ft.reachFt) ?? null,
      rangeFt: toInt(ft.rangeFt) ?? null,
      rangeLongFt: toInt(ft.rangeLongFt) ?? null,
      saveAbility: (ft.saveAbility || null) as AbilityEnum | null,
      saveDc: toInt(ft.saveDc) ?? null,
      damages: ft.damages.map((d, di) => ({
        sortOrder: toInt(d.sortOrder) ?? di,
        average: toInt(d.average) ?? null,
        dice: orUndef(d.dice) ?? null,
        damageType: (d.damageType || null) as DamageType | null,
        note: orUndef(d.note) ?? null,
      })),
    })),
  };
}
