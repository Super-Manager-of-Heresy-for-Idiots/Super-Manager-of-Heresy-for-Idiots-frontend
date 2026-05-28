import { useState } from 'react';
import { Chip } from '@/components/ao';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import {
  useSubclasses,
  useCreateSubclass,
  useUpdateSubclass,
  useDeleteSubclass,
  useCharacterClasses,
} from '@/hooks/useAdmin';
import type { Subclass } from '@/types';

export default function SubclassesPage() {
  const { data, isLoading } = useSubclasses();
  const { data: classes } = useCharacterClasses();
  const createMutation = useCreateSubclass();
  const updateMutation = useUpdateSubclass();
  const deleteMutation = useDeleteSubclass();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subclass | null>(null);

  const classOptions = (classes || []).map((c) => ({ value: c.id, label: c.name }));

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Subclass) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (formData: Record<string, string>) => {
    const dto = {
      name: formData.name,
      description: formData.description,
      classId: formData.parentClassId,
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
        title="Subclasses"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Subclass"
        columns={[
          { header: 'Name', accessor: 'name' },
          {
            header: 'Parent Class',
            accessor: (item) => (
              <Chip tone="arcane">{item.parentClass?.name || 'N/A'}</Chip>
            ),
          },
          { header: 'Description', accessor: 'description' },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Subclass' : 'Add Subclass'}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'parentClassId', label: 'Parent Class', type: 'select', options: classOptions },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        defaultValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                parentClassId: editing.parentClass?.id || '',
              }
            : undefined
        }
      />
    </>
  );
}
