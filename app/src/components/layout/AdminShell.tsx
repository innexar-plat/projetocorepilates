'use client';

import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/utils/cn';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { signOut } from 'next-auth/react';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type Props = {
  locale: Locale;
  children: ReactNode;
};

export function AdminShell({ locale, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations('admin');

  const NAV: NavItem[] = [
    { href: '/admin/dashboard',   label: t('nav.dashboard'),       icon: 'DB' },
    { href: '/admin/users',       label: t('nav.students'),        icon: 'US' },
    { href: '/admin/perfis',      label: t('nav.healthProfiles'),  icon: 'PF' },
    { href: '/admin/leads',       label: t('nav.leads'),           icon: 'LD' },
    { href: '/admin/classes',     label: t('nav.classes'),         icon: 'CL' },
    { href: '/admin/sessoes',     label: t('nav.sessions'),        icon: 'SS' },
    { href: '/admin/reservas',    label: t('nav.bookings'),        icon: 'BK' },
    { href: '/admin/planos',      label: t('nav.plans'),           icon: 'PL' },
    { href: '/admin/assinaturas', label: t('nav.subscriptions'),   icon: 'SB' },
    { href: '/admin/financeiro',  label: t('nav.finance'),         icon: 'FN' },
    { href: '/admin/suporte',     label: t('nav.support'),         icon: 'SP' },
    { href: '/admin/blog',        label: t('nav.blog'),            icon: 'BL' },
    { href: '/admin/galeria',     label: t('nav.gallery'),         icon: 'GL' },
    { href: '/admin/configuracoes', label: t('nav.settings'),      icon: 'ST' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f3f8fa]">
      {/* â”€â”€ Mobile overlay â”€â”€ */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* â”€â”€ Sidebar â”€â”€ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col',
          'bg-gradient-to-b from-[#100d07] via-[#181208] to-[#100d07]',
          'border-r border-[#2a2014] shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo / brand */}
        <div className="flex h-16 items-center gap-3 border-b border-[#2a2014] px-5">
          <span className="text-xl font-black tracking-tight text-[#3c8ea8]">CORE</span>
          <span className="text-xl font-light text-white/60">Pilates</span>
          <span className="ml-auto rounded-full bg-[#3c8ea8]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#3c8ea8]">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">{t('panel')}</p>
          <ul className="space-y-0.5">
            {NAV.map((item, i) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link
                    href={item.href}
                    locale={locale}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      'transition-all duration-200',
                      active
                        ? 'bg-[#3c8ea8] text-[#100d07] shadow-lg shadow-[#3c8ea8]/20'
                        : 'text-white/55 hover:bg-white/5 hover:text-white/90',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg text-base',
                        'transition-colors duration-200',
                        active
                          ? 'bg-[#100d07]/20 text-[#100d07]'
                          : 'bg-white/5 text-white/30 group-hover:bg-white/8 group-hover:text-[#3c8ea8]',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#100d07]/40" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[#2a2014] p-4">
          <Link
            href="/"
            locale={locale}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/35 transition hover:bg-white/5 hover:text-white/60"
          >
            <span>{'<-'}</span>
            <span>{t('backToSite')}</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-white/40 transition hover:bg-white/5 hover:text-white/80"
          >
            <span>[ ]</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* â”€â”€ Content â”€â”€ */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#e5dfc9] bg-white/80 px-6 backdrop-blur-md">
          <button
            className="rounded-lg p-2 text-[#5f7480] transition hover:bg-[#eef4f6] md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Active route label */}
          <div className="flex items-center gap-2 text-sm text-[#5f7480]">
            {NAV.map((item) =>
              pathname === item.href ? (
                <span key={item.href} className="font-semibold text-[#1f2e35]">
                  {item.label}
                </span>
              ) : null,
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <span className="hidden text-xs text-[#5f7480] sm:block">{t('title')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3c8ea8] text-[10px] font-black text-[#100d07]">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

