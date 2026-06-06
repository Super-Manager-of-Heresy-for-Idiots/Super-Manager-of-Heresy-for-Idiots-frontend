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
import type { StatTypeResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

export default function StatTypesPage() {
  const t = useT();
  const { data, isLoading } = useStatTypes();
  const createMutation = useCreateStatType();
  const updateMutation = useUpdateStatType();
  const deleteMutation = useDeleteStatType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StatTypeResponse | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: StatTypeResponse) => {
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
        title={t('adm.statTypes.title')}
        data={data}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        canDelete={(item) => !item.isDefault}
        addLabel={t('adm.statTypes.add')}
        columns={[
          { header: t('adm.shared.colName'), accessor: 'name' },
          { header: t('adm.shared.colDescription'), accessor: 'description' },
          {
            header: t('adm.statTypes.colDefault'),
            accessor: (item) =>
              item.isDefault ? <Badge variant="gold">{t('adm.statTypes.badgeDefault')}</Badge> : null,
          },
        ]}
      />
      <CrudFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        title={editing ? t('adm.statTypes.editTitle') : t('adm.statTypes.addTitle')}
        fields={[
          { name: 'name', label: t('adm.shared.fieldName'), type: 'text' },
          { name: 'description', label: t('adm.shared.fieldDescription'), type: 'textarea' },
        ]}
        defaultValues={
          editing ? { name: editing.name, description: editing.description || '' } : undefined
        }
      />
    </>
  );
}
