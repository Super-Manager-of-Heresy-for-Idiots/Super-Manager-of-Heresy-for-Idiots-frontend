import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import { useFeats, useCreateFeat, useUpdateFeat, useDeleteFeat } from '@/hooks/useAdmin';
import type { Feat } from '@/types';

export default function FeatsPage() {
  const { data, isLoading } = useFeats();
  const createMutation = useCreateFeat();
  const updateMutation = useUpdateFeat();
  const deleteMutation = useDeleteFeat();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feat | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Feat) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (formData: Record<string, string>) => {
    const dto = {
      name: formData.name,
      description: formData.description,
      prerequisites: formData.prerequisites || undefined,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: dto },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(dto, { onSuccess: () => setModalOpen(false) });
    }
  };

  return (
    <>
      <CrudTable
        title="Feats"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Feat"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
          { header: 'Prerequisites', accessor: (item) => item.prerequisites || '—' },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Feat' : 'Add Feat'}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'prerequisites', label: 'Prerequisites', type: 'text', required: false },
        ]}
        defaultValues={
          editing
            ? { name: editing.name, description: editing.description, prerequisites: editing.prerequisites || '' }
            : undefined
        }
      />
    </>
  );
}
