import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="animate-fade-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#1f2e35]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#5f7480]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

