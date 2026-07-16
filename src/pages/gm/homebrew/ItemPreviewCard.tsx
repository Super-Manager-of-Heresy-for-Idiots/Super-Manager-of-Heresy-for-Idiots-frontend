import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import { OrdoInterfaceIcon, damageIconForType } from '@/components/ordo';
import { RarityBadge } from '@/components/items/RarityBadge';
import { rarityColor } from '@/lib/itemVisuals';
import s from './ItemPreviewCard.module.css';

export interface ItemPreviewInput {
  kind: 'magic' | 'weapon' | 'armor' | 'gear' | 'tool';
  name: string;
  unnamedLabel: string;
  rarity?: string;
  rarityName?: string;
  category?: string;
  // weapon
  damageDiceCount?: number;
  damageDieSize?: number;
  damageBonus?: number;
  flatDamage?: number;
  weaponDamageTypeName?: string;
  // armor
  baseAc?: number;
  maxDexBonus?: number;
  strengthRequired?: number;
  dexBonusAllowed?: boolean;
  stealthDisadvantage?: boolean;
  // equipment common
  costGold?: number;
  weightLb?: number;
  // attunement
  attunementRequired?: boolean;
  attunementClassLabels?: string[];
  attunementRaceLabels?: string[];
  attunementFlavor?: string;
  // ability
  hasAbDamage?: boolean;
  abDamageDice?: string;
  abDamageTypeName?: string;
  abSaveAbility?: string;
  hasAbHealing?: boolean;
  abHealingFormula?: string;
  abRequiresEquipped?: boolean;
  abRequiresAttunement?: boolean;
  abConsumeOnUse?: boolean;
  description?: string;
}

/** Иконка Ordo по виду предмета. */
function kindIcon(kind: ItemPreviewInput['kind']): string {
  switch (kind) {
    case 'magic': return 'magic-item';
    case 'weapon': return 'damage-slashing';
    case 'armor': return 'armor';
    case 'tool': return 'item-template';
    default: return 'item';
  }
}

/**
 * Живое превью карточки предмета в конструкторе (HB_UX Фаза 6) — в игровом стиле Ordo: заголовок с цветом
 * редкости, тип-строка, стат-чипы (урон/КД/стоимость/вес), исполняемое условие настройки (чипы классов/рас)
 * и умение предмета. Строится из состояния формы, поэтому обновляется по мере ввода.
 */
export function ItemPreviewCard(p: ItemPreviewInput) {
  const t = useT();
  const isMagic = p.kind === 'magic';
  const nameColor = isMagic ? rarityColor(p.rarity) : 'var(--ink-bright)';

  const weaponDice = p.damageDiceCount && p.damageDieSize
    ? `${p.damageDiceCount}d${p.damageDieSize}${p.damageBonus ? ` + ${p.damageBonus}` : ''}`
    : undefined;

  const stats: { k: string; v: string }[] = [];
  if (weaponDice) stats.push({ k: t('hb.item.weaponSection'), v: `${weaponDice}${p.weaponDamageTypeName ? ` ${p.weaponDamageTypeName}` : ''}` });
  if (p.flatDamage) stats.push({ k: t('hb.item.flatDamage'), v: String(p.flatDamage) });
  if (p.baseAc != null) stats.push({ k: t('hb.item.baseAc'), v: String(p.baseAc) });
  if (p.maxDexBonus != null) stats.push({ k: t('hb.item.maxDexBonus'), v: `+${p.maxDexBonus}` });
  if (p.strengthRequired) stats.push({ k: t('hb.item.strengthRequired'), v: String(p.strengthRequired) });
  if (p.costGold != null) stats.push({ k: t('hb.item.costGold'), v: String(p.costGold) });
  if (p.weightLb != null) stats.push({ k: t('hb.item.weightLb'), v: String(p.weightLb) });

  const typeLine = [t(`hb.item.kind.${p.kind}`), !isMagic ? p.category : undefined].filter(Boolean).join(' · ');

  return (
    <div className={s.card} style={{ '--rar': nameColor } as CSSProperties}>
      <div className={s.head}>
        <span className={s.icon} aria-hidden="true">
          <OrdoInterfaceIcon icon={kindIcon(p.kind)} size={18} />
        </span>
        <div className={s.headText}>
          <div className={s.title} style={{ color: nameColor }}>{p.name.trim() || p.unnamedLabel}</div>
          <div className={s.sub}>
            {typeLine}
            {isMagic && p.rarity && <RarityBadge rarity={p.rarity} size="sm" />}
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className={s.stats}>
          {stats.map((st) => (
            <div key={st.k} className={s.statChip}>
              <span className={s.statKey}>{st.k}</span>
              <span className={s.statVal}>{st.v}</span>
            </div>
          ))}
        </div>
      )}

      {p.stealthDisadvantage && (
        <div className={s.flag}><OrdoInterfaceIcon icon="hidden" size={11} />{t('hb.item.stealthDisadvantage')}</div>
      )}

      {isMagic && p.attunementRequired && (
        <div className={s.attune}>
          <div className={s.attuneHead}><OrdoInterfaceIcon icon="attunement" size={12} />{t('cat.attunement.required')}</div>
          {(p.attunementClassLabels?.length || p.attunementRaceLabels?.length) ? (
            <div className={s.chips}>
              {(p.attunementClassLabels ?? []).map((l) => <span key={`c-${l}`} className={s.chip}>{l}</span>)}
              {(p.attunementRaceLabels ?? []).map((l) => <span key={`r-${l}`} className={cn(s.chip, s.chipRace)}>{l}</span>)}
            </div>
          ) : null}
          {p.attunementFlavor && <div className={s.attuneFlavor}>{p.attunementFlavor}</div>}
        </div>
      )}

      {(p.hasAbDamage || p.hasAbHealing) && (
        <div className={s.ability}>
          <div className={s.statKey}>{t('hb.item.abilitySection').split('(')[0].trim()}</div>
          <div className={s.abilityChips}>
            {p.hasAbDamage && p.abDamageDice && (
              <span className={cn(s.abChip, s.abDamage)}>
                <OrdoInterfaceIcon icon={damageIconForType(p.abDamageTypeName)} size={12} />
                <span className={s.abDice}>{p.abDamageDice}</span>
                {p.abDamageTypeName && <span className={s.abType}>{p.abDamageTypeName}</span>}
              </span>
            )}
            {p.hasAbHealing && p.abHealingFormula && (
              <span className={cn(s.abChip, s.abHeal)}>
                <OrdoInterfaceIcon icon="spell-healing" size={12} />
                <span className={s.abDice}>{p.abHealingFormula}</span>
              </span>
            )}
          </div>
          <div className={s.gates}>
            {p.abRequiresEquipped && <span className={s.gate}><OrdoInterfaceIcon icon="item-equipped" size={10} />{t('hb.item.abRequiresEquipped')}</span>}
            {p.abRequiresAttunement && <span className={s.gate}><OrdoInterfaceIcon icon="attunement" size={10} />{t('hb.item.abRequiresAttunement')}</span>}
            {p.abConsumeOnUse && <span className={s.gate}><OrdoInterfaceIcon icon="consumable" size={10} />{t('hb.item.abConsumeOnUse')}</span>}
          </div>
        </div>
      )}

      {p.description?.trim() && <div className={s.desc}>{p.description}</div>}
    </div>
  );
}
