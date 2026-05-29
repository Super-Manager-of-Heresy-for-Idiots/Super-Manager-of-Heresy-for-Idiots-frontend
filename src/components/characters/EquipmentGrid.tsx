import {
  Crown, Shirt, Footprints, Sword, Shield,
  CircleDot, Gem, Scroll
} from 'lucide-react';
import { EQUIPMENT_SLOT_LABELS } from '@/types';
import type { InventorySlotResponse, EquipmentSlot } from '@/types';

const slotIcons: Record<EquipmentSlot, React.ReactNode> = {
  HEAD: <Crown className="h-5 w-5" />,
  CHEST: <Shirt className="h-5 w-5" />,
  LEGS: <Scroll className="h-5 w-5" />,
  FEET: <Footprints className="h-5 w-5" />,
  MAIN_HAND: <Sword className="h-5 w-5" />,
  OFF_HAND: <Shield className="h-5 w-5" />,
  RING_LEFT: <CircleDot className="h-5 w-5" />,
  RING_RIGHT: <CircleDot className="h-5 w-5" />,
  NECK: <Gem className="h-5 w-5" />,
  CLOAK: <Scroll className="h-5 w-5" />,
};

interface EquipmentGridProps {
  inventory: InventorySlotResponse[];
  onSlotClick?: (slot: InventorySlotResponse) => void;
  readOnly?: boolean;
}

export function EquipmentGrid({ inventory, onSlotClick, readOnly = false }: EquipmentGridProps) {
  const getSlotData = (slotName: EquipmentSlot): InventorySlotResponse | undefined => {
    return inventory.find((s) => s.slot === slotName);
  };

  const renderSlot = (slotName: EquipmentSlot) => {
    const slotData = getSlotData(slotName);
    const hasItem = slotData?.itemTypeId != null;
    const isClickable = !readOnly && onSlotClick && slotData;

    return (
      <button
        key={slotName}
        onClick={() => isClickable && slotData && onSlotClick(slotData)}
        disabled={readOnly || !onSlotClick}
        className={`
          flex flex-col items-center p-3 rounded-lg border transition-all min-h-[100px] w-full
          ${hasItem
            ? 'border-gold/40 bg-gold/10 text-foreground'
            : 'border-border bg-card text-muted-foreground'
          }
          ${isClickable ? 'hover:border-gold/60 hover:bg-gold/15 cursor-pointer' : 'cursor-default'}
        `}
      >
        <div className={`mb-1 ${hasItem ? 'text-gold' : 'text-muted-foreground'}`}>
          {slotIcons[slotName]}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider mb-1">
          {EQUIPMENT_SLOT_LABELS[slotName]}
        </span>
        {hasItem ? (
          <>
            <span className="text-sm font-medium text-center">
              {slotData?.artifactName || slotData?.itemTypeName}
            </span>
            {slotData && slotData.quantity && slotData.quantity > 1 && (
              <span className="text-xs text-muted-foreground">x{slotData.quantity}</span>
            )}
            {slotData?.notes && (
              <span className="text-xs text-muted-foreground italic mt-1 truncate max-w-full">{slotData.notes}</span>
            )}
          </>
        ) : (
          <span className="text-xs italic">Empty</span>
        )}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {(['HEAD', 'NECK', 'CLOAK', 'CHEST', 'LEGS',
        'FEET', 'MAIN_HAND', 'OFF_HAND', 'RING_LEFT', 'RING_RIGHT'] as EquipmentSlot[]).map(renderSlot)}
    </div>
  );
}
