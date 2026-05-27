import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import {
  useCharacterClasses,
  useCreateCharacterClass,
  useUpdateCharacterClass,
  useDeleteCharacterClass,
} from '@/hooks/useAdmin';
import type { CharacterClass } from '@/types';

export default function CharacterClassesPage() {
  const { data, isLoading } = useCharacterClasses();
  const createMutation = useCreateCharacterClass();
  const updateMutation = useUpdateCharacterClass();
  const deleteMutation = useDeleteCharacterClass();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterClass | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: CharacterClass) => {
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
        title="Character Classes"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Class"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Character Class' : 'Add Character Class'}
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
