import { Pencil, Trash2, Plus } from 'lucide-react';
import { useT } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isRetryableError } from '@/lib/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface CrudTableProps<T extends { id: string }> {
  title: string;
  data: T[] | undefined;
  columns: Column<T>[];
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onAdd: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  canDelete?: (item: T) => boolean;
  addLabel?: string;
}

export function CrudTable<T extends { id: string }>({
  title,
  data,
  columns,
  isLoading,
  isError,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
  canDelete,
  addLabel,
}: CrudTableProps<T>) {
  const t = useT();
  const resolvedAddLabel = addLabel ?? t('cmp2.crud.addNew');
  const renderCell = (item: T, col: Column<T>) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    return String(item[col.accessor] ?? '');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">{title}</h1>
        <Button variant="gold" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {resolvedAddLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-lg text-destructive">{t('cmp2.crud.loadError')}</p>
          {onRetry && isRetryableError(error) && (
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">{t('cmp2.crud.noItems')}</p>
          <p className="text-sm mt-1">{t('cmp2.crud.clickToCreate', { label: resolvedAddLabel })}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((col, i) => (
                  <th key={i} className={`px-4 py-3 text-left text-sm font-semibold ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-4 py-3 text-right text-sm font-semibold w-24">{t('cmp2.crud.actions')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  {columns.map((col, i) => (
                    <td key={i} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-dnd-red hover:text-dnd-red"
                                disabled={canDelete ? !canDelete(item) : false}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('cmp2.crud.areYouSure')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('cmp2.crud.deleteWarning')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(item.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
