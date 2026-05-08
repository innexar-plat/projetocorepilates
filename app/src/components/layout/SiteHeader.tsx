'use client';

import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/utils/cn';
import { useTranslations } from 'next-intl';

type Props = {
  locale: Locale;
};

export function SiteHeader({ locale }: Props) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const LINKS = [
    { href: '/', label: t('home') },
    { href: '/planos', label: t('plans') },
    { href: '/aulas', label: t('classes') },
    { href: '/contato', label: t('contact') },
    { href: '/portal/dashboard', label: t('portal') },
    { href: '/admin/dashboard', label: t('admin') },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" locale={locale} className="text-sm font-black uppercase tracking-[0.15em] text-[var(--color-ink)]">
          Core Pilates
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              className={cn(
                'rounded-lg px-2 py-1 text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]',
                pathname === link.href && 'bg-[var(--color-paper-2)] text-[var(--color-ink)]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
