import { Slot, Rune } from '@/components/ao';
import { EQUIPMENT_SLOT_LABELS } from '@/types';
import type { InventorySlot, EquipmentSlot } from '@/types';

const slotGlyphs: Record<EquipmentSlot, string> = {
  HEAD: 'helm',
  CHEST: 'shield',
  LEGS: 'scroll',
  FEET: 'diamond',
  MAIN_HAND: 'sword',
  OFF_HAND: 'shield',
  RING_LEFT: 'cir-dot',
  RING_RIGHT: 'cir-dot',
  NECK: 'diamond-fill',
  CLOAK: 'scroll',
};

interface EquipmentGridProps {
  inventory: InventorySlot[];
  onSlotClick?: (slot: InventorySlot) => void;
  readOnly?: boolean;
}

export function EquipmentGrid({ inventory, onSlotClick, readOnly = false }: EquipmentGridProps) {
  const getSlotData = (slotName: EquipmentSlot): InventorySlot | undefined => {
    return inventory.find((s) => s.slot === slotName);
  };

  const renderSlot = (slotName: EquipmentSlot) => {
    const slotData = getSlotData(slotName);
    const hasItem = slotData?.itemType != null;
    const isClickable = !readOnly && onSlotClick && slotData;

    return (
      <Slot
        key={slotName}
        empty={!hasItem}
        glyph={slotGlyphs[slotName]}
        label={EQUIPMENT_SLOT_LABELS[slotName]}
        onClick={isClickable ? () => onSlotClick(slotData!) : undefined}
        rarity={hasItem ? 'uncommon' : 'common'}
      >
        {hasItem && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Rune kind={slotGlyphs[slotName]} size={20} color="var(--gold)" />
            <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--ink)' }}>
              {slotData?.itemType?.name}
            </span>
            {slotData && slotData.quantity > 1 && (
              <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>x{slotData.quantity}</span>
            )}
          </div>
        )}
      </Slot>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 10,
    }}>
      {(['HEAD', 'NECK', 'CLOAK', 'CHEST', 'LEGS',
        'FEET', 'MAIN_HAND', 'OFF_HAND', 'RING_LEFT', 'RING_RIGHT'] as EquipmentSlot[]).map(renderSlot)}
    </div>
  );
}
