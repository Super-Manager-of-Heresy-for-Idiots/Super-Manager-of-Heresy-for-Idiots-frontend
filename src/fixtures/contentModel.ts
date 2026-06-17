/**
 * Contract fixtures for the new normalized content model (Phase 2).
 *
 * These are EXACT final-contract payloads as the backend will deliver them.
 * Их типы выведены из app-типов через `Omit` (legacy-поля отсечены), поэтому если
 * app-тип перестанет быть корректным надмножеством финального DTO — фикстуры
 * перестанут компилироваться. Это и есть compile-time проверка контракта.
 *
 * Покрытые случаи: class without spellcasting, full caster, half caster,
 * class with subclass choice, class with several reward groups at one level,
 * homebrew custom grant.
 */
import type {
  CharacterClassDetailResponse,
  ClassFeatureSummary,
  ContentLabel,
  ContentRewardGrant,
  ContentRewardOption,
  RewardGroup,
} from '@/types';

// --- Strict final-contract views (legacy fields stripped from app types) ---

/** RewardGrantDto — already pure final in app types. */
export type FinalRewardGrant = ContentRewardGrant;
/** RewardOptionDto — already pure final in app types. */
export type FinalRewardOption = ContentRewardOption;
/** ClassFeatureSummaryDto — already pure final in app types. */
export type FinalClassFeature = ClassFeatureSummary;

/** RewardGroupDto — final contract, without legacy rewardType/isChoice/rewards/groupKey. */
export type FinalRewardGroup = Omit<
  RewardGroup,
  'rewardType' | 'isChoice' | 'rewards' | 'groupKey'
>;

/** ContentClassDetailResponse — final contract, without legacy class-detail fields. */
export type FinalClassDetail = Omit<
  CharacterClassDetailResponse,
  | 'primaryAbilityStatId'
  | 'savingThrowStatNames'
  | 'skillChoiceOptions'
  | 'armorWeaponProficiencies'
  | 'rewardGroups'
> & { rewardGroups?: FinalRewardGroup[] };

// --- Shared label helpers (stable ids; ru/en localized) ---

const label = (id: string, name: string, nameRu: string, nameEn: string): ContentLabel => ({
  id,
  slug: id,
  name,
  nameRu,
  nameEn,
});

const STR = label('stat-str', 'Сила', 'Сила', 'Strength');
const DEX = label('stat-dex', 'Ловкость', 'Ловкость', 'Dexterity');
const CON = label('stat-con', 'Телосложение', 'Телосложение', 'Constitution');
const INT = label('stat-int', 'Интеллект', 'Интеллект', 'Intelligence');
const WIS = label('stat-wis', 'Мудрость', 'Мудрость', 'Wisdom');
const CHA = label('stat-cha', 'Харизма', 'Харизма', 'Charisma');

const skill = (id: string, ru: string, en: string) => label(`skill-${id}`, ru, ru, en);

// === 1. Class without spellcasting (Fighter / Воин) ==========================
// Покрывает: multi-primary ability, auto feature grant, choose-one feature,
// subclass choice, ASI (+2 и +1/+1).

export const classNoSpellcasting: FinalClassDetail = {
  id: 'class-fighter',
  slug: 'fighter',
  name: 'Fighter',
  nameRu: 'Воин',
  nameEn: 'Fighter',
  subtitle: 'Мастер оружия и тактики',
  hitDie: 10,
  primaryAbilities: [STR, DEX],
  savingThrows: [STR, CON],
  skillChoiceCount: 2,
  skillChoiceAny: false,
  skillOptions: [
    skill('acrobatics', 'Акробатика', 'Acrobatics'),
    skill('athletics', 'Атлетика', 'Athletics'),
    skill('history', 'История', 'History'),
    skill('intimidation', 'Запугивание', 'Intimidation'),
    skill('perception', 'Внимательность', 'Perception'),
    skill('survival', 'Выживание', 'Survival'),
  ],
  armorProficiencyText: 'Все доспехи, щиты',
  weaponProficiencyText: 'Простое и воинское оружие',
  toolProficiencyText: 'Нет',
  spellcasting: undefined,
  features: [
    { id: 'feat-second-wind', classId: 'class-fighter', level: 1, sortOrder: 0, title: 'Второе дыхание', description: 'Восстановите 1d10 + уровень воина хитов (бонусным действием).' },
    { id: 'feat-action-surge', classId: 'class-fighter', level: 2, sortOrder: 0, title: 'Всплеск действий', description: 'Совершите одно дополнительное действие в свой ход.' },
  ],
  rewardGroups: [
    // auto feature grant
    {
      id: 'rg-fighter-1-secondwind',
      classId: 'class-fighter',
      classLevel: 1,
      groupKind: 'FEATURE',
      sortOrder: 0,
      chooseMin: 0,
      chooseMax: 0,
      repeatable: false,
      grants: [
        {
          id: 'g-secondwind',
          grantType: 'FEATURE',
          label: 'Второе дыхание',
          labelRu: 'Второе дыхание',
          labelEn: 'Second Wind',
          sortOrder: 0,
          feature: { id: 'feat-second-wind', classId: 'class-fighter', level: 1, title: 'Второе дыхание', description: 'Восстановите 1d10 + уровень воина хитов.' },
        },
      ],
      options: [],
    },
    // choose one of N (fighting style) — each option grants a FEATURE
    {
      id: 'rg-fighter-1-style',
      classId: 'class-fighter',
      classLevel: 1,
      groupKind: 'FEATURE_CHOICE',
      prompt: 'Выберите боевой стиль',
      sortOrder: 1,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        {
          id: 'opt-style-archery',
          optionKey: 'archery',
          label: 'Стрельба',
          labelRu: 'Стрельба',
          labelEn: 'Archery',
          description: '+2 к броскам атаки дальнобойным оружием.',
          recommended: true,
          sortOrder: 0,
          grants: [
            { id: 'g-style-archery', grantType: 'NUMERIC_MODIFIER', label: '+2 к дальним атакам', labelRu: '+2 к дальним атакам', labelEn: '+2 ranged attack', sortOrder: 0, modifierKey: 'ranged_attack', amount: 2 },
          ],
        },
        {
          id: 'opt-style-defense',
          optionKey: 'defense',
          label: 'Оборона',
          labelRu: 'Оборона',
          labelEn: 'Defense',
          description: '+1 к КД, пока носите доспех.',
          sortOrder: 1,
          grants: [
            { id: 'g-style-defense', grantType: 'NUMERIC_MODIFIER', label: '+1 КД', labelRu: '+1 КД', labelEn: '+1 AC', sortOrder: 0, modifierKey: 'armor_class', amount: 1 },
          ],
        },
      ],
    },
    // choose one subclass
    {
      id: 'rg-fighter-3-subclass',
      classId: 'class-fighter',
      classLevel: 3,
      groupKind: 'SUBCLASS',
      prompt: 'Выберите воинский архетип',
      sortOrder: 0,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        {
          id: 'opt-champion',
          optionKey: 'champion',
          label: 'Чемпион',
          labelRu: 'Чемпион',
          labelEn: 'Champion',
          sortOrder: 0,
          grants: [
            { id: 'g-sub-champion', grantType: 'SUBCLASS', label: 'Чемпион', sortOrder: 0, subclass: label('sub-champion', 'Чемпион', 'Чемпион', 'Champion') },
          ],
        },
        {
          id: 'opt-battlemaster',
          optionKey: 'battlemaster',
          label: 'Мастер боя',
          labelRu: 'Мастер боя',
          labelEn: 'Battle Master',
          sortOrder: 1,
          grants: [
            { id: 'g-sub-battlemaster', grantType: 'SUBCLASS', label: 'Мастер боя', sortOrder: 0, subclass: label('sub-battlemaster', 'Мастер боя', 'Мастер боя', 'Battle Master') },
          ],
        },
      ],
    },
    // ASI: choose-one between +2, +1/+1, or a feat
    {
      id: 'rg-fighter-4-asi',
      classId: 'class-fighter',
      classLevel: 4,
      groupKind: 'ABILITY_SCORE_IMPROVEMENT',
      prompt: 'Увеличение характеристик или черта',
      sortOrder: 0,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        {
          id: 'opt-asi-plus2',
          optionKey: 'asi-2',
          label: '+2 к одной характеристике',
          labelRu: '+2 к одной характеристике',
          labelEn: '+2 to one ability',
          sortOrder: 0,
          grants: [
            { id: 'g-asi-2', grantType: 'ABILITY_SCORE', label: '+2', sortOrder: 0, abilityOptions: [STR, DEX, CON, INT, WIS, CHA], bonusPerChoice: 2, chooseCount: 1, totalBonus: 2, maxScore: 20, maxPerAbility: 2 },
          ],
        },
        {
          id: 'opt-asi-plus1plus1',
          optionKey: 'asi-1-1',
          label: '+1 к двум характеристикам',
          labelRu: '+1 к двум характеристикам',
          labelEn: '+1 to two abilities',
          sortOrder: 1,
          grants: [
            { id: 'g-asi-1-1', grantType: 'ABILITY_SCORE', label: '+1/+1', sortOrder: 0, abilityOptions: [STR, DEX, CON, INT, WIS, CHA], bonusPerChoice: 1, chooseCount: 2, totalBonus: 2, maxScore: 20, maxPerAbility: 1 },
          ],
        },
        {
          id: 'opt-asi-feat',
          optionKey: 'asi-feat',
          label: 'Взять черту',
          labelRu: 'Взять черту',
          labelEn: 'Take a feat',
          sortOrder: 2,
          grants: [
            { id: 'g-asi-feat', grantType: 'FEAT', label: 'Черта', sortOrder: 0, feat: label('feat-tough', 'Крепкий', 'Крепкий', 'Tough') },
          ],
        },
      ],
    },
  ],
};

// === 2. Full caster (Wizard / Волшебник) =====================================
// Покрывает: spellcasting (full), cantrips, choose N spells.

export const classFullCaster: FinalClassDetail = {
  id: 'class-wizard',
  slug: 'wizard',
  name: 'Wizard',
  nameRu: 'Волшебник',
  nameEn: 'Wizard',
  subtitle: 'Учёный тайных искусств',
  hitDie: 6,
  primaryAbilities: [INT],
  savingThrows: [INT, WIS],
  skillChoiceCount: 2,
  skillChoiceAny: false,
  skillOptions: [
    skill('arcana', 'Магия', 'Arcana'),
    skill('history', 'История', 'History'),
    skill('insight', 'Проницательность', 'Insight'),
    skill('investigation', 'Анализ', 'Investigation'),
  ],
  armorProficiencyText: 'Нет',
  weaponProficiencyText: 'Кинжалы, дротики, пращи, посохи, лёгкие арбалеты',
  toolProficiencyText: 'Нет',
  spellcasting: {
    isSpellcaster: true,
    spellcaster: true,
    spellcastingAbility: INT,
    spellcastingStatId: INT.id,
    spellcastingStatName: INT.name,
    hasCantrips: true,
    isHalfCaster: false,
    halfCaster: false,
  },
  features: [
    { id: 'feat-arcane-recovery', classId: 'class-wizard', level: 1, sortOrder: 0, title: 'Восстановление магии', description: 'Во время короткого отдыха восстановите часть ячеек заклинаний.' },
  ],
  rewardGroups: [
    {
      id: 'rg-wizard-1-cantrips',
      classId: 'class-wizard',
      classLevel: 1,
      groupKind: 'SPELL_CHOICE',
      prompt: 'Выберите 3 заговора',
      sortOrder: 0,
      chooseMin: 3,
      chooseMax: 3,
      repeatable: false,
      grants: [
        {
          id: 'g-wizard-cantrips',
          grantType: 'SPELL',
          label: 'Заговоры',
          labelRu: 'Заговоры',
          labelEn: 'Cantrips',
          sortOrder: 0,
          spellLevel: 0,
          chooseCount: 3,
        },
      ],
      options: [],
    },
  ],
};

// === 3. Half caster (Paladin / Паладин) ======================================
// Покрывает: spellcasting (half, без cantrips), subclass choice, auto feature.

export const classHalfCaster: FinalClassDetail = {
  id: 'class-paladin',
  slug: 'paladin',
  name: 'Paladin',
  nameRu: 'Паладин',
  nameEn: 'Paladin',
  subtitle: 'Святой воин клятвы',
  hitDie: 10,
  primaryAbilities: [STR, CHA],
  savingThrows: [WIS, CHA],
  skillChoiceCount: 2,
  skillChoiceAny: false,
  skillOptions: [
    skill('athletics', 'Атлетика', 'Athletics'),
    skill('insight', 'Проницательность', 'Insight'),
    skill('intimidation', 'Запугивание', 'Intimidation'),
    skill('medicine', 'Медицина', 'Medicine'),
    skill('persuasion', 'Убеждение', 'Persuasion'),
    skill('religion', 'Религия', 'Religion'),
  ],
  armorProficiencyText: 'Все доспехи, щиты',
  weaponProficiencyText: 'Простое и воинское оружие',
  toolProficiencyText: 'Нет',
  spellcasting: {
    isSpellcaster: true,
    spellcaster: true,
    spellcastingAbility: CHA,
    spellcastingStatId: CHA.id,
    spellcastingStatName: CHA.name,
    hasCantrips: false,
    isHalfCaster: true,
    halfCaster: true,
  },
  features: [
    { id: 'feat-divine-sense', classId: 'class-paladin', level: 1, sortOrder: 0, title: 'Божественное чувство', description: 'Обнаружение небожителей, исчадий и нежити поблизости.' },
    { id: 'feat-lay-on-hands', classId: 'class-paladin', level: 1, sortOrder: 1, title: 'Наложение рук', description: 'Запас лечения, равный 5 × уровень паладина.' },
  ],
  rewardGroups: [
    {
      id: 'rg-paladin-1-lay',
      classId: 'class-paladin',
      classLevel: 1,
      groupKind: 'FEATURE',
      sortOrder: 0,
      chooseMin: 0,
      chooseMax: 0,
      repeatable: false,
      grants: [
        { id: 'g-lay-on-hands', grantType: 'FEATURE', label: 'Наложение рук', sortOrder: 0, feature: { id: 'feat-lay-on-hands', classId: 'class-paladin', level: 1, title: 'Наложение рук' } },
      ],
      options: [],
    },
    {
      id: 'rg-paladin-3-oath',
      classId: 'class-paladin',
      classLevel: 3,
      groupKind: 'SUBCLASS',
      prompt: 'Принесите священную клятву',
      sortOrder: 0,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        { id: 'opt-oath-devotion', optionKey: 'devotion', label: 'Клятва преданности', labelRu: 'Клятва преданности', labelEn: 'Oath of Devotion', sortOrder: 0, grants: [{ id: 'g-oath-devotion', grantType: 'SUBCLASS', label: 'Клятва преданности', sortOrder: 0, subclass: label('sub-devotion', 'Клятва преданности', 'Клятва преданности', 'Oath of Devotion') }] },
        { id: 'opt-oath-vengeance', optionKey: 'vengeance', label: 'Клятва мести', labelRu: 'Клятва мести', labelEn: 'Oath of Vengeance', sortOrder: 1, grants: [{ id: 'g-oath-vengeance', grantType: 'SUBCLASS', label: 'Клятва мести', sortOrder: 0, subclass: label('sub-vengeance', 'Клятва мести', 'Клятва мести', 'Oath of Vengeance') }] },
      ],
    },
  ],
};

// === 4. Class with subclass choice at level 1 (Cleric / Жрец) ================
// Покрывает: subclass choice as the very first decision + skill choice from full list.

export const classWithSubclassChoice: FinalClassDetail = {
  id: 'class-cleric',
  slug: 'cleric',
  name: 'Cleric',
  nameRu: 'Жрец',
  nameEn: 'Cleric',
  subtitle: 'Проводник божественной силы',
  hitDie: 8,
  primaryAbilities: [WIS],
  savingThrows: [WIS, CHA],
  skillChoiceCount: 2,
  skillChoiceAny: false,
  skillOptions: [
    skill('history', 'История', 'History'),
    skill('insight', 'Проницательность', 'Insight'),
    skill('medicine', 'Медицина', 'Medicine'),
    skill('persuasion', 'Убеждение', 'Persuasion'),
    skill('religion', 'Религия', 'Religion'),
  ],
  armorProficiencyText: 'Лёгкие и средние доспехи, щиты',
  weaponProficiencyText: 'Простое оружие',
  toolProficiencyText: 'Нет',
  spellcasting: {
    isSpellcaster: true,
    spellcaster: true,
    spellcastingAbility: WIS,
    spellcastingStatId: WIS.id,
    spellcastingStatName: WIS.name,
    hasCantrips: true,
    isHalfCaster: false,
    halfCaster: false,
  },
  features: [],
  rewardGroups: [
    {
      id: 'rg-cleric-1-domain',
      classId: 'class-cleric',
      classLevel: 1,
      groupKind: 'SUBCLASS',
      prompt: 'Выберите божественный домен',
      sortOrder: 0,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        { id: 'opt-domain-life', optionKey: 'life', label: 'Домен Жизни', labelRu: 'Домен Жизни', labelEn: 'Life Domain', recommended: true, sortOrder: 0, grants: [{ id: 'g-domain-life', grantType: 'SUBCLASS', label: 'Домен Жизни', sortOrder: 0, subclass: label('sub-life', 'Домен Жизни', 'Домен Жизни', 'Life Domain') }] },
        { id: 'opt-domain-war', optionKey: 'war', label: 'Домен Войны', labelRu: 'Домен Войны', labelEn: 'War Domain', sortOrder: 1, grants: [{ id: 'g-domain-war', grantType: 'SUBCLASS', label: 'Домен Войны', sortOrder: 0, subclass: label('sub-war', 'Домен Войны', 'Домен Войны', 'War Domain') }] },
        { id: 'opt-domain-trickery', optionKey: 'trickery', label: 'Домен Обмана', labelRu: 'Домен Обмана', labelEn: 'Trickery Domain', sortOrder: 2, grants: [{ id: 'g-domain-trickery', grantType: 'SUBCLASS', label: 'Домен Обмана', sortOrder: 0, subclass: label('sub-trickery', 'Домен Обмана', 'Домен Обмана', 'Trickery Domain') }] },
      ],
    },
  ],
};

// === 5. Several reward groups at one level (Ranger / Следопыт) ===============
// Покрывает: несколько reward groups на одном уровне (auto feature + 2 разных выбора)
// + skill proficiency grant + choose-N skills.

export const classWithMultipleGroupsAtLevel: FinalClassDetail = {
  id: 'class-ranger',
  slug: 'ranger',
  name: 'Ranger',
  nameRu: 'Следопыт',
  nameEn: 'Ranger',
  subtitle: 'Охотник пограничья',
  hitDie: 10,
  primaryAbilities: [DEX, WIS],
  savingThrows: [STR, DEX],
  skillChoiceCount: 3,
  skillChoiceAny: false,
  skillOptions: [
    skill('animal-handling', 'Уход за животными', 'Animal Handling'),
    skill('athletics', 'Атлетика', 'Athletics'),
    skill('insight', 'Проницательность', 'Insight'),
    skill('investigation', 'Анализ', 'Investigation'),
    skill('nature', 'Природа', 'Nature'),
    skill('perception', 'Внимательность', 'Perception'),
    skill('stealth', 'Скрытность', 'Stealth'),
    skill('survival', 'Выживание', 'Survival'),
  ],
  armorProficiencyText: 'Лёгкие и средние доспехи, щиты',
  weaponProficiencyText: 'Простое и воинское оружие',
  toolProficiencyText: 'Нет',
  spellcasting: undefined,
  features: [
    { id: 'feat-favored-enemy', classId: 'class-ranger', level: 1, sortOrder: 0, title: 'Избранный враг' },
    { id: 'feat-natural-explorer', classId: 'class-ranger', level: 1, sortOrder: 1, title: 'Естественный исследователь' },
  ],
  rewardGroups: [
    // group A: auto feature
    {
      id: 'rg-ranger-1-feature',
      classId: 'class-ranger',
      classLevel: 1,
      groupKind: 'FEATURE',
      sortOrder: 0,
      chooseMin: 0,
      chooseMax: 0,
      repeatable: false,
      grants: [
        { id: 'g-ranger-feature', grantType: 'FEATURE', label: 'Избранный враг', sortOrder: 0, feature: { id: 'feat-favored-enemy', classId: 'class-ranger', level: 1, title: 'Избранный враг' } },
      ],
      options: [],
    },
    // group B: choose favored enemy type (skill proficiency flavored)
    {
      id: 'rg-ranger-1-enemy',
      classId: 'class-ranger',
      classLevel: 1,
      groupKind: 'CHOICE',
      prompt: 'Выберите тип избранного врага',
      sortOrder: 1,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        { id: 'opt-enemy-beasts', optionKey: 'beasts', label: 'Звери', labelRu: 'Звери', labelEn: 'Beasts', sortOrder: 0, grants: [{ id: 'g-enemy-beasts', grantType: 'CUSTOM_TEXT', label: 'Избранный враг: звери', sortOrder: 0, body: 'Преимущество на проверки Выживания для выслеживания зверей.' }] },
        { id: 'opt-enemy-undead', optionKey: 'undead', label: 'Нежить', labelRu: 'Нежить', labelEn: 'Undead', sortOrder: 1, grants: [{ id: 'g-enemy-undead', grantType: 'CUSTOM_TEXT', label: 'Избранный враг: нежить', sortOrder: 0, body: 'Преимущество на проверки Выживания для выслеживания нежити.' }] },
      ],
    },
    // group C: choose terrain (natural explorer)
    {
      id: 'rg-ranger-1-terrain',
      classId: 'class-ranger',
      classLevel: 1,
      groupKind: 'CHOICE',
      prompt: 'Выберите излюбленную местность',
      sortOrder: 2,
      chooseMin: 1,
      chooseMax: 1,
      repeatable: false,
      grants: [],
      options: [
        { id: 'opt-terrain-forest', optionKey: 'forest', label: 'Лес', labelRu: 'Лес', labelEn: 'Forest', sortOrder: 0, grants: [{ id: 'g-terrain-forest', grantType: 'SKILL_PROFICIENCY', label: 'Естественный исследователь: лес', sortOrder: 0, fixedSkill: skill('survival', 'Выживание', 'Survival') }] },
        { id: 'opt-terrain-mountain', optionKey: 'mountain', label: 'Горы', labelRu: 'Горы', labelEn: 'Mountain', sortOrder: 1, grants: [{ id: 'g-terrain-mountain', grantType: 'SKILL_PROFICIENCY', label: 'Естественный исследователь: горы', sortOrder: 0, fixedSkill: skill('survival', 'Выживание', 'Survival') }] },
      ],
    },
  ],
};

// === 6. Homebrew custom grant (Blood Hunter / Кровавый охотник) ==============
// Покрывает: CUSTOM_TEXT grant + UNKNOWN grantType (рендерится как custom/manual без краша).

export const classHomebrewCustomGrant: FinalClassDetail = {
  id: 'class-bloodhunter',
  slug: 'blood-hunter',
  name: 'Blood Hunter',
  nameRu: 'Кровавый охотник',
  nameEn: 'Blood Hunter',
  subtitle: 'Homebrew · охотник, владеющий кровавой магией',
  hitDie: 10,
  primaryAbilities: [STR, INT],
  savingThrows: [DEX, INT],
  skillChoiceCount: 1,
  skillChoiceAny: true, // любой навык на выбор
  skillOptions: [],
  armorProficiencyText: 'Лёгкие и средние доспехи, щиты',
  weaponProficiencyText: 'Простое и воинское оружие',
  toolProficiencyText: 'Нет',
  spellcasting: undefined,
  features: [
    { id: 'feat-blood-maledict', classId: 'class-bloodhunter', level: 1, sortOrder: 0, title: 'Кровавое проклятие' },
  ],
  rewardGroups: [
    {
      id: 'rg-bh-1-custom',
      classId: 'class-bloodhunter',
      classLevel: 1,
      groupKind: 'CUSTOM',
      prompt: 'Особенности кровавого охотника',
      sortOrder: 0,
      chooseMin: 0,
      chooseMax: 0,
      repeatable: false,
      grants: [
        // known custom text grant
        {
          id: 'g-bh-rite',
          grantType: 'CUSTOM_TEXT',
          label: 'Кровавый обряд',
          labelRu: 'Кровавый обряд',
          labelEn: 'Crimson Rite',
          sortOrder: 0,
          title: 'Кровавый обряд',
          body: 'Активируйте обряд на оружии, нанося себе урон и добавляя элементальный урон к атакам.',
          userEditable: true,
        },
        // UNKNOWN grant type — must render as custom/manual, not crash
        {
          id: 'g-bh-blooddice',
          grantType: 'BLOOD_DICE', // намеренно неизвестный тип
          label: 'Кость крови (d6)',
          labelRu: 'Кость крови (d6)',
          labelEn: 'Blood Die (d6)',
          sortOrder: 1,
          rawFilterText: 'd6 на старте, растёт с уровнем',
        },
      ],
      options: [],
    },
  ],
};

/** Все контрактные фикстуры в одном массиве (для dev-only viewer, Phase 3–4). */
export const contentClassFixtures: FinalClassDetail[] = [
  classNoSpellcasting,
  classFullCaster,
  classHalfCaster,
  classWithSubclassChoice,
  classWithMultipleGroupsAtLevel,
  classHomebrewCustomGrant,
];
