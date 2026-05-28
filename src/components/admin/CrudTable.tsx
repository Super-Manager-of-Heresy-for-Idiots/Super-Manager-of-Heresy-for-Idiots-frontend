import React, { useState } from 'react';
import { Panel, PanelHeader, Table, Button, AlertDialog, Rune } from '@/components/ao';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface CrudTableProps<T extends { id: string }> {
  title: string;
  data: T[] | undefined;
  columns: Column<T>[];
  isLoading: boolean;
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
  onAdd,
  onEdit,
  onDelete,
  canDelete,
  addLabel = 'Add New',
}: CrudTableProps<T>) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hasActions = !!(onEdit || onDelete);

  const tableColumns = [
    ...columns.map((col, i) => ({
      key: String(i),
      header: col.header,
      width: col.width,
      align: col.align,
      render: (row: T) => {
        if (typeof col.accessor === 'function') {
          return col.accessor(row);
        }
        return String(row[col.accessor] ?? '');
      },
    })),
    ...(hasActions
      ? [
          {
            key: '__actions',
            header: 'Actions',
            width: '100px',
            align: 'right' as const,
            render: (row: T) => (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                    <Rune kind="scroll" size={14} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={canDelete ? !canDelete(row) : false}
                    onClick={() => setDeleteId(row.id)}
                    style={{ color: 'var(--ember)' }}
                  >
                    <Rune kind="x" size={14} />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Panel>
      <PanelHeader
        title={title}
        right={
          <Button variant="primary" size="sm" onClick={onAdd}>
            <Rune kind="plus" size={14} color="var(--bg)" />
            <span style={{ marginLeft: 4 }}>{addLabel}</span>
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ao-skeleton" style={{ height: 40, width: '100%' }} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-faint)' }}>
          <div className="ao-overline" style={{ marginBottom: 4 }}>No items found</div>
          <div style={{ fontSize: 13 }}>Click "{addLabel}" to create one</div>
        </div>
      ) : (
        <Table
          columns={tableColumns}
          data={data as (T & Record<string, unknown>)[]}
          rowKey={(row) => (row as T).id}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId && onDelete) onDelete(deleteId);
          setDeleteId(null);
        }}
        title="Confirm Deletion"
        description="This action cannot be undone. This will permanently delete this item."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Panel>
  );
}
