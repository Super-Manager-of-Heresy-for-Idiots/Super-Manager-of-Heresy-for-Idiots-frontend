import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { cn } from '@/lib/utils';
import {
  useNpcShop,
  useStockShop,
  useRemoveShopItem,
  useShopSettings,
  useUpdateShopSettings,
  useRestockShop,
} from '@/hooks/useWorld';
import { useCampaignItemTemplates } from '@/hooks/useInventory';

import s from './NpcShopManager.module.css';

interface Props {
  campaignId: string;
  npcId: string;
}

/**
 * Управление витриной торговца (ГМ): список позиций, добавление товара из шаблонов
 * с переопределением цены/количества/базового запаса, удаление позиции, рестокинг и
 * опциональные настройки экономики (кошелёк торговца, модификатор цен). Настройки
 * необязательны: пустые значения сохраняют прежнее поведение. Изменения транслируются
 * игрокам через WebSocket-событие SHOP_UPDATED.
 */
export function NpcShopManager({ campaignId, npcId }: Props) {
  const { data: shop, isLoading } = useNpcShop(campaignId, npcId);
  const { data: templates = [] } = useCampaignItemTemplates(campaignId);
  const { data: settings } = useShopSettings(campaignId, npcId);
  const stock = useStockShop();
  const remove = useRemoveShopItem();
  const saveSettings = useUpdateShopSettings();
  const restock = useRestockShop();

  const [templateId, setTemplateId] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [restockQty, setRestockQty] = useState('');

  const [gold, setGold] = useState('');
  const [modifier, setModifier] = useState('');

  useEffect(() => {
    setGold(settings?.merchantGold != null ? String(settings.merchantGold) : '');
    setModifier(settings?.priceModifierPercent != null ? String(settings.priceModifierPercent) : '');
  }, [settings]);

  const handleAdd = () => {
    if (!templateId) return;
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    const priceGold = price.trim() === '' ? undefined : Number(price);
    const restockQuantity = restockQty.trim() === '' ? undefined : Math.max(0, parseInt(restockQty, 10) || 0);
    stock.mutate(
      { campaignId, npcId, data: { itemTemplateId: templateId, quantity, priceGold, restockQuantity } },
      {
        onSuccess: () => {
          setTemplateId('');
          setPrice('');
          setQty('1');
          setRestockQty('');
        },
      },
    );
  };

  const handleSaveSettings = () => {
    saveSettings.mutate({
      campaignId,
      npcId,
      data: {
        merchantGold: gold.trim() === '' ? undefined : Number(gold),
        clearMerchantGold: gold.trim() === '',
        priceModifierPercent: modifier.trim() === '' ? undefined : Number(modifier),
        clearPriceModifier: modifier.trim() === '',
      },
    });
  };

  const canRestock = (shop ?? []).some((item) => item.restockQuantity != null);

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title="Лавка торговца" glyph="scroll" tone="gold" sub="Товары, доступные игрокам" />
      <div className={s.body}>
        {isLoading ? (
          <p className={cn('ao-italic', s.empty)}>Загрузка…</p>
        ) : !shop?.length ? (
          <p className={cn('ao-italic', s.empty)}>Лавка пуста.</p>
        ) : (
          <ul className={s.list}>
            {shop.map((item) => (
              <li key={item.id} className={s.row}>
                <span className={s.name}>{item.itemName}</span>
                <span className={s.meta}>
                  {item.priceGold ?? '—'} зм · {item.quantity ?? 0} шт
                  {item.restockQuantity != null ? ` · база ${item.restockQuantity}` : ''}
                </span>
                {item.restockQuantity != null && (
                  <button
                    className="ao-btn ao-btn--sm"
                    title="Снять базовый запас — позиция перестанет восстанавливаться"
                    disabled={stock.isPending}
                    onClick={() =>
                      stock.mutate({
                        campaignId,
                        npcId,
                        data: {
                          itemTemplateId: item.itemTemplateId,
                          quantity: 0,
                          clearRestockQuantity: true,
                        },
                      })
                    }
                  >
                    Без базы
                  </button>
                )}
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  onClick={() => remove.mutate({ campaignId, npcId, shopItemId: item.id })}
                  disabled={remove.isPending}
                  aria-label="Удалить товар"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {canRestock && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={() => restock.mutate({ campaignId, npcId })}
            disabled={restock.isPending}
          >
            {restock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={13} />}
            <span className={s.btnLabel}>Восстановить запас</span>
          </button>
        )}

        <div className={s.addForm}>
          <select
            className="ao-input"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Выберите предмет…</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
                {tpl.priceGold != null ? ` (${tpl.priceGold} зм)` : ''}
              </option>
            ))}
          </select>
          <div className={s.addRow}>
            <input
              className={cn('ao-input', s.priceInput)}
              type="number"
              min="0"
              step="0.1"
              placeholder="Цена"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              className={cn('ao-input', s.qtyInput)}
              type="number"
              min="1"
              placeholder="Кол-во"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <input
              className={cn('ao-input', s.qtyInput)}
              type="number"
              min="0"
              placeholder="База"
              title="Базовый запас для восстановления (необязательно)"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
            />
            <button
              className="ao-btn ao-btn--primary ao-btn--sm"
              onClick={handleAdd}
              disabled={!templateId || stock.isPending}
            >
              {stock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить'}
            </button>
          </div>
        </div>

        <div className={s.addForm}>
          <span className={s.settingsTitle}>Экономика (необязательно)</span>
          <div className={s.addRow}>
            <input
              className={cn('ao-input', s.priceInput)}
              type="number"
              min="0"
              step="0.1"
              placeholder="Золото"
              title="Кошелёк торговца; пусто — выкуп без ограничений"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
            />
            <input
              className={cn('ao-input', s.qtyInput)}
              type="number"
              min="1"
              max="1000"
              placeholder="Цены %"
              title="Модификатор цен витрины в процентах; пусто — базовые цены"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
            />
            <button
              className="ao-btn ao-btn--sm"
              onClick={handleSaveSettings}
              disabled={saveSettings.isPending}
            >
              {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </OrdoPanel>
  );
}
