'use client';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useState } from 'react';
import { websiteService } from '@/services/website.service';
import { useTranslations } from 'next-intl';

export function ContactForm() {
  const t = useTranslations('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    try {
      await websiteService.createLead({
        name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        source: 'website',
      });

      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : t('errorFallback'));
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-black text-emerald-800">{t('success')}</p>
          <p className="mt-1 text-sm text-emerald-600">{t('successSubtext')}</p>
        </div>
        <button
          onClick={() => setStatus('idle')}
          className="mt-2 text-sm font-medium text-emerald-700 underline underline-offset-2"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('nameLabel')}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('emailLabel')}
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {t('phoneLabel')} <span className="font-normal normal-case">(opcional)</span>
        </label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('phonePlaceholder')}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {t('messageLabel')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('messagePlaceholder')}
          rows={4}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/60 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
        />
      </div>

      {status === 'error' && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('submitting')}
          </span>
        ) : t('submit')}
      </Button>
    </form>
  );
}

