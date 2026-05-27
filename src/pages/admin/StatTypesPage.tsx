import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import {
  useStatTypes,
  useCreateStatType,
  useUpdateStatType,
  useDeleteStatType,
} from '@/hooks/useAdmin';
import type { StatType } from '@/types';

export default function StatTypesPage() {
  const { data, isLoading } = useStatTypes();
  const createMutation = useCreateStatType();
  const updateMutation = useUpdateStatType();
  const deleteMutation = useDeleteStatType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StatType | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: StatType) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (formData: Record<string, string>) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: formData.name, description: formData.description } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: formData.name, description: formData.description },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  };

  return (
    <>
      <CrudTable
        title="Stat Types"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        canDelete={(item) => !item.isDefault}
        addLabel="Add Stat Type"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
          {
            header: 'Default',
            accessor: (item) =>
              item.isDefault ? <Badge variant="gold">Default</Badge> : null,
          },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Stat Type' : 'Add Stat Type'}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        defaultValues={
          editing ? { name: editing.name, description: editing.description } : undefined
        }
      />
    </>
  );
}
