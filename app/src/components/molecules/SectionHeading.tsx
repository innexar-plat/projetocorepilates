type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeading({ eyebrow, title, subtitle }: Props) {
  return (
    <header className="space-y-2">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">{title}</h2>
      {subtitle ? <p className="text-sm text-[var(--color-muted)] sm:text-base">{subtitle}</p> : null}
    </header>
  );
}
