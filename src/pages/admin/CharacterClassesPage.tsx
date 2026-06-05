import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { AdminClassRichWizard } from '@/components/admin/AdminClassRichWizard';
import {
  useCharacterClasses,
  useDeleteCharacterClass,
} from '@/hooks/useAdmin';
import type { CharacterClassResponse } from '@/types';

export default function CharacterClassesPage() {
  const { data, isLoading } = useCharacterClasses();
  const deleteMutation = useDeleteCharacterClass();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<CharacterClassResponse | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setWizardOpen(true);
  };

  const handleEdit = (item: CharacterClassResponse) => {
    setEditing(item);
    setWizardOpen(true);
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
        addLabel="Rich Class"
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Description', accessor: 'description' },
        ]}
      />
      <AdminClassRichWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        editingClass={editing}
      />
    </>
  );
}
