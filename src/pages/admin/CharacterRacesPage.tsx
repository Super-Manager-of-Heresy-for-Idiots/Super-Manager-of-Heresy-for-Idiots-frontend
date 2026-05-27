import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import {
  useCharacterRaces,
  useCreateCharacterRace,
  useUpdateCharacterRace,
  useDeleteCharacterRace,
} from '@/hooks/useAdmin';
import type { CharacterRace } from '@/types';

export default function CharacterRacesPage() {
  const { data, isLoading } = useCharacterRaces();
  const createMutation = useCreateCharacterRace();
  const updateMutation = useUpdateCharacterRace();
  const deleteMutation = useDeleteCharacterRace();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterRace | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: CharacterRace) => {
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
        title="Character Races"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Race"
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
        title={editing ? 'Edit Character Race' : 'Add Character Race'}
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
