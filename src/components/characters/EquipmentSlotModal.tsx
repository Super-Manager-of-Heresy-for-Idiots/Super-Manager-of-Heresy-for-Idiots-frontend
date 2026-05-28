import { useState, useEffect } from 'react';
import { Dialog, Button, Input, Label, Textarea, Select, Rune } from '@/components/ao';
import { EQUIPMENT_SLOT_LABELS } from '@/types';
import { useItemTypes } from '@/hooks/useAdmin';
import type { InventorySlot } from '@/types';

interface EquipmentSlotModalProps {
  slot: InventorySlot | null;
  characterId: string;
  open: boolean;
  onClose: () => void;
  onSave: (data: { itemTypeId: string | null; quantity: number; notes: string | null }) => void;
  isSaving: boolean;
}

export function EquipmentSlotModal({ slot, open, onClose, onSave, isSaving }: EquipmentSlotModalProps) {
  const { data: allItemTypes } = useItemTypes();
  const filteredItems = allItemTypes?.filter((item) => item.slot === slot?.slot) || [];

  const [itemTypeId, setItemTypeId] = useState<string>(slot?.itemType?.id || '');
  const [quantity, setQuantity] = useState(slot?.quantity || 1);
  const [notes, setNotes] = useState(slot?.notes || '');

  useEffect(() => {
    setItemTypeId(slot?.itemType?.id || '');
    setQuantity(slot?.quantity || 1);
    setNotes(slot?.notes || '');
  }, [slot]);

  const handleSave = () => {
    onSave({
      itemTypeId: itemTypeId || null,
      quantity,
      notes: notes || null,
    });
  };

  const handleClear = () => {
    onSave({
      itemTypeId: null,
      quantity: 0,
      notes: null,
    });
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onClose={onClose} title={`${EQUIPMENT_SLOT_LABELS[slot.slot]} Slot`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label htmlFor="eq-item">Item</Label>
          <Select
            id="eq-item"
            value={itemTypeId}
            onChange={(e) => setItemTypeId(e.target.value)}
          >
            <option value="">Select an item</option>
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
          {filteredItems.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
              No items available for this slot
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="eq-qty">Quantity</Label>
          <Input
            id="eq-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="eq-notes">Notes (optional)</Label>
          <Textarea
            id="eq-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this item..."
            rows={2}
          />
        </div>
      </div>

      <div className="ao-dialog__actions" style={{ marginTop: 20 }}>
        {slot.itemType && (
          <Button variant="danger" onClick={handleClear} disabled={isSaving}>
            Clear Slot
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !itemTypeId}
          icon={isSaving ? <Rune kind="sigil-3" size={14} className="ao-spin" /> : undefined}
        >
          Equip
        </Button>
      </div>
    </Dialog>
  );
}
