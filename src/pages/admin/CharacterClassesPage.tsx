import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { AdminClassBuilder } from '@/features/class-builder/AdminClassBuilder';
import {
  useCharacterClasses,
  useDeleteCharacterClass,
} from '@/hooks/useAdmin';
import type { CharacterClassResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

export default function CharacterClassesPage() {
  const t = useT();
  const { data, isLoading, isError, refetch } = useCharacterClasses();
  const deleteMutation = useDeleteCharacterClass();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const handleAdd = () => {
    setEditingId(undefined);
    setBuilderOpen(true);
  };

  const handleEdit = (item: CharacterClassResponse) => {
    setEditingId(item.id);
    setBuilderOpen(true);
  };

  return (
    <>
      <CrudTable
        title={t('adm.classes.title')}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        addLabel={t('adm.classes.add')}
        columns={[
          { header: t('adm.shared.colName'), accessor: 'name' },
          { header: t('adm.shared.colDescription'), accessor: 'description' },
        ]}
      />
      <AdminClassBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editingId={editingId}
        onSaved={refetch}
      />
    </>
  );
}
