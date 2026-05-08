import { Card } from '@/components/atoms/Card';

type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: Props) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{value}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--color-muted)]">{hint}</p> : null}
    </Card>
  );
}
