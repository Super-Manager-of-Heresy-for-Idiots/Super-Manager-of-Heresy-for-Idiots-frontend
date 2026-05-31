import { Rune, OrdoChip } from '@/components/ordo';
import { RarityBadge, RARITY_HUE } from './RarityBadge';
import type { ItemInstanceResponse } from '@/types';

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

const SLOT_LABEL: Record<string, string> = {
  HEAD: 'Head',
  CHEST: 'Chest',
  LEGS: 'Legs',
  FEET: 'Feet',
  MAIN_HAND: 'Main Hand',
  OFF_HAND: 'Off Hand',
  RING_LEFT: 'Ring (L)',
  RING_RIGHT: 'Ring (R)',
  NECK: 'Neck',
  CLOAK: 'Cloak',
};

/* ── Component ─────────────────────────────────────────────────── */

interface InvRowProps {
  item: ItemInstanceResponse;
  onRename?: () => void;
  onTransfer?: () => void;
  onMore?: () => void;
}

export function InvRow({ item, onRename, onTransfer, onMore }: InvRowProps) {
  const rarity = item.rarity ?? 'COMMON';
  const rarityColor = RARITY_HUE[rarity] ?? RARITY_HUE.COMMON;
  const slotGlyph = item.slot ? SLOT_ICON[item.slot] ?? 'square' : 'square';
  const slotLabel = item.slot ? SLOT_LABEL[item.slot] ?? item.slot : null;
  const displayName = item.displayName;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderBottom: '1px solid var(--hairline)',
        transition: 'background 0.15s',
      }}
      className="ao-row-hover"
    >
      {/* ── Slot icon with rarity tint & stack overlay ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          className="ao-slot"
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${rarityColor}`,
            background: 'var(--abyss)',
            boxShadow: `inset 0 0 10px ${rarityColor}18`,
          }}
        >
          <Rune kind={slotGlyph} size={18} color={rarityColor} />
        </div>

        {/* Stack quantity overlay */}
        {item.quantity > 1 && (
          <span
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--panel)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--ink-bright)',
              padding: '0 4px',
            }}
          >
            x{item.quantity}
          </span>
        )}
      </div>

      {/* ── Name + chips + meta line ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="ao-h5"
            style={{
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </span>

          {item.isUnique && (
            <OrdoChip tone="arcane" glyph="sigil-1">Unique</OrdoChip>
          )}
          {item.slot && (
            <OrdoChip tone="rune">Equipped</OrdoChip>
          )}
        </div>

        {/* Meta line: rarity + slot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
            flexWrap: 'wrap',
          }}
        >
          <RarityBadge rarity={rarity} size="sm" />
          {slotLabel && (
            <span
              className="ao-codex"
              style={{ fontSize: 10, color: 'var(--ink-faint)' }}
            >
              {slotLabel}
            </span>
          )}
        </div>

        {/* Custom name note (show original name if renamed) */}
        {item.customName && (
          <div
            className="ao-italic"
            style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}
          >
            (originally {item.templateName})
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {onRename && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onRename}
            title="Rename"
          >
            <Rune kind="scroll" size={10} />
          </button>
        )}
        {onTransfer && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onTransfer}
            title="Transfer"
          >
            <Rune kind="arrow-r" size={10} />
          </button>
        )}
        {onMore && (
          <button
            className="ao-btn ao-btn--sm"
            onClick={onMore}
            title="More"
          >
            <Rune kind="dots" size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
