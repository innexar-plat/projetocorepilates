'use client';

import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { authService } from '@/services/auth.service';
import { useTranslations } from 'next-intl';

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('auth.register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      await authService.register({ name, email, password, phone });

      setStatus(t('success'));
      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errorFallback');
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-3xl p-7 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">Membership</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{t('title')}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Create your account and start your journey today.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('name')}
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} required className="bg-white/80" autoComplete="name" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('email')}
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} required className="bg-white/80" autoComplete="email" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('phone')}
          </label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phone')} className="bg-white/80" autoComplete="tel" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('password')}
          </label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} required className="bg-white/80" autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full rounded-xl py-2.5" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>

      {status ? (
        <p className="mt-4 rounded-xl border border-[var(--color-border)] bg-white/70 px-3 py-2 text-sm text-[var(--color-muted)]">{status}</p>
      ) : null}

      <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
        {t('hasAccount')} {' '}
        <Link href="/login" className="font-semibold text-[var(--color-brand)] hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
