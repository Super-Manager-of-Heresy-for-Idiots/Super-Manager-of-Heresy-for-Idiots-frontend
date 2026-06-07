import type { DictModule } from '../translations';

/** Character wallet page (src/pages/gm/campaigns/CharacterWalletPage). */
export const wallet: DictModule = {
  ru: {
    'camp.wallet.overline': 'Кошелёк персонажа',
    'camp.wallet.title': 'Монета и Казна',
    'camp.wallet.sub': 'Валюты, золотой эквивалент и операции',
    'camp.wallet.total': 'Итого в золоте',
    'camp.wallet.loadError': 'Не удалось загрузить кошелёк.',
    'camp.wallet.empty.title': 'Кошелёк пуст',
    'camp.wallet.empty.body': 'У этого персонажа пока не записано ни одной валюты.',

    /* ── Форма начисления / списания ── */
    'camp.wallet.form.title': 'Начисление и списание',
    'camp.wallet.form.sub': 'Изменить баланс валюты',
    'camp.wallet.form.modeAdd': 'Начислить',
    'camp.wallet.form.modeDeduct': 'Списать',
    'camp.wallet.form.currency': 'Валюта',
    'camp.wallet.form.amount': 'Сумма',
    'camp.wallet.form.preview': 'Новый баланс',
    'camp.wallet.form.submit': 'Применить',
    'camp.wallet.form.submitting': 'Применение…',
    'camp.wallet.form.insufficient': 'Недостаточно средств',
    'camp.wallet.form.noCurrencies': 'Сначала нужна хотя бы одна валюта в кошельке.',

    /* ── Журнал операций ── */
    'camp.wallet.journal.title': 'Журнал операций',
    'camp.wallet.journal.sub': 'Последние изменения баланса',
    'camp.wallet.journal.showAll': 'Показать все',
    'camp.wallet.journal.empty': 'Операций пока нет.',
    'camp.wallet.journal.col.when': 'Когда',
    'camp.wallet.journal.col.currency': 'Валюта',
    'camp.wallet.journal.col.delta': 'Δ',
    'camp.wallet.journal.col.balance': 'Баланс',
    'camp.wallet.journal.col.reason': 'Причина',
    'camp.wallet.journal.col.by': 'Кем',
    'camp.wallet.journal.prev': 'Назад',
    'camp.wallet.journal.next': 'Далее',
    'camp.wallet.journal.page': 'Стр. {page} из {total}',

    /* ── Управление балансами (экран мастера) ── */
    'camp.balances.overline': 'Управление балансами',
    'camp.balances.title': 'Казна кампании',
    'camp.balances.sub': 'Начисление и списание валют игрокам',
    'camp.balances.pickTitle': 'Персонажи',
    'camp.balances.pickSub': 'Выберите, кому изменить баланс',
    'camp.balances.pickEmpty': 'В кампании пока нет персонажей.',
    'camp.balances.selectPrompt.title': 'Выберите персонажа',
    'camp.balances.selectPrompt.body': 'Выберите персонажа слева, чтобы просмотреть и изменить его кошелёк.',
    'camp.balances.walletTitle': 'Кошелёк',
    'camp.balances.walletEmpty': 'У персонажа пока нет валют.',
    'camp.balances.loadError': 'Не удалось загрузить данные.',
    'camp.balances.noCurrencies': 'В кампании не настроены валюты.',

    /* ── Фолио (урезанный вид) ── */
    'camp2.folio.coinTotal': 'Итого ≈ {amount} зм',
  },

  en: {
    'camp.wallet.overline': 'Character wallet',
    'camp.wallet.title': 'Coin & Coffer',
    'camp.wallet.sub': 'Currencies, gold equivalent and operations',
    'camp.wallet.total': 'Total in gold',
    'camp.wallet.loadError': 'Failed to load the wallet.',
    'camp.wallet.empty.title': 'Wallet is empty',
    'camp.wallet.empty.body': 'No currency is recorded for this character yet.',

    /* ── Add / deduct form ── */
    'camp.wallet.form.title': 'Add & Deduct',
    'camp.wallet.form.sub': 'Adjust a currency balance',
    'camp.wallet.form.modeAdd': 'Add',
    'camp.wallet.form.modeDeduct': 'Deduct',
    'camp.wallet.form.currency': 'Currency',
    'camp.wallet.form.amount': 'Amount',
    'camp.wallet.form.preview': 'New balance',
    'camp.wallet.form.submit': 'Apply',
    'camp.wallet.form.submitting': 'Applying…',
    'camp.wallet.form.insufficient': 'Insufficient funds',
    'camp.wallet.form.noCurrencies': 'At least one currency in the wallet is required first.',

    /* ── Operations journal ── */
    'camp.wallet.journal.title': 'Operations journal',
    'camp.wallet.journal.sub': 'Recent balance changes',
    'camp.wallet.journal.showAll': 'Show all',
    'camp.wallet.journal.empty': 'No operations yet.',
    'camp.wallet.journal.col.when': 'When',
    'camp.wallet.journal.col.currency': 'Currency',
    'camp.wallet.journal.col.delta': 'Δ',
    'camp.wallet.journal.col.balance': 'Balance',
    'camp.wallet.journal.col.reason': 'Reason',
    'camp.wallet.journal.col.by': 'By',
    'camp.wallet.journal.prev': 'Prev',
    'camp.wallet.journal.next': 'Next',
    'camp.wallet.journal.page': 'Page {page} of {total}',

    /* ── Balance management (GM screen) ── */
    'camp.balances.overline': 'Balance management',
    'camp.balances.title': 'Campaign treasury',
    'camp.balances.sub': 'Credit and debit player currencies',
    'camp.balances.pickTitle': 'Characters',
    'camp.balances.pickSub': 'Choose whose balance to change',
    'camp.balances.pickEmpty': 'No characters in this campaign yet.',
    'camp.balances.selectPrompt.title': 'Select a character',
    'camp.balances.selectPrompt.body': 'Pick a character on the left to view and adjust their wallet.',
    'camp.balances.walletTitle': 'Wallet',
    'camp.balances.walletEmpty': 'No currencies yet.',
    'camp.balances.loadError': 'Failed to load data.',
    'camp.balances.noCurrencies': 'No currencies are configured for this campaign.',

    /* ── Folio (reduced view) ── */
    'camp2.folio.coinTotal': 'Total ≈ {amount} gp',
  },
};
