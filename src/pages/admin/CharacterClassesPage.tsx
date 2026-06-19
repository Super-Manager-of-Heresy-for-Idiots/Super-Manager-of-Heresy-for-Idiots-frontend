import { useState } from 'react';
import { CrudTable } from '@/components/admin/CrudTable';
import { AdminClassBuilder } from '@/features/class-builder/AdminClassBuilder';
import { ConfirmDeleteClassDialog } from '@/features/class-builder/ConfirmDeleteClassDialog';
import { useCharacterClasses } from '@/hooks/useAdmin';
import type { CharacterClassResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

const ADMIN_SCOPE = { kind: 'admin' } as const;

export default function CharacterClassesPage() {
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useCharacterClasses();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = () => {
    setEditingId(undefined);
    setBuilderOpen(true);
  };

  const handleEdit = (item: CharacterClassResponse) => {
    setEditingId(item.id);
    setBuilderOpen(true);
  };

  const handleDelete = (id: string) => {
    const item = data?.find((c) => c.id === id);
    setDeleting({ id, name: item?.name ?? '' });
  };

  return (
    <>
      <CrudTable
        title={t('adm.classes.title')}
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
      <ConfirmDeleteClassDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        scope={ADMIN_SCOPE}
        classId={deleting?.id}
        className={deleting?.name}
        onDeleted={refetch}
      />
    </>
  );
}
