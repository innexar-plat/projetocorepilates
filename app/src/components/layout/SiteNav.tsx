'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { cn } from '@/utils/cn';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';

type Props = { locale: Locale; isAdmin?: boolean };

export function SiteNav({ locale }: Readonly<Props>) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const marketing = getMarketingContent(locale);

  const LINKS = [
    { href: '/',        label: t('home') },
    { href: '/planos',  label: t('plans') },
    { href: '/aulas',   label: t('classes') },
    { href: '/professores', label: marketing.teachersNavLabel },
    { href: '/galeria', label: t('gallery') },
    { href: '/blog',    label: t('blog') },
    { href: '/contato', label: t('contact') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-sm backdrop-saturate-150 transition-all duration-300',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          locale={locale}
          className="flex items-center gap-2 group"
        >
          <img
            src="/logo/brazilian-core-pilates-logo.png"
            alt="Brazilian Core Pilates"
            className={cn(
              'h-14 w-auto transition-all duration-300 group-hover:scale-[1.02]',
            )}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                locale={locale}
                className={cn(
                  'relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200',
                  active
                    ? 'text-[var(--color-ink)] bg-[var(--color-paper-2)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]/60',
                  'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:rounded-full after:bg-[var(--color-brand)]',
                  active ? 'after:w-4' : 'after:w-0 hover:after:w-4 after:transition-all after:duration-300',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher variant="light" />
          <Link
            href="/login"
            locale={locale}
            className={cn(
              'rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors duration-200',
              'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]',
            )}
          >
            {t('login')}
          </Link>
          <Link
            href="/cadastro"
            locale={locale}
            className="rounded-full bg-[var(--color-brand)] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition-all hover:bg-[var(--color-brand-dark)] hover:scale-[1.03]"
          >
            {t('bookClass')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher variant="light" />
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0',
          'border-t border-[var(--color-border)]/60 bg-white/98',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-[var(--color-paper-2)] text-[var(--color-ink)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]',
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-[var(--color-border)] pt-3">
            <Link
              href="/login"
              locale={locale}
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-[var(--color-border)] py-2 text-center text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {t('login')}
            </Link>
            <Link
              href="/cadastro"
              locale={locale}
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-[var(--color-brand)] py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[var(--color-brand-dark)]"
            >
              {t('bookClass')}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
