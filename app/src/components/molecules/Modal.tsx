'use client';

import { useEffect, type ReactNode } from 'react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ title, open, onClose, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${SIZE[size]} rounded-2xl bg-white shadow-2xl animate-fade-up`}
        style={{ animationDuration: '200ms' }}
      >
        <div className="flex items-center justify-between border-b border-[#f0ebe0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1f2e35]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#8097a3] hover:text-[#1f2e35] transition-colors text-xl leading-none"
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-[#f0ebe0] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

