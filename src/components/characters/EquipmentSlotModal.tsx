import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Reset form when slot changes
  useState(() => {
    setItemTypeId(slot?.itemType?.id || '');
    setQuantity(slot?.quantity || 1);
    setNotes(slot?.notes || '');
  });

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
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{EQUIPMENT_SLOT_LABELS[slot.slot]} Slot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={itemTypeId} onValueChange={setItemTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredItems.length === 0 && (
              <p className="text-xs text-muted-foreground">No items available for this slot</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this item..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {slot.itemType && (
            <Button variant="destructive" onClick={handleClear} disabled={isSaving}>
              Clear Slot
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSave} disabled={isSaving || !itemTypeId}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Equip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
