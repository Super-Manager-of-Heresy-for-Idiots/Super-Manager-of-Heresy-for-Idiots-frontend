import { useQuery } from '@tanstack/react-query';
import { classAuthoringApi, type AuthoringScope } from '@/api/classAuthoring.api';
import { ClassBuilderModal } from './ClassBuilderModal';
import { classDetailToDraft } from './classDetailToDraft';

const ADMIN_SCOPE: AuthoringScope = { kind: 'admin' };

export interface AdminClassBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing class id to edit; omit for create. */
  editingId?: string;
  onSaved?: () => void;
}

/**
 * Admin entry to the new content-model class builder. For edit it loads the
 * saved class via the authoring GET endpoint and adapts it to an editable draft.
 */
export function AdminClassBuilder({ open, onOpenChange, editingId, onSaved }: AdminClassBuilderProps) {
  const detail = useQuery({
    queryKey: ['admin-class-detail', editingId],
    queryFn: async () => classAuthoringApi.getForEdit(ADMIN_SCOPE, editingId!),
    enabled: open && !!editingId,
  });

  if (!open) return null;

  if (editingId) {
    if (detail.isLoading || !detail.data?.class) return null;
    return (
      <ClassBuilderModal
        key={editingId}
        open
        onOpenChange={onOpenChange}
        scope={ADMIN_SCOPE}
        editId={editingId}
        etag={detail.data.etag}
        initialDraft={classDetailToDraft(detail.data.class)}
        onSaved={onSaved}
      />
    );
  }

  return (
    <ClassBuilderModal key="new" open onOpenChange={onOpenChange} scope={ADMIN_SCOPE} onSaved={onSaved} />
  );
}
