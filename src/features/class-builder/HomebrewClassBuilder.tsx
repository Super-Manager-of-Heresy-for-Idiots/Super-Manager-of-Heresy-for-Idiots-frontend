import { useQuery } from '@tanstack/react-query';
import { classAuthoringApi, type AuthoringScope } from '@/api/classAuthoring.api';
import { ClassBuilderModal } from './ClassBuilderModal';
import { classDetailToDraft } from './classDetailToDraft';

export interface HomebrewClassBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  /** Existing class id to edit; omit for create. */
  editingId?: string;
  onSaved?: () => void;
}

/**
 * Homebrew-package entry to the new content-model class builder. Same component
 * as the admin builder, scoped to a homebrew package.
 */
export function HomebrewClassBuilder({ open, onOpenChange, packageId, editingId, onSaved }: HomebrewClassBuilderProps) {
  const scope: AuthoringScope = { kind: 'homebrew', packageId };
  const detail = useQuery({
    queryKey: ['homebrew-class-detail', packageId, editingId],
    queryFn: async () => (await classAuthoringApi.get(scope, editingId!)).data,
    enabled: open && !!editingId,
  });

  if (!open) return null;

  if (editingId) {
    if (detail.isLoading || !detail.data) return null;
    return (
      <ClassBuilderModal
        key={editingId}
        open
        onOpenChange={onOpenChange}
        scope={scope}
        editId={editingId}
        initialDraft={classDetailToDraft(detail.data)}
        onSaved={onSaved}
      />
    );
  }

  return (
    <ClassBuilderModal key="new" open onOpenChange={onOpenChange} scope={scope} onSaved={onSaved} />
  );
}
