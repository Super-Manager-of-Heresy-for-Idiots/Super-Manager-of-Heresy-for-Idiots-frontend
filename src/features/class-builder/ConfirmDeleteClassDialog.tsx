import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { classAuthoringApi, type AuthoringScope } from '@/api/classAuthoring.api';
import { cn } from '@/lib/utils';

export interface ConfirmDeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: AuthoringScope;
  classId?: string;
  className?: string;
  onDeleted?: () => void;
}

/**
 * Guarded class delete: previews the child records that will cascade and requires
 * an explicit confirmation, so admins never trigger an accidental cascade delete.
 */
export function ConfirmDeleteClassDialog({
  open,
  onOpenChange,
  scope,
  classId,
  className,
  onDeleted,
}: ConfirmDeleteClassDialogProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const detail = useQuery({
    queryKey: ['class-delete-preview', classId],
    queryFn: async () => (await classAuthoringApi.get(scope, classId!)).data,
    enabled: open && !!classId,
  });

  const d = detail.data;
  const features = d?.features?.length ?? 0;
  const groups = d?.rewardGroups ?? [];
  const options = groups.reduce((n, g) => n + (g.options?.length ?? 0), 0);
  const grants = groups.reduce(
    (n, g) => n + (g.grants?.length ?? 0) + (g.options ?? []).reduce((m, o) => m + (o.grants?.length ?? 0), 0),
    0,
  );

  const handleDelete = async () => {
    if (!classId) return;
    setDeleting(true);
    try {
      await classAuthoringApi.remove(scope, classId);
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'classes'] });
      toast.success('Класс удалён.');
      onDeleted?.();
      onOpenChange(false);
    } catch (error) {
      // 409 = referenced by characters; surface the server message.
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить класс.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить класс «{className ?? d?.name ?? ''}»?</DialogTitle>
        </DialogHeader>
        <div className="ao-col ao-gap-12">
          <div className="ao-row ao-gap-8">
            <AlertTriangle size={16} color="var(--ember)" />
            <span className="ao-codex">Это действие необратимо и каскадно удалит дочерние записи:</span>
          </div>
          {detail.isLoading ? (
            <span className="ao-codex">Подсчёт затрагиваемых записей…</span>
          ) : (
            <ul className="ao-col ao-gap-4">
              <li className="ao-codex">Умения (features): <b>{features}</b></li>
              <li className="ao-codex">Группы наград: <b>{groups.length}</b></li>
              <li className="ao-codex">Опции: <b>{options}</b></li>
              <li className="ao-codex">Гранты: <b>{grants}</b></li>
            </ul>
          )}
          <div className="ao-row ao-between">
            <button className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)} disabled={deleting}>Отмена</button>
            <button className={cn('ao-btn', 'ao-btn--danger')} onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Удалить
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
