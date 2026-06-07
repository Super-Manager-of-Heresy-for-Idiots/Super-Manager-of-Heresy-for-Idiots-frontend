import type { DictModule } from '../translations';

/** Shared components (src/components/**). */
export const components: DictModule = {
  ru: {
    /* ── characters/AbilityCheckPanel ───────────────── */
    'cmp.ability.empty': 'Выберите характеристику, чтобы увидеть разбор проверки',
    'cmp.ability.total': 'Итог',

    /* ── characters/DamageHealModal ─────────────────── */
    'cmp.dmgHeal.applyDamage': 'Нанести урон',
    'cmp.dmgHeal.applyHealing': 'Исцелить',
    'cmp.dmgHeal.applying': 'Применение…',
    'cmp.dmgHeal.apply': 'Применить',
    'cmp.dmgHeal.damage': 'Урон',
    'cmp.dmgHeal.heal': 'Исцеление',
    'cmp.dmgHeal.amount': 'Величина',
    'cmp.dmgHeal.preview': 'Предпросмотр',

    /* ── characters/HPRailPanel ─────────────────────── */
    'cmp.hp.title': 'Витае · Очки здоровья',
    'cmp.hp.hale': 'В силе',
    'cmp.hp.damage': 'Урон',
    'cmp.hp.heal': 'Исцеление',
    'cmp.hp.advanced': 'Подробнее…',

    /* ── characters/MulticlassPanel ─────────────────── */
    'cmp.multiclass.title': 'Классы и Клятвы',
    'cmp.multiclass.addClass': 'Добавить класс',
    'cmp.multiclass.totalLevel': 'Общий уровень',

    /* ── characters/ReadOnlyOverlay ─────────────────── */
    'cmp.readonly.dead':
      'Этот персонаж пал, и его лист запечатан.',
    'cmp.readonly.reserve':
      'Этот персонаж в резерве, и его лист заблокирован.',
    'cmp.readonly.default': 'Этот лист персонажа доступен только для чтения.',

    /* ── characters/ResourcesPanel ──────────────────── */
    'cmp.resources.title': 'Запасы и Источники',
    'cmp.resources.add': 'Добавить',
    'cmp.resources.decrease': 'Уменьшить {name}',
    'cmp.resources.increase': 'Увеличить {name}',
    'cmp.resources.noMax': '{value} (без предела)',
    'cmp.resources.empty': 'Ресурсы не отслеживаются',

    /* ── characters/StatusControlPanel ──────────────── */
    'cmp.status.title': 'Состояние души',
    'cmp.status.active':
      'Персонаж жив и странствует в текущей кампании.',
    'cmp.status.dead': 'Персонаж пал. Лист становится доступен только для чтения.',
    'cmp.status.reserve':
      'Персонаж отправлен в резерв. Лист становится доступен только для чтения.',

    /* ── characters/WalletPanel ─────────────────────── */
    'cmp.wallet.title': 'Монета и Казна',
    'cmp.wallet.gp': '{amount} зм',
    'cmp.wallet.decrease': 'Уменьшить {name}',
    'cmp.wallet.increase': 'Увеличить {name}',
    'cmp.wallet.empty': 'Валюты не отслеживаются',
    'cmp.wallet.addCurrency': 'Добавить валюту',

    /* ── items/RarityBadge ──────────────────────────── */
    'cmp.rarity.COMMON': 'Обычное',
    'cmp.rarity.UNCOMMON': 'Необычное',
    'cmp.rarity.RARE': 'Редкое',
    'cmp.rarity.VERY_RARE': 'Очень редкое',
    'cmp.rarity.LEGENDARY': 'Легендарное',

    /* ── items/InvRow ───────────────────────────────── */
    'cmp.slot.HEAD': 'Голова',
    'cmp.slot.CHEST': 'Грудь',
    'cmp.slot.LEGS': 'Ноги',
    'cmp.slot.FEET': 'Стопы',
    'cmp.slot.MAIN_HAND': 'Основная рука',
    'cmp.slot.OFF_HAND': 'Вторая рука',
    'cmp.slot.RING_LEFT': 'Кольцо (Л)',
    'cmp.slot.RING_RIGHT': 'Кольцо (П)',
    'cmp.slot.NECK': 'Шея',
    'cmp.slot.CLOAK': 'Плащ',
    'cmp.inv.unique': 'Уникальное',
    'cmp.inv.equipped': 'Надето',
    'cmp.inv.originally': '(изначально {name})',
    'cmp.inv.rename': 'Переименовать',
    'cmp.inv.transfer': 'Передать',
    'cmp.inv.more': 'Ещё',

    /* ── items/ItemTransferModal ────────────────────── */
    'cmp.transfer.transfer': 'Передать',
    'cmp.transfer.overline': 'Передача',
    'cmp.transfer.title': 'Передать предмет',
    'cmp.transfer.recipient': 'Получатель',
    'cmp.transfer.noMembers': 'В этой кампании нет других участников.',
    'cmp.transfer.quantity': 'Количество',
    'cmp.transfer.available': 'Доступно: {count}',
    'cmp.transfer.equippedItem': 'Надетый предмет',
    'cmp.transfer.equippedWarning':
      'Этот предмет сейчас надет. При передаче он будет автоматически снят с текущего владельца.',

    /* ── items/RenameStackModal ─────────────────────── */
    'cmp.rename.modeWholeLabel': 'Переименовать всю стопку',
    'cmp.rename.modeWholeDesc': 'Применяет новое имя ко всем предметам в стопке.',
    'cmp.rename.modeSplitLabel': 'Отделить один и назвать',
    'cmp.rename.modeSplitDesc':
      'Отделяет один предмет от стопки и даёт ему уникальное имя.',
    'cmp.rename.rename': 'Переименовать',
    'cmp.rename.overline': 'Начертание',
    'cmp.rename.title': 'Переименовать стопку',
    'cmp.rename.mode': 'Режим переименования',
    'cmp.rename.newName': 'Новое имя',
    'cmp.rename.placeholder': 'Введите новое имя…',
    'cmp.rename.preview': 'Предпросмотр',
    'cmp.rename.originally': '(изначально {name})',

    /* ── narrative/VisibilityToggle ─────────────────── */
    'cmp.visibility.revealed': 'Раскрыто',
    'cmp.visibility.hidden': 'Скрыто',

    /* ── narrative/QuestStatusBadge ─────────────────── */
    'cmp.quest.ACTIVE': 'Активный',
    'cmp.quest.COMPLETED': 'Завершён',
    'cmp.quest.FAILED': 'Провален',
    'cmp.quest.HIDDEN': 'Скрытый',
    'cmp.quest.ARCHIVED': 'В архиве',

    /* ── gm/EffectRow ───────────────────────────────── */
    'cmp.effect.buff': 'БАФФ',
    'cmp.effect.debuff': 'ДЕБАФФ',
    'cmp.effect.round': 'РАУНД',
    'cmp.effect.rounds': 'РАУНДОВ',
    'cmp.effect.permanent': 'ПОСТОЯННЫЙ',
    'cmp.effect.lift': 'Снять',
    'cmp.effect.liftTitle': 'Снять этот эффект',
  },

  en: {
    /* ── characters/AbilityCheckPanel ───────────────── */
    'cmp.ability.empty': 'Select an ability to see its check breakdown',
    'cmp.ability.total': 'Total',

    /* ── characters/DamageHealModal ─────────────────── */
    'cmp.dmgHeal.applyDamage': 'Apply Damage',
    'cmp.dmgHeal.applyHealing': 'Apply Healing',
    'cmp.dmgHeal.applying': 'Applying...',
    'cmp.dmgHeal.apply': 'Apply',
    'cmp.dmgHeal.damage': 'Damage',
    'cmp.dmgHeal.heal': 'Heal',
    'cmp.dmgHeal.amount': 'Amount',
    'cmp.dmgHeal.preview': 'Preview',

    /* ── characters/HPRailPanel ─────────────────────── */
    'cmp.hp.title': 'Vitae \u00B7 Hit Points',
    'cmp.hp.hale': 'Hale',
    'cmp.hp.damage': 'Damage',
    'cmp.hp.heal': 'Heal',
    'cmp.hp.advanced': 'Advanced...',

    /* ── characters/MulticlassPanel ─────────────────── */
    'cmp.multiclass.title': 'Classes & Oaths',
    'cmp.multiclass.addClass': 'Add Class',
    'cmp.multiclass.totalLevel': 'Total Level',

    /* ── characters/ReadOnlyOverlay ─────────────────── */
    'cmp.readonly.dead': 'This character has fallen and their sheet is sealed.',
    'cmp.readonly.reserve':
      'This character is on reserve and their sheet is locked.',
    'cmp.readonly.default': 'This character sheet is read-only.',

    /* ── characters/ResourcesPanel ──────────────────── */
    'cmp.resources.title': 'Reserves & Founts',
    'cmp.resources.add': 'Add',
    'cmp.resources.decrease': 'Decrease {name}',
    'cmp.resources.increase': 'Increase {name}',
    'cmp.resources.noMax': '{value} (no max)',
    'cmp.resources.empty': 'No resources tracked',

    /* ── characters/StatusControlPanel ──────────────── */
    'cmp.status.title': 'Soul Status',
    'cmp.status.active':
      'Character is alive and adventuring in the current campaign.',
    'cmp.status.dead': 'Character has fallen. Sheet becomes read-only.',
    'cmp.status.reserve': 'Character is benched. Sheet becomes read-only.',

    /* ── characters/WalletPanel ─────────────────────── */
    'cmp.wallet.title': 'Coin & Coffer',
    'cmp.wallet.gp': '{amount} gp',
    'cmp.wallet.decrease': 'Decrease {name}',
    'cmp.wallet.increase': 'Increase {name}',
    'cmp.wallet.empty': 'No currencies tracked',
    'cmp.wallet.addCurrency': 'Add Currency',

    /* ── items/RarityBadge ──────────────────────────── */
    'cmp.rarity.COMMON': 'Common',
    'cmp.rarity.UNCOMMON': 'Uncommon',
    'cmp.rarity.RARE': 'Rare',
    'cmp.rarity.VERY_RARE': 'Very Rare',
    'cmp.rarity.LEGENDARY': 'Legendary',

    /* ── items/InvRow ───────────────────────────────── */
    'cmp.slot.HEAD': 'Head',
    'cmp.slot.CHEST': 'Chest',
    'cmp.slot.LEGS': 'Legs',
    'cmp.slot.FEET': 'Feet',
    'cmp.slot.MAIN_HAND': 'Main Hand',
    'cmp.slot.OFF_HAND': 'Off Hand',
    'cmp.slot.RING_LEFT': 'Ring (L)',
    'cmp.slot.RING_RIGHT': 'Ring (R)',
    'cmp.slot.NECK': 'Neck',
    'cmp.slot.CLOAK': 'Cloak',
    'cmp.inv.unique': 'Unique',
    'cmp.inv.equipped': 'Equipped',
    'cmp.inv.originally': '(originally {name})',
    'cmp.inv.rename': 'Rename',
    'cmp.inv.transfer': 'Transfer',
    'cmp.inv.more': 'More',

    /* ── items/ItemTransferModal ────────────────────── */
    'cmp.transfer.transfer': 'Transfer',
    'cmp.transfer.overline': 'Conveyance',
    'cmp.transfer.title': 'Transfer Item',
    'cmp.transfer.recipient': 'Recipient',
    'cmp.transfer.noMembers': 'No other members in this campaign.',
    'cmp.transfer.quantity': 'Quantity',
    'cmp.transfer.available': 'Available: {count}',
    'cmp.transfer.equippedItem': 'Equipped Item',
    'cmp.transfer.equippedWarning':
      'This item is currently equipped. Transferring it will automatically unequip it from the current holder.',

    /* ── items/RenameStackModal ─────────────────────── */
    'cmp.rename.modeWholeLabel': 'Rename whole stack',
    'cmp.rename.modeWholeDesc': 'Applies the new name to every item in the stack.',
    'cmp.rename.modeSplitLabel': 'Split one away & name it',
    'cmp.rename.modeSplitDesc':
      'Separates a single item from the stack and gives it a unique name.',
    'cmp.rename.rename': 'Rename',
    'cmp.rename.overline': 'Inscription',
    'cmp.rename.title': 'Rename Stack',
    'cmp.rename.mode': 'Rename Mode',
    'cmp.rename.newName': 'New Name',
    'cmp.rename.placeholder': 'Enter a new name...',
    'cmp.rename.preview': 'Preview',
    'cmp.rename.originally': '(originally {name})',

    /* ── narrative/VisibilityToggle ─────────────────── */
    'cmp.visibility.revealed': 'Revealed',
    'cmp.visibility.hidden': 'Hidden',

    /* ── narrative/QuestStatusBadge ─────────────────── */
    'cmp.quest.ACTIVE': 'Active',
    'cmp.quest.COMPLETED': 'Completed',
    'cmp.quest.FAILED': 'Failed',
    'cmp.quest.HIDDEN': 'Hidden',
    'cmp.quest.ARCHIVED': 'Archived',

    /* ── gm/EffectRow ───────────────────────────────── */
    'cmp.effect.buff': 'BUFF',
    'cmp.effect.debuff': 'DEBUFF',
    'cmp.effect.round': 'ROUND',
    'cmp.effect.rounds': 'ROUNDS',
    'cmp.effect.permanent': 'PERMANENT',
    'cmp.effect.lift': 'Lift',
    'cmp.effect.liftTitle': 'Lift this effect',
  },
};
