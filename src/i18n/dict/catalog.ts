import type { DictModule } from '../translations';

/**
 * Item catalog module — the read-only reference catalog page
 * (`/library/items` and the in-campaign `items` route): equipment
 * (weapon / armor / gear / tool / …) and magic items, with their
 * filters and detail dialogs.
 */
export const catalog: DictModule = {
  ru: {
    'cat.overline': 'Справочник · арсенал',
    'cat.title': 'Каталог предметов',
    'cat.subtitle': 'Снаряжение и магические предметы из правил и хоумбрю.',
    'cat.subtitleCampaign': 'Доступно в этой кампании: ядро правил + активный хоумбрю.',
    'cat.tab.equipment': 'Снаряжение',
    'cat.tab.magic': 'Магические предметы',

    'cat.search': 'Поиск по названию…',
    'cat.filter.all': 'Все',
    'cat.filter.category': 'Категория',
    'cat.filter.allCategories': 'Все категории',
    'cat.filter.type': 'Тип',
    'cat.filter.allTypes': 'Все типы',
    'cat.source.core': 'Ядро',
    'cat.source.homebrew': 'Хоумбрю',

    'cat.kind.weapon': 'Оружие',
    'cat.kind.armor': 'Броня',
    'cat.kind.gear': 'Снаряжение',
    'cat.kind.tool': 'Инструменты',
    'cat.kind.ammunition': 'Боеприпасы',

    'cat.count': 'Найдено: {n}',
    'cat.error.title': 'Не удалось загрузить каталог',
    'cat.error.body': 'Архив реликвий недоступен. Попробуйте позже.',
    'cat.empty.title': 'Ничего не найдено',
    'cat.empty.body': 'Измените фильтры или строку поиска.',
    'cat.homebrew': 'Хоумбрю',

    'cat.field.category': 'Категория',
    'cat.field.cost': 'Стоимость',
    'cat.field.weight': 'Вес',
    'cat.field.weightUnit': 'фнт',
    'cat.field.properties': 'Свойства',
    'cat.field.sourceLink': 'Открыть в справочнике',

    'cat.weapon.title': 'Оружие',
    'cat.weapon.damage': 'Урон',
    'cat.weapon.damageType': 'Тип урона',
    'cat.weapon.flat': 'Фикс. урон',
    'cat.weapon.mastery': 'Мастерство',
    'cat.weapon.properties': 'Свойства оружия',
    'cat.weapon.rangeUnit': 'фт',
    'cat.weapon.versatile': 'универсальное',

    'cat.armor.title': 'Броня',
    'cat.armor.acRaw': 'КД',
    'cat.armor.baseAc': 'Базовый КД',
    'cat.armor.maxDex': 'Макс. бонус Ловкости',
    'cat.armor.strReq': 'Требуется Сила',
    'cat.armor.stealth': 'Помеха Скрытности',

    'cat.yes': 'Да',
    'cat.no': 'Нет',
    'cat.attunement.required': 'Требуется настройка',
    'cat.attunement.no': 'Без настройки',
    'cat.attunement.short': 'Настройка',

    'cat.magic.type': 'Тип',
    'cat.magic.typeRestriction': 'Ограничение по типу',
    'cat.magic.variableRarity': 'Переменная редкость',
    'cat.magic.attunement': 'Настройка',
    'cat.magic.allowedEquipment': 'Применимо к снаряжению',
    'cat.magic.description': 'Описание',
  },
  en: {
    'cat.overline': 'Reference · armoury',
    'cat.title': 'Item Catalog',
    'cat.subtitle': 'Equipment and magic items from the rules and homebrew.',
    'cat.subtitleCampaign': 'Available in this campaign: core rules + active homebrew.',
    'cat.tab.equipment': 'Equipment',
    'cat.tab.magic': 'Magic Items',

    'cat.search': 'Search by name…',
    'cat.filter.all': 'All',
    'cat.filter.category': 'Category',
    'cat.filter.allCategories': 'All categories',
    'cat.filter.type': 'Type',
    'cat.filter.allTypes': 'All types',
    'cat.source.core': 'Core',
    'cat.source.homebrew': 'Homebrew',

    'cat.kind.weapon': 'Weapons',
    'cat.kind.armor': 'Armor',
    'cat.kind.gear': 'Gear',
    'cat.kind.tool': 'Tools',
    'cat.kind.ammunition': 'Ammunition',

    'cat.count': 'Found: {n}',
    'cat.error.title': 'Failed to load the catalog',
    'cat.error.body': 'The relic archive is unavailable. Try again later.',
    'cat.empty.title': 'Nothing found',
    'cat.empty.body': 'Adjust the filters or search query.',
    'cat.homebrew': 'Homebrew',

    'cat.field.category': 'Category',
    'cat.field.cost': 'Cost',
    'cat.field.weight': 'Weight',
    'cat.field.weightUnit': 'lb',
    'cat.field.properties': 'Properties',
    'cat.field.sourceLink': 'Open in reference',

    'cat.weapon.title': 'Weapon',
    'cat.weapon.damage': 'Damage',
    'cat.weapon.damageType': 'Damage type',
    'cat.weapon.flat': 'Flat damage',
    'cat.weapon.mastery': 'Mastery',
    'cat.weapon.properties': 'Weapon properties',
    'cat.weapon.rangeUnit': 'ft',
    'cat.weapon.versatile': 'versatile',

    'cat.armor.title': 'Armor',
    'cat.armor.acRaw': 'AC',
    'cat.armor.baseAc': 'Base AC',
    'cat.armor.maxDex': 'Max Dex bonus',
    'cat.armor.strReq': 'Strength required',
    'cat.armor.stealth': 'Stealth disadvantage',

    'cat.yes': 'Yes',
    'cat.no': 'No',
    'cat.attunement.required': 'Attunement required',
    'cat.attunement.no': 'No attunement',
    'cat.attunement.short': 'Attunement',

    'cat.magic.type': 'Type',
    'cat.magic.typeRestriction': 'Type restriction',
    'cat.magic.variableRarity': 'Variable rarity',
    'cat.magic.attunement': 'Attunement',
    'cat.magic.allowedEquipment': 'Applies to equipment',
    'cat.magic.description': 'Description',
  },
};
