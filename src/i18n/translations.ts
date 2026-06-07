/**
 * Translation dictionaries for the application.
 *
 * Keys are organised by feature area. Add new keys here and they become
 * available everywhere via the `useT()` hook, e.g. `t('nav.campaigns')`.
 *
 * Russian ('ru') is the default language; English ('en') is the toggle.
 */

import { modules } from './dict';

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
    'role.GAME_MASTER': 'Летописец',
    'role.ADMIN': 'Архивариус',

    /* ── Navigation ─────────────────────────────────── */
    'nav.campaigns': 'Кампании',
    'nav.myCharacters': 'Мои персонажи',
    'nav.marketplace': 'Базар',
    'nav.myDoctrines': 'Мои доктрины',
    'nav.installed': 'Установленные',
    'nav.library': 'Библиотека',
    'nav.admin': 'Админ',
    'nav.users': 'Пользователи',
    'nav.characters': 'Персонажи',
    'nav.statTypes': 'Типы характеристик',
    'nav.itemTypes': 'Типы предметов',
    'nav.classes': 'Классы',
    'nav.races': 'Расы',
    'nav.skills': 'Навыки',
    'nav.subclasses': 'Подклассы',
    'nav.feats': 'Черты',
    'nav.buffsDebuffs': 'Баффы/Дебаффы',
    'nav.enchantments': 'Зачарования',
    'nav.homebrew': 'Хоумбрю',

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
    'common.loading': 'Загрузка…',

    /* ── Auth — shared atmospheric panel ────────────── */
    'auth.brandSub': 'Имперский Архив · MMDXLIV',
    'auth.cohort': 'Когорта VII — Хранилище Пепла и Латуни',
    'auth.version': 'в · 4.21.3 — позолочено',
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
    'auth.login.presentSeal': 'Предъяви свою Печать',
    'auth.login.awaits': 'Архив ожидает дозволения',
    'auth.login.sigilAddress': 'Адрес Сигила',
    'auth.login.sigilPlaceholder': 'Твоё избранное имя…',
    'auth.login.cipherWord': 'Шифр-Слово',
    'auth.login.recover': 'восстановить',
    'auth.login.remember': 'Привязать эту Длань к моему Сигилу',
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
    'role.GAME_MASTER': 'Chronicler',
    'role.ADMIN': 'Archivist',

    /* ── Navigation ─────────────────────────────────── */
    'nav.campaigns': 'Campaigns',
    'nav.myCharacters': 'My Characters',
    'nav.marketplace': 'Marketplace',
    'nav.myDoctrines': 'My Doctrines',
    'nav.installed': 'Installed',
    'nav.library': 'Library',
    'nav.admin': 'Admin',
    'nav.users': 'Users',
    'nav.characters': 'Characters',
    'nav.statTypes': 'Stat Types',
    'nav.itemTypes': 'Item Types',
    'nav.classes': 'Classes',
    'nav.races': 'Races',
    'nav.skills': 'Skills',
    'nav.subclasses': 'Subclasses',
    'nav.feats': 'Feats',
    'nav.buffsDebuffs': 'Buffs/Debuffs',
    'nav.enchantments': 'Enchantments',
    'nav.homebrew': 'Homebrew',

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
    'common.loading': 'Loading…',

    /* ── Auth — shared atmospheric panel ────────────── */
    'auth.brandSub': 'Imperial Archive · MMDXLIV',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.cohort': 'Cohort VII — Vault of Ash and Brass',
    'auth.version': 'v · 4.21.3 — gilded',

    /* ── Login ──────────────────────────────────────── */
    'auth.login.sacramentum': '— SACRAMENTUM —',
    'auth.login.heroTitle': 'The Chronicler’s Vigil',
    'auth.login.heroText':
      'Every blade, every wound, every covenant — recorded in the Hand of the Ordo, sealed against time and ash.',
    'auth.login.sealOfEntry': 'SEAL OF ENTRY',
    'auth.login.statChapters': 'Chapters',
    'auth.login.statSouls': 'Souls Recorded',
    'auth.login.statVigil': 'Vigil Continues',
    'auth.login.presentSeal': 'Present Thy Seal',
    'auth.login.awaits': 'The Archive awaits authorisation',
    'auth.login.sigilAddress': 'Sigil Address',
    'auth.login.sigilPlaceholder': 'Thy chosen name…',
    'auth.login.cipherWord': 'Cipher Word',
    'auth.login.recover': 'recover',
    'auth.login.remember': 'Bind this Hand to my Sigil',
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
 * Final dictionary = core keys + every feature module merged in.
 * Modules live in `./dict` so different feature areas can be translated
 * independently without touching this file.
 */
export const translations: Record<Lang, Dict> = {
  ru: Object.assign({}, core.ru, ...modules.map((m) => m.ru)),
  en: Object.assign({}, core.en, ...modules.map((m) => m.en)),
};
