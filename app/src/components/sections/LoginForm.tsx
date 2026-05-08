'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError(t('invalidCredentials'));
      return;
    }

    const session = await getSession();
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/portal');
    }
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-3xl p-7 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">Portal</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{t('title')}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Use your account credentials to continue.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {t('email')}
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            autoComplete="email"
            className="bg-white/80"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
              {t('password')}
            </label>
            <Link href="/contato" className="text-xs font-medium text-[var(--color-brand)] hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            autoComplete="current-password"
            className="bg-white/80"
          />
        </div>

        <Button type="submit" className="w-full rounded-xl py-2.5" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
        {t('noAccount')} {' '}
        <Link href="/cadastro" className="font-semibold text-[var(--color-brand)] hover:underline">
          {t('registerLink')}
        </Link>
      </p>
    </div>
  );
}
