import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { EQUIPMENT_SLOT_LABELS } from '@/types';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import {
  useItemTypes,
  useCreateItemType,
  useUpdateItemType,
  useDeleteItemType,
} from '@/hooks/useAdmin';
import type { ItemTypeResponse } from '@/types';

export default function ItemTypesPage() {
  const { data, isLoading } = useItemTypes();
  const createMutation = useCreateItemType();
  const updateMutation = useUpdateItemType();
  const deleteMutation = useDeleteItemType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemTypeResponse | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: ItemTypeResponse) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (formData: Record<string, string>) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: formData.name, description: formData.description, slot: formData.slot } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: formData.name, description: formData.description, slot: formData.slot },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  };

  return (
    <>
      <CrudTable
        title="Item Types"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Item Type"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
          {
            header: 'Slot',
            accessor: (item) => (
              <Badge variant="outline">
                {EQUIPMENT_SLOT_LABELS[item.slot] || item.slot}
              </Badge>
            ),
          },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Item Type' : 'Add Item Type'}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'slot', label: 'Slot', type: 'slot-select' },
        ]}
        defaultValues={
          editing
            ? { name: editing.name, description: editing.description, slot: editing.slot }
            : undefined
        }
      />
    </>
  );
}
