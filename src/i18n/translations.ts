/**
 * Translation dictionaries for the application.
 *
 * Keys are organised by feature area. Add new keys here and they become
 * available everywhere via the `useT()` hook, e.g. `t('nav.campaigns')`.
 *
 * Russian ('ru') is the default language; English ('en') is the toggle.
 */

export type Lang = 'ru' | 'en';

export const LANGS: Lang[] = ['ru', 'en'];

export type Dict = Record<string, string>;

export interface DictModule {
  ru: Dict;
  en: Dict;
}

const core: Record<Lang, Dict> = {
  ru: {
    /* ── Brand / chrome ─────────────────────────────── */
    'app.name': 'Ordo Arcanum',

    /* ── Roles ──────────────────────────────────────── */
    'role.PLAYER': 'Длань Судьбы',
    'role.GM': 'Летописец',
    'role.GAME_MASTER': 'Летописец',
    'role.ADMIN': 'Архивариус',

    /* ── Navigation ─────────────────────────────────── */
    'nav.campaigns': 'Кампании',
    'nav.myCharacters': 'Мои персонажи',
    'nav.friends': 'Друзья',
    'nav.messages': 'Сообщения',
    'nav.marketplace': 'Базар',
    'nav.blueprintMarket': 'Шаблоны кампаний',
    'nav.myBlueprints': 'Мои шаблоны',
    'nav.myDoctrines': 'Мои доктрины',
    'nav.installed': 'Установленные',
    'nav.library': 'Библиотека',
    'nav.admin': 'Админ',
    'nav.users': 'Пользователи',
    'nav.characters': 'Персонажи',
    'nav.statTypes': 'Типы характеристик',
    'nav.itemTypes': 'Типы предметов',
    'nav.itemTemplates': 'Шаблоны предметов',
    'nav.itemCatalog': 'Каталог предметов',
    'nav.classes': 'Классы',
    'nav.races': 'Species',
    'nav.species': 'Species',
    'nav.skills': 'Навыки',
    'nav.subclasses': 'Подклассы',
    'nav.feats': 'Черты',
    'nav.buffsDebuffs': 'Баффы/Дебаффы',
    'nav.enchantments': 'Зачарования',
    'nav.contentQuality': 'Качество контента',
    'nav.spellWarnings': 'Проблемные заклинания',
    'nav.classFeatureWarnings': 'Проблемные умения',
    'nav.ruleWorkbench': 'Мастерская правил',
    'nav.resourceTypes': 'Ресурсы классов',
    'nav.homebrew': 'Хоумбрю',
    'nav.bestiary': 'Бестиарий',
    'nav.bestiaryDicts': 'Справочники бестиария',

    /* ── Navigation descriptions (rail / drawer) ────── */
    'nav.desc.campaigns': 'Ваши кампании и сессии',
    'nav.desc.myCharacters': 'Шаблоны и заготовки персонажей',
    'nav.desc.friends': 'Заявки, друзья и блокировки',
    'nav.desc.messages': 'Личная переписка с друзьями',
    'nav.desc.marketplace': 'Торговая площадка предметов и доктрин',
    'nav.desc.blueprintMarket': 'Готовые шаблоны кампаний',
    'nav.desc.myBlueprints': 'Ваши черновики и форки шаблонов',
    'nav.desc.myDoctrines': 'Созданные вами наборы правил',
    'nav.desc.installed': 'Подключённые доктрины',
    'nav.desc.library': 'Общая библиотека контента',
    'nav.desc.admin': 'Панель управления системой',
    'nav.desc.users': 'Управление учётными записями',
    'nav.desc.characters': 'Все персонажи системы',
    'nav.desc.statTypes': 'Базовые характеристики',
    'nav.desc.itemTypes': 'Категории предметов',
    'nav.desc.itemTemplates': 'Чертежи предметов для выдачи',
    'nav.desc.itemCatalog': 'Снаряжение и магические предметы',
    'nav.desc.classes': 'Классы персонажей',
    'nav.desc.races': 'Species',
    'nav.desc.species': 'Species from the normalized content model',
    'nav.desc.skills': 'Навыки и умения',
    'nav.desc.subclasses': 'Архетипы и специализации',
    'nav.desc.feats': 'Черты и таланты',
    'nav.desc.buffsDebuffs': 'Эффекты усиления и ослабления',
    'nav.desc.enchantments': 'Типы зачарований',
    'nav.desc.contentQuality': 'Аудит content-модели',
    'nav.desc.spellWarnings': 'Разбор заклинаний на проверке',
    'nav.desc.classFeatureWarnings': 'Разбор умений на проверке',
    'nav.desc.ruleWorkbench': 'Правила умений: rules, issues, coverage',
    'nav.desc.homebrew': 'Пользовательский контент',
    'nav.desc.bestiary': 'Монстры и существа',
    'nav.desc.bestiaryDicts': 'Справочники бестиария',

    /* ── Account switcher ───────────────────────────── */
    'acct.section': 'Аккаунты',
    'acct.current': 'Текущий аккаунт',
    'acct.switch': 'Сменить аккаунт',
    'acct.add': 'Добавить аккаунт',
    'acct.remove': 'Убрать из списка',
    'acct.active': 'Активен',

    /* ── Top bar actions ────────────────────────────── */
    'topbar.logout': 'Покинуть Архив',
    'topbar.menu': 'Меню',
    'lang.label': 'Язык',
    'lang.ru': 'Русский',
    'lang.en': 'English',

    /* ── Common ─────────────────────────────────────── */
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.save': 'Сохранить',
    'common.edit': 'Изменить',
    'common.confirm': 'Подтвердить',
    'common.done': 'Готово',
    'common.loading': 'Загрузка…',
    'spellPicker.title': 'Выбор заклинаний',
    'spellPicker.choose': 'Выбрать заклинания',
    'spellPicker.empty': 'Заклинания не выбраны',

    /* ── Auth — shared atmospheric panel ────────────── */
    'auth.brandSub': 'Имперский Архив · {currentYearRoman}',
    'auth.cohort': 'Когорта {cohortNumber} — {releaseName}',
    'auth.version': 'в · {version} — позолочено',
    'auth.showPassword': 'Показать пароль',
    'auth.hidePassword': 'Скрыть пароль',

    /* ── Login ──────────────────────────────────────── */
    'auth.login.sacramentum': '— SACRAMENTUM —',
    'auth.login.heroTitle': 'Бдение Летописца',
    'auth.login.heroText':
      'Каждый клинок, каждая рана, каждый завет — записаны Дланью Ордо, запечатаны против времени и пепла.',
    'auth.login.sealOfEntry': 'ПЕЧАТЬ ВХОДА',
    'auth.login.statChapters': 'Главы',
    'auth.login.statSouls': 'Записано душ',
    'auth.login.statVigil': 'Бдение длится',
    'auth.login.statVigilValue': '{days} d',
    'auth.login.presentSeal': 'Предъяви свою Печать',
    'auth.login.awaits': 'Архив ожидает дозволения',
    'auth.login.sigilAddress': 'Адрес Сигила',
    'auth.login.sigilPlaceholder': 'Твоё избранное имя…',
    'auth.login.cipherWord': 'Шифр-Слово',
    'auth.login.recover': 'восстановить',
    'auth.login.submitting': 'Снятие печати…',
    'auth.login.submit': 'Войти в Архив',
    'auth.login.or': 'ИЛИ',
    'auth.login.acceptInvite': 'Принять Приглашение',
    'auth.login.footer': 'Начертано Ордо · Скреплено клятвой',
    'auth.login.errUsername': 'Требуется имя пользователя',
    'auth.login.errPassword': 'Требуется пароль',

    /* ── Register ───────────────────────────────────── */
    'auth.register.inscriptio': '— INSCRIPTIO NOVA —',
    'auth.register.heroTitle': 'Начертай своё Имя',
    'auth.register.heroText':
      'Ни одна душа не входит в Архив незаписанной. Избери своё звание, задай свой шифр и будь привязан к реестру Ордо.',
    'auth.register.riteOfEnrolment': 'ОБРЯД ЗАЧИСЛЕНИЯ',
    'auth.register.statHands': 'Принёсших клятву Дланей',
    'auth.register.statChroniclers': 'Летописцев',
    'auth.register.statNames': 'Имён за эту Луну',
    'auth.register.riteTitle': 'Обряд Начертания',
    'auth.register.riteSub': 'Поставь свой знак в свитках',
    'auth.register.chosenName': 'Избранное Имя',
    'auth.register.chosenNameHint': '3–30 знаков · буквы, цифры, подчёркивание',
    'auth.register.sigilAddress': 'Адрес Сигила',
    'auth.register.cipherWord': 'Шифр-Слово',
    'auth.register.cipherHint': 'мин. 8 знаков',
    'auth.register.repeatCipher': 'Повтори Шифр',
    'auth.register.chooseOffice': 'ИЗБЕРИ СВОЁ ЗВАНИЕ',
    'auth.register.player': 'Игрок',
    'auth.register.playerDesc': 'Длань Судьбы — ищи приключения, выкуй свою легенду.',
    'auth.register.gm': 'Мастер Игры',
    'auth.register.gmDesc': 'Летописец — плети сказание, повелевай сценой.',
    'auth.register.submitting': 'Начертание…',
    'auth.register.submit': 'Начертать моё Имя',
    'auth.register.already': 'Уже состоишь? ',
    'auth.register.enterVigil': 'Войти в Бдение →',
    'auth.register.charter': 'Начертав, ты подчиняешься Хартии Архива',
    'auth.register.errUsernameMin': 'Имя должно быть не короче 3 символов',
    'auth.register.errUsernameMax': 'Имя должно быть не длиннее 30 символов',
    'auth.register.errUsernameRegex':
      'Имя может содержать только буквы, цифры и подчёркивания',
    'auth.register.errEmail': 'Неверный адрес эл. почты',
    'auth.register.errPasswordMin': 'Пароль должен быть не короче 8 символов',
    'auth.register.errPasswordMatch': 'Пароли не совпадают',

    /* ── My Characters (templates) ──────────────────── */
    'common.retry': 'Повторить',
    'common.open': 'Открыть',
    'chars.loadError': 'Не удалось загрузить ваших персонажей.',
    'chars.overline': 'Хранилище Душ',
    'chars.title': 'Мои персонажи',
    'chars.subtitle':
      'Ванильные «болванки» персонажей — без хоумбрю. Можно загрузить в любую кампанию.',
    'chars.empty.overline': 'Шаблоны',
    'chars.empty.title': 'У вас нет ванильных персонажей',
    'chars.empty.body':
      'Создайте «болванку» — её можно загружать в любую кампанию повторно.',
    'chars.createTemplate': 'Создать шаблон',
    'chars.delete.title': 'Удалить шаблон?',
    'chars.delete.body':
      '«{name}» будет удалён безвозвратно. Уже добавленные в кампании копии останутся.',
    'chars.deleteTemplateTitle': 'Удалить шаблон',
    'chars.inCampaign': 'В кампании',
    'chars.template': 'Шаблон',
  },

  en: {
    /* ── Brand / chrome ─────────────────────────────── */
    'app.name': 'Ordo Arcanum',

    /* ── Roles ──────────────────────────────────────── */
    'role.PLAYER': 'Hand of Fate',
    'role.GM': 'Chronicler',
    'role.GAME_MASTER': 'Chronicler',
    'role.ADMIN': 'Archivist',

    /* ── Navigation ─────────────────────────────────── */
    'nav.campaigns': 'Campaigns',
    'nav.myCharacters': 'My Characters',
    'nav.friends': 'Friends',
    'nav.messages': 'Messages',
    'nav.marketplace': 'Marketplace',
    'nav.blueprintMarket': 'Campaign Blueprints',
    'nav.myBlueprints': 'My Blueprints',
    'nav.myDoctrines': 'My Doctrines',
    'nav.installed': 'Installed',
    'nav.library': 'Library',
    'nav.admin': 'Admin',
    'nav.users': 'Users',
    'nav.characters': 'Characters',
    'nav.statTypes': 'Stat Types',
    'nav.itemTypes': 'Item Types',
    'nav.itemTemplates': 'Item Templates',
    'nav.itemCatalog': 'Item Catalog',
    'nav.classes': 'Classes',
    'nav.races': 'Species',
    'nav.species': 'Species',
    'nav.skills': 'Skills',
    'nav.subclasses': 'Subclasses',
    'nav.feats': 'Feats',
    'nav.buffsDebuffs': 'Buffs/Debuffs',
    'nav.enchantments': 'Enchantments',
    'nav.contentQuality': 'Content quality',
    'nav.spellWarnings': 'Spell warnings',
    'nav.classFeatureWarnings': 'Feature warnings',
    'nav.ruleWorkbench': 'Rule Workbench',
    'nav.resourceTypes': 'Class Resources',
    'nav.homebrew': 'Homebrew',
    'nav.bestiary': 'Bestiary',
    'nav.bestiaryDicts': 'Bestiary dictionaries',

    /* ── Navigation descriptions (rail / drawer) ────── */
    'nav.desc.campaigns': 'Your campaigns and sessions',
    'nav.desc.myCharacters': 'Character templates and drafts',
    'nav.desc.friends': 'Requests, friends and blocks',
    'nav.desc.messages': 'Private chat with friends',
    'nav.desc.marketplace': 'Marketplace of items and doctrines',
    'nav.desc.blueprintMarket': 'Ready-made campaign blueprints',
    'nav.desc.myBlueprints': 'Your blueprint drafts and forks',
    'nav.desc.myDoctrines': 'Rule sets you have authored',
    'nav.desc.installed': 'Doctrines you have installed',
    'nav.desc.library': 'Shared content library',
    'nav.desc.admin': 'System control panel',
    'nav.desc.users': 'Manage user accounts',
    'nav.desc.characters': 'All characters in the system',
    'nav.desc.statTypes': 'Core stat definitions',
    'nav.desc.itemTypes': 'Item categories',
    'nav.desc.itemTemplates': 'Item blueprints for granting',
    'nav.desc.itemCatalog': 'Equipment and magic items',
    'nav.desc.classes': 'Character classes',
    'nav.desc.races': 'Species',
    'nav.desc.species': 'Species from the normalized content model',
    'nav.desc.skills': 'Skills and abilities',
    'nav.desc.subclasses': 'Archetypes and specializations',
    'nav.desc.feats': 'Feats and talents',
    'nav.desc.buffsDebuffs': 'Buff and debuff effects',
    'nav.desc.enchantments': 'Enchantment types',
    'nav.desc.contentQuality': 'Content model audit',
    'nav.desc.spellWarnings': 'Spell parsing review',
    'nav.desc.classFeatureWarnings': 'Feature parsing review',
    'nav.desc.ruleWorkbench': 'Feature rules: rules, issues, coverage',
    'nav.desc.homebrew': 'User-created content',
    'nav.desc.bestiary': 'Monsters and creatures',
    'nav.desc.bestiaryDicts': 'Bestiary reference dictionaries',

    /* ── Account switcher ───────────────────────────── */
    'acct.section': 'Accounts',
    'acct.current': 'Current account',
    'acct.switch': 'Switch account',
    'acct.add': 'Add account',
    'acct.remove': 'Remove from list',
    'acct.active': 'Active',

    /* ── Top bar actions ────────────────────────────── */
    'topbar.logout': 'Leave the Archive',
    'topbar.menu': 'Menu',
    'lang.label': 'Language',
    'lang.ru': 'Русский',
    'lang.en': 'English',

    /* ── Common ─────────────────────────────────────── */
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.confirm': 'Confirm',
    'common.done': 'Done',
    'common.loading': 'Loading…',
    'spellPicker.title': 'Choose spells',
    'spellPicker.choose': 'Choose spells',
    'spellPicker.empty': 'No spells selected',

    /* ── Auth — shared atmospheric panel ────────────── */
    'auth.brandSub': 'Imperial Archive · {currentYearRoman}',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.cohort': 'Cohort {cohortNumber} — {releaseName}',
    'auth.version': 'v · {version} — gilded',

    /* ── Login ──────────────────────────────────────── */
    'auth.login.sacramentum': '— SACRAMENTUM —',
    'auth.login.heroTitle': 'The Chronicler’s Vigil',
    'auth.login.heroText':
      'Every blade, every wound, every covenant — recorded in the Hand of the Ordo, sealed against time and ash.',
    'auth.login.sealOfEntry': 'SEAL OF ENTRY',
    'auth.login.statChapters': 'Chapters',
    'auth.login.statSouls': 'Souls Recorded',
    'auth.login.statVigil': 'Vigil Duration',
    'auth.login.statVigilValue': '{days} d',
    'auth.login.presentSeal': 'Present Thy Seal',
    'auth.login.awaits': 'The Archive awaits authorisation',
    'auth.login.sigilAddress': 'Sigil Address',
    'auth.login.sigilPlaceholder': 'Thy chosen name…',
    'auth.login.cipherWord': 'Cipher Word',
    'auth.login.recover': 'recover',
    'auth.login.submitting': 'Unsealing…',
    'auth.login.submit': 'Enter the Archive',
    'auth.login.or': 'OR',
    'auth.login.acceptInvite': 'Accept Invitation',
    'auth.login.footer': 'Inscribed by the Ordo · Bound by oath',
    'auth.login.errUsername': 'Username is required',
    'auth.login.errPassword': 'Password is required',

    /* ── Register ───────────────────────────────────── */
    'auth.register.inscriptio': '— INSCRIPTIO NOVA —',
    'auth.register.heroTitle': 'Inscribe Thy Name',
    'auth.register.heroText':
      'No soul enters the Archive unrecorded. Choose thy office, set thy cipher, and be bound to the ledger of the Ordo.',
    'auth.register.riteOfEnrolment': 'RITE OF ENROLMENT',
    'auth.register.statHands': 'Hands Sworn',
    'auth.register.statChroniclers': 'Chroniclers',
    'auth.register.statNames': 'Names This Moon',
    'auth.register.riteTitle': 'Rite of Inscription',
    'auth.register.riteSub': 'Set thy mark upon the rolls',
    'auth.register.chosenName': 'Chosen Name',
    'auth.register.chosenNameHint': '3–30 glyphs · letters, numerals, underscore',
    'auth.register.sigilAddress': 'Sigil Address',
    'auth.register.cipherWord': 'Cipher Word',
    'auth.register.cipherHint': 'min. 8 glyphs',
    'auth.register.repeatCipher': 'Repeat Cipher',
    'auth.register.chooseOffice': 'CHOOSE THY OFFICE',
    'auth.register.player': 'Player',
    'auth.register.playerDesc': 'The Hand of Fate — seek adventure, forge thy legend.',
    'auth.register.gm': 'Game Master',
    'auth.register.gmDesc': 'The Chronicler — weave the tale, command the stage.',
    'auth.register.submitting': 'Inscribing…',
    'auth.register.submit': 'Inscribe My Name',
    'auth.register.already': 'Already a member? ',
    'auth.register.enterVigil': 'Enter the Vigil →',
    'auth.register.charter': 'By inscribing, thou submit to the Archive Charter',
    'auth.register.errUsernameMin': 'Username must be at least 3 characters',
    'auth.register.errUsernameMax': 'Username must be at most 30 characters',
    'auth.register.errUsernameRegex':
      'Username can only contain letters, numbers, and underscores',
    'auth.register.errEmail': 'Invalid email address',
    'auth.register.errPasswordMin': 'Password must be at least 8 characters',
    'auth.register.errPasswordMatch': 'Passwords do not match',

    /* ── My Characters (templates) ──────────────────── */
    'common.retry': 'Retry',
    'common.open': 'Open',
    'chars.loadError': 'Failed to load your characters.',
    'chars.overline': 'Vault of Souls',
    'chars.title': 'My Characters',
    'chars.subtitle':
      'Vanilla character blanks — no homebrew. Can be loaded into any campaign.',
    'chars.empty.overline': 'Templates',
    'chars.empty.title': 'You have no vanilla characters',
    'chars.empty.body':
      'Create a blank — it can be loaded into any campaign repeatedly.',
    'chars.createTemplate': 'Create template',
    'chars.delete.title': 'Delete template?',
    'chars.delete.body':
      '“{name}” will be deleted permanently. Copies already added to campaigns will remain.',
    'chars.deleteTemplateTitle': 'Delete template',
    'chars.inCampaign': 'In campaign',
    'chars.template': 'Template',
  },
};

/**
 * Core dictionary is enough for the app chrome and auth screens. Feature
 * dictionaries are loaded asynchronously so first paint is not blocked by all
 * translation strings.
 */
export const coreTranslations: Record<Lang, Dict> = core;

export async function loadFeatureTranslations(): Promise<Record<Lang, Dict>> {
  const { modules } = await import('./dict');

  return {
    ru: Object.assign({}, ...modules.map((m) => m.ru)),
    en: Object.assign({}, ...modules.map((m) => m.en)),
  };
}

export async function loadTranslations(): Promise<Record<Lang, Dict>> {
  const featureTranslations = await loadFeatureTranslations();

  return {
    ru: { ...core.ru, ...featureTranslations.ru },
    en: { ...core.en, ...featureTranslations.en },
  };
}
