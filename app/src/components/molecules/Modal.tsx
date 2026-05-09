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

export function Modal({ title, open, onClose, children, footer, size = 'md' }: Readonly<Props>) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${SIZE[size]} max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl animate-fade-up sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl`}
        style={{ animationDuration: '200ms' }}
      >
        <div className="flex items-center justify-between border-b border-[#f0ebe0] px-4 py-4 sm:px-6">
          <h2 className="pr-4 text-sm font-semibold text-[#1f2e35] sm:text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none text-[#8097a3] transition-colors hover:text-[#1f2e35]"
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(100vh-8rem)] sm:px-6 sm:py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-[#f0ebe0] px-4 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

