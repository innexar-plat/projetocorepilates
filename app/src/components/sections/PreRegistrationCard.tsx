'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { websiteService } from '@/services/website.service';
import { getMarketingContent } from '@/lib/site-content';
import type { Locale } from '@/i18n/routing';

type Props = {
  locale: Locale;
  source: string;
  compact?: boolean;
  className?: string;
  onSuccess?: () => void;
};

export function PreRegistrationCard({ locale, source, compact = false, className = '', onSuccess }: Readonly<Props>) {
  const copy = getMarketingContent(locale).preRegistration;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      await websiteService.createLead({
        name,
        email,
        phone,
        source,
      });
      setStatus(copy.success);
      setName('');
      setEmail('');
      setPhone('');
      onSuccess?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 ${className}`.trim()}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-brand)]">{copy.eyebrow}</p>
      <h3 className="mt-2 text-xl font-black text-[var(--color-ink)] sm:text-2xl">{copy.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{copy.subtitle}</p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {copy.nameLabel}
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.nameLabel} required autoComplete="name" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {copy.emailLabel}
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.emailLabel} required autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {copy.phoneLabel}
          </label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={copy.phoneLabel} autoComplete="tel" />
        </div>

        <Button type="submit" className="w-full rounded-2xl py-3 text-sm sm:text-base" disabled={isSubmitting}>
          {isSubmitting ? copy.sending : copy.button}
        </Button>
      </form>

      <p className={`mt-3 text-xs leading-relaxed text-[var(--color-muted)] ${compact ? '' : 'max-w-sm'}`.trim()}>{copy.disclaimer}</p>
      {status ? (
        <p className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-muted)]">
          {status}
        </p>
      ) : null}
    </div>
  );
}