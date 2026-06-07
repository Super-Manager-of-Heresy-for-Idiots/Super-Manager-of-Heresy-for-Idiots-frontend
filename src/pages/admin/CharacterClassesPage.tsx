import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { AdminClassRichWizard } from '@/components/admin/AdminClassRichWizard';
import {
  useCharacterClasses,
  useDeleteCharacterClass,
} from '@/hooks/useAdmin';
import type { CharacterClassResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

export default function CharacterClassesPage() {
  const t = useT();
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
        title={t('adm.classes.title')}
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel={t('adm.classes.add')}
        columns={[
          { header: t('adm.shared.colName'), accessor: 'name' },
          { header: t('adm.shared.colDescription'), accessor: 'description' },
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
