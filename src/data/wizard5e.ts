// ============================================================
// D&D 5e domain data + math helpers for the Character Wizard.
// Ported from the standalone wizard (wizard-data / forge-data).
// Pure data + functions — no DOM, no globals.
// ============================================================

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityDef {
  key: AbilityKey;
  label: string;
  abbr: string;
}

export interface SkillDef {
  key: string;
  label: string;
  abil: AbilityKey;
}

export type ASI = Partial<Record<AbilityKey, number>>;

export interface Subrace {
  key: string;
  label: string;
  asi: ASI;
  speed?: number;
  desc: string;
}

export interface Race {
  key: string;
  label: string;
  speed: number;
  desc: string;
  asi: ASI;
  traits: string[];
  subraces: Subrace[];
}

export interface CharClass {
  key: string;
  label: string;
  hitDie: number;
  primary: AbilityKey;
  saves: AbilityKey[];
  spellcaster: boolean;
  cantrips: boolean;
  spellAbil?: AbilityKey;
  halfCaster?: boolean;
  desc: string;
  skillCount: number;
  skills: string[];
  profs: string;
}

export interface Background {
  key: string;
  label: string;
  skills: string[];
  desc: string;
  extra: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  classes: string[];
  desc: string;
}

// ── 5e math ────────────────────────────────────────────────
export const abilityMod = (score: number): number =>
  Math.floor((Number(score || 0) - 10) / 2);
export const fmtMod = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);
export const profByLevel = (lvl: number): number =>
  Math.ceil(Math.min(20, Math.max(1, Number(lvl || 1))) / 4) + 1;
export const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

// ── Abilities ──────────────────────────────────────────────
export const ABILITIES: AbilityDef[] = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
];

// ── Skills, grouped by governing ability ───────────────────
export const SKILLS: SkillDef[] = [
  { key: 'athletics', label: 'Athletics', abil: 'str' },
  { key: 'acrobatics', label: 'Acrobatics', abil: 'dex' },
  { key: 'sleight', label: 'Sleight of Hand', abil: 'dex' },
  { key: 'stealth', label: 'Stealth', abil: 'dex' },
  { key: 'arcana', label: 'Arcana', abil: 'int' },
  { key: 'history', label: 'History', abil: 'int' },
  { key: 'investigation', label: 'Investigation', abil: 'int' },
  { key: 'nature', label: 'Nature', abil: 'int' },
  { key: 'religion', label: 'Religion', abil: 'int' },
  { key: 'animal', label: 'Animal Handling', abil: 'wis' },
  { key: 'insight', label: 'Insight', abil: 'wis' },
  { key: 'medicine', label: 'Medicine', abil: 'wis' },
  { key: 'perception', label: 'Perception', abil: 'wis' },
  { key: 'survival', label: 'Survival', abil: 'wis' },
  { key: 'deception', label: 'Deception', abil: 'cha' },
  { key: 'intimidation', label: 'Intimidation', abil: 'cha' },
  { key: 'performance', label: 'Performance', abil: 'cha' },
  { key: 'persuasion', label: 'Persuasion', abil: 'cha' },
];

export const ALIGNMENTS: string[] = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

// ── Races ──────────────────────────────────────────────────
export const RACES: Race[] = [
  { key: 'human', label: 'Human', speed: 30, desc: 'Ambitious and adaptable, humans spread across every corner of the world.',
    asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: ['+1 to every ability', 'Extra language', 'Versatile'], subraces: [] },
  { key: 'elf', label: 'Elf', speed: 30, desc: 'Graceful, long-lived folk attuned to magic and the wild places of the world.',
    asi: { dex: 2 }, traits: ['Darkvision 60 ft', 'Fey Ancestry', 'Trance', 'Keen Senses'],
    subraces: [
      { key: 'high', label: 'High Elf', asi: { int: 1 }, desc: 'Arcane heritage; one wizard cantrip.' },
      { key: 'wood', label: 'Wood Elf', asi: { wis: 1 }, speed: 35, desc: 'Fleet of foot; Mask of the Wild.' },
      { key: 'drow', label: 'Drow', asi: { cha: 1 }, desc: 'Superior darkvision; innate Underdark magic.' },
    ] },
  { key: 'dwarf', label: 'Dwarf', speed: 25, desc: 'Stout, enduring mountain folk with a long memory for grudges and craft.',
    asi: { con: 2 }, traits: ['Darkvision 60 ft', 'Dwarven Resilience', 'Stonecunning'],
    subraces: [
      { key: 'hill', label: 'Hill Dwarf', asi: { wis: 1 }, desc: '+1 HP per level; keen wisdom.' },
      { key: 'mountain', label: 'Mountain Dwarf', asi: { str: 2 }, desc: 'Armour training; mighty frame.' },
    ] },
  { key: 'halfling', label: 'Halfling', speed: 25, desc: 'Small, cheerful and uncannily lucky wanderers of road and hearth.',
    asi: { dex: 2 }, traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
    subraces: [
      { key: 'lightfoot', label: 'Lightfoot', asi: { cha: 1 }, desc: 'Naturally stealthy and affable.' },
      { key: 'stout', label: 'Stout', asi: { con: 1 }, desc: 'Resilient against poison.' },
    ] },
  { key: 'gnome', label: 'Gnome', speed: 25, desc: 'Bright-eyed tinkers and illusionists brimming with curiosity.',
    asi: { int: 2 }, traits: ['Darkvision 60 ft', 'Gnome Cunning'],
    subraces: [
      { key: 'forest', label: 'Forest Gnome', asi: { dex: 1 }, desc: 'Minor Illusion; speak with small beasts.' },
      { key: 'rock', label: 'Rock Gnome', asi: { con: 1 }, desc: 'Artificer\u2019s Lore; tinker.' },
    ] },
  { key: 'halfelf', label: 'Half-Elf', speed: 30, desc: 'Walking two worlds, half-elves blend human drive with elven grace.',
    asi: { cha: 2, dex: 1, wis: 1 }, traits: ['Darkvision', 'Fey Ancestry', '+1 to two abilities (Dex/Wis here)', 'Two skills'], subraces: [] },
  { key: 'halforc', label: 'Half-Orc', speed: 30, desc: 'Fierce and enduring, half-orcs are built to weather and to strike.',
    asi: { str: 2, con: 1 }, traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks'], subraces: [] },
  { key: 'tiefling', label: 'Tiefling', speed: 30, desc: 'Marked by infernal heritage, tieflings carry power and suspicion alike.',
    asi: { cha: 2, int: 1 }, traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'], subraces: [] },
  { key: 'dragonborn', label: 'Dragonborn', speed: 30, desc: 'Proud, draconic warriors who breathe the fury of their bloodline.',
    asi: { str: 2, cha: 1 }, traits: ['Breath Weapon', 'Damage Resistance', 'Draconic Ancestry'], subraces: [] },
];

// ── Classes ────────────────────────────────────────────────
const ALL_SKILL_KEYS = SKILLS.map((s) => s.key);

export const CLASSES: CharClass[] = [
  { key: 'barbarian', label: 'Barbarian', hitDie: 12, primary: 'str', saves: ['str', 'con'], spellcaster: false, cantrips: false,
    desc: 'A fury-born warrior who shrugs off blows and rends foes in a rage.', skillCount: 2,
    skills: ['animal', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    profs: 'Light & medium armour, shields, simple & martial weapons' },
  { key: 'bard', label: 'Bard', hitDie: 8, primary: 'cha', saves: ['dex', 'cha'], spellcaster: true, cantrips: true, spellAbil: 'cha',
    desc: 'A magical performer weaving inspiration, lore and versatile spellcraft.', skillCount: 3,
    skills: ALL_SKILL_KEYS, profs: 'Light armour, simple weapons, three instruments' },
  { key: 'cleric', label: 'Cleric', hitDie: 8, primary: 'wis', saves: ['wis', 'cha'], spellcaster: true, cantrips: true, spellAbil: 'wis',
    desc: 'A divine conduit channeling the power and domain of a deity.', skillCount: 2,
    skills: ['history', 'insight', 'medicine', 'persuasion', 'religion'], profs: 'Light & medium armour, shields, simple weapons' },
  { key: 'druid', label: 'Druid', hitDie: 8, primary: 'wis', saves: ['int', 'wis'], spellcaster: true, cantrips: true, spellAbil: 'wis',
    desc: 'A keeper of the old ways who shapeshifts and calls on primal magic.', skillCount: 2,
    skills: ['arcana', 'animal', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], profs: 'Light & medium (nonmetal) armour, shields' },
  { key: 'fighter', label: 'Fighter', hitDie: 10, primary: 'str', saves: ['str', 'con'], spellcaster: false, cantrips: false,
    desc: 'A master of weapons and armour, adaptable to any battlefield role.', skillCount: 2,
    skills: ['acrobatics', 'animal', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], profs: 'All armour, shields, simple & martial weapons' },
  { key: 'monk', label: 'Monk', hitDie: 8, primary: 'dex', saves: ['str', 'dex'], spellcaster: false, cantrips: false,
    desc: 'A disciplined martial artist harnessing ki to strike fast and free.', skillCount: 2,
    skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], profs: 'Simple weapons, shortswords' },
  { key: 'paladin', label: 'Paladin', hitDie: 10, primary: 'str', saves: ['wis', 'cha'], spellcaster: true, cantrips: false, spellAbil: 'cha', halfCaster: true,
    desc: 'A holy warrior bound by oath, blending martial might and divine magic.', skillCount: 2,
    skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], profs: 'All armour, shields, simple & martial weapons' },
  { key: 'ranger', label: 'Ranger', hitDie: 10, primary: 'dex', saves: ['str', 'dex'], spellcaster: true, cantrips: false, spellAbil: 'wis', halfCaster: true,
    desc: 'A hunter and tracker who blends woodcraft with primal spellcasting.', skillCount: 3,
    skills: ['animal', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], profs: 'Light & medium armour, shields, simple & martial weapons' },
  { key: 'rogue', label: 'Rogue', hitDie: 8, primary: 'dex', saves: ['dex', 'int'], spellcaster: false, cantrips: false,
    desc: 'A cunning skirmisher who strikes from shadow and slips every trap.', skillCount: 4,
    skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight', 'stealth'], profs: 'Light armour, simple weapons, thieves\u2019 tools' },
  { key: 'sorcerer', label: 'Sorcerer', hitDie: 6, primary: 'cha', saves: ['con', 'cha'], spellcaster: true, cantrips: true, spellAbil: 'cha',
    desc: 'An innate caster whose magic springs from bloodline and raw will.', skillCount: 2,
    skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], profs: 'Daggers, darts, slings, quarterstaffs, light crossbows' },
  { key: 'warlock', label: 'Warlock', hitDie: 8, primary: 'cha', saves: ['wis', 'cha'], spellcaster: true, cantrips: true, spellAbil: 'cha',
    desc: 'A wielder of pact magic granted by a mysterious otherworldly patron.', skillCount: 2,
    skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], profs: 'Light armour, simple weapons' },
  { key: 'wizard', label: 'Wizard', hitDie: 6, primary: 'int', saves: ['int', 'wis'], spellcaster: true, cantrips: true, spellAbil: 'int',
    desc: 'A scholar of the arcane who shapes reality through study and spellbook.', skillCount: 2,
    skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], profs: 'Daggers, darts, slings, quarterstaffs, light crossbows' },
];

// ── Backgrounds ────────────────────────────────────────────
export const BACKGROUNDS: Background[] = [
  { key: 'acolyte', label: 'Acolyte', skills: ['insight', 'religion'], desc: 'You served a temple, versed in rites and the will of the divine.', extra: 'Two languages \u00b7 holy symbol, prayer book, vestments' },
  { key: 'criminal', label: 'Criminal', skills: ['deception', 'stealth'], desc: 'You lived outside the law, trading in secrets and stolen goods.', extra: 'Thieves\u2019 tools, gaming set \u00b7 crowbar, dark clothes' },
  { key: 'folkhero', label: 'Folk Hero', skills: ['animal', 'survival'], desc: 'You rose from common stock to stand for the people against tyranny.', extra: 'Artisan\u2019s tools, vehicles \u00b7 smith\u2019s tools, shovel' },
  { key: 'noble', label: 'Noble', skills: ['history', 'persuasion'], desc: 'Born to privilege, you carry a signet, a title and old obligations.', extra: 'Gaming set, one language \u00b7 fine clothes, signet ring' },
  { key: 'sage', label: 'Sage', skills: ['arcana', 'history'], desc: 'Years among books and masters left you a wellspring of lore.', extra: 'Two languages \u00b7 ink, quill, letter from a colleague' },
  { key: 'soldier', label: 'Soldier', skills: ['athletics', 'intimidation'], desc: 'You served in a war band and know rank, drill and the cost of battle.', extra: 'Gaming set, vehicles \u00b7 insignia, trophy, deck of cards' },
  { key: 'charlatan', label: 'Charlatan', skills: ['deception', 'sleight'], desc: 'You made your way with a silver tongue and a deck of tricks.', extra: 'Disguise & forgery kit \u00b7 con tools, fine clothes' },
  { key: 'hermit', label: 'Hermit', skills: ['medicine', 'religion'], desc: 'In seclusion you sought a truth, returning changed and resolved.', extra: 'Herbalism kit, one language \u00b7 scroll, winter blanket' },
  { key: 'entertainer', label: 'Entertainer', skills: ['acrobatics', 'performance'], desc: 'Stage and crowd are home; you live by applause and your craft.', extra: 'Disguise kit, one instrument \u00b7 costume, favour of an admirer' },
  { key: 'artisan', label: 'Guild Artisan', skills: ['insight', 'persuasion'], desc: 'A guild member of skill and standing, fluent in trade and coin.', extra: 'Artisan\u2019s tools, one language \u00b7 letter of introduction' },
];

// ── Spells (curated cross-class set) ───────────────────────
export const SPELLS: Spell[] = [
  { name: 'Fire Bolt', level: 0, school: 'Evocation', classes: ['sorcerer', 'wizard'], desc: 'Hurl a mote of fire at a creature or object: 1d10 fire damage.' },
  { name: 'Mage Hand', level: 0, school: 'Conjuration', classes: ['bard', 'sorcerer', 'warlock', 'wizard'], desc: 'A spectral hand manipulates objects within 30 ft.' },
  { name: 'Minor Illusion', level: 0, school: 'Illusion', classes: ['bard', 'sorcerer', 'warlock', 'wizard'], desc: 'Create a sound or image for 1 minute.' },
  { name: 'Prestidigitation', level: 0, school: 'Transmutation', classes: ['bard', 'sorcerer', 'warlock', 'wizard'], desc: 'Minor magical tricks: clean, flavour, spark, trinket.' },
  { name: 'Sacred Flame', level: 0, school: 'Evocation', classes: ['cleric'], desc: 'Radiant flame strikes a foe (Dex save), ignoring cover: 1d8.' },
  { name: 'Guidance', level: 0, school: 'Divination', classes: ['cleric', 'druid'], desc: 'Touch a creature; +1d4 to one ability check.' },
  { name: 'Eldritch Blast', level: 0, school: 'Evocation', classes: ['warlock'], desc: 'A beam of crackling energy: 1d10 force damage.' },
  { name: 'Vicious Mockery', level: 0, school: 'Enchantment', classes: ['bard'], desc: 'Insult a creature (Wis save): 1d4 psychic and disadvantage.' },
  { name: 'Druidcraft', level: 0, school: 'Transmutation', classes: ['druid'], desc: 'Small nature effects: weather hint, bloom, flame.' },
  { name: 'Shillelagh', level: 0, school: 'Transmutation', classes: ['druid'], desc: 'Your club or staff becomes a magical 1d8 weapon using your casting stat.' },
  { name: 'Magic Missile', level: 1, school: 'Evocation', classes: ['sorcerer', 'wizard'], desc: 'Three darts of force, 1d4+1 each, never miss.' },
  { name: 'Shield', level: 1, school: 'Abjuration', classes: ['sorcerer', 'wizard'], desc: 'Reaction: +5 AC until your next turn.' },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'], desc: 'Touch heals 1d8 + spellcasting modifier.' },
  { name: 'Healing Word', level: 1, school: 'Evocation', classes: ['bard', 'cleric', 'druid'], desc: 'Bonus action: heal 1d4 + mod at range.' },
  { name: 'Bless', level: 1, school: 'Enchantment', classes: ['cleric', 'paladin'], desc: 'Up to three allies add 1d4 to attacks and saves.' },
  { name: 'Hex', level: 1, school: 'Enchantment', classes: ['warlock'], desc: 'Curse a target: +1d6 necrotic and disadvantage on one ability.' },
  { name: 'Faerie Fire', level: 1, school: 'Evocation', classes: ['bard', 'druid'], desc: 'Outline creatures (Dex save); attacks vs them gain advantage.' },
  { name: 'Thunderwave', level: 1, school: 'Evocation', classes: ['bard', 'druid', 'sorcerer', 'wizard'], desc: '15-ft cube: 2d8 thunder and pushed 10 ft (Con save).' },
  { name: 'Hunter\u2019s Mark', level: 1, school: 'Divination', classes: ['ranger'], desc: 'Mark a quarry: +1d6 weapon damage, easier to track.' },
  { name: 'Sleep', level: 1, school: 'Enchantment', classes: ['bard', 'sorcerer', 'wizard'], desc: '5d8 HP of creatures fall unconscious.' },
  { name: 'Detect Magic', level: 1, school: 'Divination', classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard'], desc: 'Sense magic within 30 ft for 10 minutes.' },
  { name: 'Misty Step', level: 2, school: 'Conjuration', classes: ['sorcerer', 'warlock', 'wizard'], desc: 'Bonus action: teleport 30 ft to a seen space.' },
  { name: 'Scorching Ray', level: 2, school: 'Evocation', classes: ['sorcerer', 'wizard'], desc: 'Three rays, 2d6 fire each.' },
  { name: 'Hold Person', level: 2, school: 'Enchantment', classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'], desc: 'Paralyse a humanoid (Wis save).' },
  { name: 'Spiritual Weapon', level: 2, school: 'Evocation', classes: ['cleric'], desc: 'Bonus-action spectral weapon: 1d8 + mod force.' },
  { name: 'Lesser Restoration', level: 2, school: 'Abjuration', classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'], desc: 'End a disease or one condition by touch.' },
  { name: 'Moonbeam', level: 2, school: 'Evocation', classes: ['druid'], desc: 'A beam of moonlight: 2d10 radiant, movable each turn.' },
  { name: 'Fireball', level: 3, school: 'Evocation', classes: ['sorcerer', 'wizard'], desc: '20-ft radius: 8d6 fire (Dex save for half).' },
  { name: 'Counterspell', level: 3, school: 'Abjuration', classes: ['sorcerer', 'warlock', 'wizard'], desc: 'Reaction: interrupt another creature\u2019s spell.' },
  { name: 'Fly', level: 3, school: 'Transmutation', classes: ['sorcerer', 'warlock', 'wizard'], desc: 'A creature gains a 60-ft flying speed for 10 min.' },
  { name: 'Revivify', level: 3, school: 'Necromancy', classes: ['cleric', 'paladin'], desc: 'Return a creature dead < 1 minute to 1 HP.' },
  { name: 'Spirit Guardians', level: 3, school: 'Conjuration', classes: ['cleric'], desc: 'Spectral guardians: 3d8 radiant/necrotic, halve speed.' },
];

export const SCHOOLS: string[] = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

// ── Ability-score generation ───────────────────────────────
export const STANDARD_ARRAY: number[] = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_BUDGET = 27;

export type ScoreMap = Record<AbilityKey, number>;

export const pointBuySpent = (base: ScoreMap): number =>
  ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[base[a.key]] ?? 0), 0);

const d6 = (): number => Math.ceil(Math.random() * 6);
export const roll4d6 = (): number => {
  const dice = [d6(), d6(), d6(), d6()].sort((x, y) => x - y);
  return dice[1] + dice[2] + dice[3];
};
export const rollStats = (): number[] =>
  Array.from({ length: 6 }, roll4d6).sort((x, y) => y - x);

// merge racial ASI onto a base score map
export const applyRacial = (base: ScoreMap, asi: ASI): ScoreMap => {
  const out = { ...base };
  ABILITIES.forEach((a) => {
    out[a.key] = Number(base[a.key] || 0) + Number(asi[a.key] || 0);
  });
  return out;
};

// combined ASI of race + subrace
export const combinedASI = (race: Race | null, subraceKey: string): ASI => {
  if (!race) return {};
  const sub = (race.subraces || []).find((s) => s.key === subraceKey);
  const merged: ASI = { ...race.asi };
  if (sub && sub.asi) {
    (Object.keys(sub.asi) as AbilityKey[]).forEach((k) => {
      merged[k] = (merged[k] || 0) + (sub.asi[k] || 0);
    });
  }
  return merged;
};

// ── Spell limits (simplified guide, scales with level) ─────
export function spellLimits(cls: CharClass | null, level: number): { cantrips: number; spells: number } {
  if (!cls || !cls.spellcaster) return { cantrips: 0, spells: 0 };
  const lvl = Math.max(1, Math.min(20, level));
  const cantripsBase: Record<string, number> = { bard: 2, cleric: 3, druid: 2, sorcerer: 4, warlock: 2, wizard: 3 };
  let cantrips = cls.cantrips ? (cantripsBase[cls.key] ?? 2) : 0;
  if (cls.cantrips && lvl >= 4) cantrips += 1;
  if (cls.cantrips && lvl >= 10) cantrips += 1;
  let spells: number;
  if (cls.halfCaster) spells = Math.max(2, Math.floor(lvl / 2) + 1);
  else if (cls.key === 'warlock') spells = Math.min(15, 1 + lvl);
  else if (cls.key === 'wizard') spells = 6 + (lvl - 1) * 2;
  else spells = Math.min(22, 3 + lvl);
  return { cantrips, spells };
}

export const raceByKey = (k: string): Race | null => RACES.find((r) => r.key === k) || null;
export const classByKey = (k: string): CharClass | null => CLASSES.find((c) => c.key === k) || null;
export const bgByKey = (k: string): Background | null => BACKGROUNDS.find((b) => b.key === k) || null;
export const skillByKey = (k: string): SkillDef | undefined => SKILLS.find((s) => s.key === k);
export const abilityByKey = (k: string): AbilityDef | undefined => ABILITIES.find((a) => a.key === k);
export const spellsForClass = (k: string): Spell[] => SPELLS.filter((s) => s.classes.includes(k));
