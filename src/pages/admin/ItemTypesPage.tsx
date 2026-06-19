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
import { useT } from '@/i18n/I18nContext';

export default function ItemTypesPage() {
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useItemTypes();
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
        { id: editing.id, data: { name: formData.name, description: formData.description, slot: formData.slot as import('@/types').EquipmentSlot } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: formData.name, description: formData.description, slot: formData.slot as import('@/types').EquipmentSlot },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  };

  return (
    <>
      <CrudTable
        title={t('adm.itemTypes.title')}
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel={t('adm.itemTypes.add')}
        columns={[
          { header: t('adm.shared.colName'), accessor: 'name' },
          { header: t('adm.shared.colDescription'), accessor: 'description' },
          {
            header: t('adm.itemTypes.colSlot'),
            accessor: (item) => (
              <Badge variant="outline">
                {EQUIPMENT_SLOT_LABELS[item.slot as import('@/types').EquipmentSlot] || item.slot}
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
        title={editing ? t('adm.itemTypes.editTitle') : t('adm.itemTypes.addTitle')}
        fields={[
          { name: 'name', label: t('adm.shared.fieldName'), type: 'text' },
          { name: 'description', label: t('adm.shared.fieldDescription'), type: 'textarea' },
          { name: 'slot', label: t('adm.itemTypes.fieldSlot'), type: 'slot-select' },
        ]}
        defaultValues={
          editing
            ? { name: editing.name, description: editing.description || '', slot: editing.slot }
            : undefined
        }
      />
    </>
  );
}
