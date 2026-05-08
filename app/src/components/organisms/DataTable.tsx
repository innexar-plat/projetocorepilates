import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  className?: string;
};

type Props<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  rows: T[];
  keyField?: keyof T;
  emptyText?: string;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField,
  emptyText = 'Nenhum registro encontrado.',
  className,
}: Props<T>) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-[#e5dfc9] bg-white shadow-sm', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#eef4f6]">
          <thead>
            <tr className="bg-[#faf7f0]">
              {columns.map((col, colIndex) => (
                <th
                  key={`${String(col.key)}-${colIndex}`}
                  className={cn(
                    'px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f7480]',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f0e5]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-sm text-[#5f7480]"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={keyField ? String(row[keyField]) : i}
                  className="animate-fade-in transition-colors hover:bg-[#f7fbfc]"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={`${String(col.key)}-${colIndex}`}
                      className={cn('px-5 py-3.5 text-sm text-[#1f2e35]', col.className)}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

