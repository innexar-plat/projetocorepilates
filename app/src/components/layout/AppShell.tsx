'use client';

import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  title: string;
  locale: Locale;
  nav: NavItem[];
  children: ReactNode;
};

export function AppShell({ title, locale, nav, children }: Props) {
  const pathname = usePathname();
  const t = useTranslations('portal');

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr] md:p-6">
        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h1 className="mb-5 text-xs font-black uppercase tracking-[0.15em] text-[var(--color-muted)]">{title}</h1>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                className={cn(
                  'block rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]',
                  pathname === item.href && 'bg-[var(--color-brand)] text-[var(--color-ink)]',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="mt-3 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-left text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
            >
              {t('logout')}
            </button>
          </div>
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
