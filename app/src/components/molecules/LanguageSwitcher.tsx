'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English',   flag: 'EN' },
  { code: 'pt', label: 'Portugues', flag: 'PT' },
  { code: 'es', label: 'Espanol',   flag: 'ES' },
] as const;

type Lang = (typeof LANGUAGES)[number]['code'];
type Variant = 'light' | 'dark';

export function LanguageSwitcher({ variant = 'light' }: { variant?: Variant }) {
  const locale = useLocale() as Lang;
  const router  = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const isDark = variant === 'dark';

  function switchLocale(next: Lang) {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        className={[
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold',
          'border transition-all duration-150 select-none',
          isDark
            ? 'border-[#2a2014] bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
            : 'border-[#d4e2e5] bg-white text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8]',
          isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer',
        ].join(' ')}
      >
        <span role="img" aria-label={current.label}>{current.flag}</span>
        <span className="uppercase tracking-wide">{current.code}</span>
        <span
          className={[
            'text-[10px] transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0',
            isDark ? 'text-white/30' : 'text-[#8097a3]',
          ].join(' ')}
        >
          v
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={[
            'absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden',
            'rounded-xl border shadow-xl',
            'transition-opacity duration-150 opacity-100',
            isDark
              ? 'border-[#2a2014] bg-[#181208]'
              : 'border-[#d4e2e5] bg-white',
          ].join(' ')}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(lang.code)}
                className={[
                  'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm',
                  'transition-colors duration-100',
                  isActive
                    ? isDark
                      ? 'bg-[#3c8ea8]/10 font-semibold text-[#3c8ea8]'
                      : 'bg-[#fdf7e8] font-semibold text-[#3c8ea8]'
                    : isDark
                      ? 'text-white/55 hover:bg-white/5 hover:text-white/90'
                      : 'text-[#5f7480] hover:bg-[#f3f8fa] hover:text-[#1f2e35]',
                ].join(' ')}
              >
                <span role="img" aria-label={lang.label} className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-[#3c8ea8]">ok</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

