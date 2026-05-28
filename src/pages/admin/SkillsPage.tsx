import { useState } from 'react';
import { Chip } from '@/components/ao';
import { CrudTable } from '@/components/admin/CrudTable';
import { CrudFormModal } from '@/components/admin/CrudFormModal';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from '@/hooks/useAdmin';
import type { Skill } from '@/types';

export default function SkillsPage() {
  const { data, isLoading } = useSkills();
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const deleteMutation = useDeleteSkill();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Skill) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = (formData: Record<string, string>) => {
    const dto = {
      name: formData.name,
      description: formData.description,
      skillType: formData.skillType || undefined,
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
        title="Skills"
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel="Add Skill"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
          {
            header: 'Type',
            accessor: (item) =>
              item.skillType ? <Chip tone="ember">{item.skillType}</Chip> : '—',
          },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? 'Edit Skill' : 'Add Skill'}
        fields={[
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'skillType', label: 'Skill Type', type: 'text', required: false },
        ]}
        defaultValues={
          editing
            ? { name: editing.name, description: editing.description, skillType: editing.skillType || '' }
            : undefined
        }
      />
    </>
  );
}
