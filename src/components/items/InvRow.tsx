import type { CSSProperties } from 'react';
import { Rune, OrdoChip } from '@/components/ordo';
import { RarityBadge, rarityHue } from './RarityBadge';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ItemInstanceResponse } from '@/types';
import s from './InvRow.module.css';

/* ── Slot icon label mapping ───────────────────────────────────── */

const SLOT_ICON: Record<string, string> = {
  HEAD: 'helm',
  CHEST: 'shield',
  LEGS: 'shield',
  FEET: 'shield',
  MAIN_HAND: 'sword',
  OFF_HAND: 'shield',
  RING_LEFT: 'cir-dot',
  RING_RIGHT: 'cir-dot',
  NECK: 'cir',
  CLOAK: 'tri-inv',
};

const SLOT_LABEL_KEY: Record<string, string> = {
  HEAD: 'cmp.slot.HEAD',
  CHEST: 'cmp.slot.CHEST',
  LEGS: 'cmp.slot.LEGS',
  FEET: 'cmp.slot.FEET',
  MAIN_HAND: 'cmp.slot.MAIN_HAND',
  OFF_HAND: 'cmp.slot.OFF_HAND',
  RING_LEFT: 'cmp.slot.RING_LEFT',
  RING_RIGHT: 'cmp.slot.RING_RIGHT',
  NECK: 'cmp.slot.NECK',
  CLOAK: 'cmp.slot.CLOAK',
};

/* ── Component ─────────────────────────────────────────────────── */

interface InvRowProps {
  item: ItemInstanceResponse;
  onRename?: () => void;
  onTransfer?: () => void;
  onMore?: () => void;
}

export function InvRow({ item, onRename, onTransfer, onMore }: InvRowProps) {
  const t = useT();
  const rarityColor = rarityHue(item.rarity);
  const slotGlyph = item.slot ? SLOT_ICON[item.slot] ?? 'square' : 'square';
  const slotLabel = item.slot
    ? (SLOT_LABEL_KEY[item.slot] ? t(SLOT_LABEL_KEY[item.slot]) : item.slot)
    : null;
  const displayName = item.displayName;

  return (
    <div className={cn('ao-row-hover', s.row)}>
      {/* ── Slot icon with rarity tint & stack overlay ── */}
      <div className={s.iconWrap}>
        <div className={s.slot} style={{ '--rar': rarityColor } as CSSProperties}>
          <Rune kind={slotGlyph} size={18} color={rarityColor} />
        </div>

        {/* Stack quantity overlay */}
        {item.quantity > 1 && (
          <span className={s.stack}>x{item.quantity}</span>
        )}
      </div>

      {/* ── Name + chips + meta line ── */}
      <div className={s.main}>
        {/* Name row */}
        <div className={s.nameRow}>
          <span className={cn('ao-h5', s.name)}>{displayName}</span>

          {item.isUnique && (
            <OrdoChip tone="arcane" glyph="sigil-1">{t('cmp.inv.unique')}</OrdoChip>
          )}
          {item.slot && (
            <OrdoChip tone="rune">{t('cmp.inv.equipped')}</OrdoChip>
          )}
        </div>

        {/* Meta line: rarity + slot */}
        <div className={s.meta}>
          <RarityBadge rarity={item.rarity ?? 'common'} size="sm" />
          {slotLabel && (
            <span className={cn('ao-codex', s.slotLabel)}>{slotLabel}</span>
          )}
        </div>

        {/* Custom name note (show original name if renamed) */}
        {item.customName && (
          <div className={cn('ao-italic', s.note)}>
            {t('cmp.inv.originally', { name: item.templateName })}
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className={s.actions}>
        {onRename && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onRename}
            title={t('cmp.inv.rename')}
          >
            <Rune kind="scroll" size={10} />
          </button>
        )}
        {onTransfer && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onTransfer}
            title={t('cmp.inv.transfer')}
          >
            <Rune kind="arrow-r" size={10} />
          </button>
        )}
        {onMore && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onMore}
            title={t('cmp.inv.more')}
          >
            <Rune kind="dots" size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
