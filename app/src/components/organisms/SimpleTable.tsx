import { Card } from '@/components/atoms/Card';

type Column<T> = {
  key: keyof T;
  label: string;
};

type Props<T extends Record<string, unknown>> = {
  title: string;
  rows: T[];
  columns: Array<Column<T>>;
};

export function SimpleTable<T extends Record<string, unknown>>({ title, rows, columns }: Props<T>) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-paper-2)] text-[var(--color-muted)]">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-5 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--color-border)] text-[var(--color-ink)]">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-5 py-3">
                    {String(row[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
