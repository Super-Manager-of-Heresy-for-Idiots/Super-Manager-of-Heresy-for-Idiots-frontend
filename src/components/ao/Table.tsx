import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  style?: React.CSSProperties;
  emptyText?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  className = '',
  style,
  emptyText = 'No records found.',
}: TableProps<T>) {
  return (
    <div className={`ao-table-wrap ${className}`} style={style}>
      <table className="ao-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ao-table__empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={onRowClick ? 'ao-table__row--clickable' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align }}>
                    {col.render
                      ? col.render(row, i)
                      : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
